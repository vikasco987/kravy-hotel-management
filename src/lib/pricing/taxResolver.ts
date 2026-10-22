import prisma from '@/lib/prisma';
import { PricingMode } from '@prisma/client';

export interface ResolvedTaxConfig {
  taxEnabled: boolean;
  taxRate: number; // in basis points, e.g. 1200 for 12%
  taxMode: PricingMode; // 'INCLUSIVE' | 'EXCLUSIVE'
  source: 'ROOM_TYPE_TAX_PROFILE' | 'HOTEL_SETTINGS' | 'DISABLED_ZERO' | 'LEGACY_DEFAULT';
  taxProfileId?: string | null;
  taxProfileName?: string | null;
}

/**
 * Resolves the authoritative tax configuration for a hotel room or room type.
 *
 * Precedence Rules:
 * 1. Room-specific active TaxProfile: If the room/roomType has an assigned TaxProfile that is active,
 *    its rate and mode take precedence.
 * 2. HotelSettings default: Otherwise, the authenticated hotel's HotelSettings (taxRate, taxMode, taxEnabled)
 *    is used if tax is enabled.
 * 3. Disabled GST: If hotelSettings.taxEnabled === false (or taxRate === 0) and no room-specific
 *    profile is active, taxRate is 0 and mode is INCLUSIVE.
 * 4. Legacy / Unconfigured Fallback: If no HotelSettings record exists or taxRate is unconfigured,
 *    safely defaults to 12% INCLUSIVE (rate: 1200, mode: 'INCLUSIVE', taxEnabled: true) to ensure
 *    100% backward compatibility with existing Kravy check-in operations.
 */
export async function resolveTaxConfigForRoom(
  hotelId: string,
  roomTypeId?: string | null
): Promise<ResolvedTaxConfig> {
  try {
    // 1. Check HotelSettings for the hotel first (hotel-wide switch takes precedence)
    const hotelSettings = await prisma.hotelSettings.findUnique({
      where: { hotelId }
    });

    if (hotelSettings) {
      let isTaxEnabled = (hotelSettings as any).taxEnabled !== false;
      let hotelTaxMode: PricingMode = ((hotelSettings as any).taxMode as PricingMode) || 'INCLUSIVE';

      // Verify raw Mongo document in case Prisma client stripped fields
      try {
        const rawDoc: any = await prisma.$runCommandRaw({
          find: 'HotelSettings',
          filter: {
            $or: [
              { hotelId: { $oid: hotelId } },
              { hotelId: hotelId }
            ]
          },
          limit: 1
        });
        const firstDoc = rawDoc?.cursor?.firstBatch?.[0];
        if (firstDoc) {
          if (typeof firstDoc.taxEnabled === 'boolean') {
            isTaxEnabled = firstDoc.taxEnabled;
          }
          if (typeof firstDoc.taxMode === 'string') {
            hotelTaxMode = firstDoc.taxMode as PricingMode;
          }
        }
      } catch (rawErr) {
        // Fall back to hotelSettings values
      }

      const hotelTaxRate = hotelSettings.taxRate ?? 1200;

      // If hotel-wide GST is explicitly disabled, it takes absolute precedence over any room-specific TaxProfile
      if (!isTaxEnabled || hotelTaxRate === 0) {
        return {
          taxEnabled: false,
          taxRate: 0,
          taxMode: 'INCLUSIVE',
          source: 'DISABLED_ZERO'
        };
      }

      // GST is enabled: check if there is an active room-specific TaxProfile override
      if (roomTypeId) {
        const roomType = await prisma.roomType.findUnique({
          where: { id: roomTypeId },
          include: { taxProfile: true }
        });

        if (roomType?.taxProfile && roomType.taxProfile.isActive) {
          return {
            taxEnabled: roomType.taxProfile.rate > 0,
            taxRate: roomType.taxProfile.rate,
            taxMode: roomType.taxProfile.mode || 'INCLUSIVE',
            source: 'ROOM_TYPE_TAX_PROFILE',
            taxProfileId: roomType.taxProfile.id,
            taxProfileName: roomType.taxProfile.name
          };
        }
      }

      // No room-specific TaxProfile override; use the hotel-wide settings
      return {
        taxEnabled: true,
        taxRate: hotelTaxRate,
        taxMode: hotelTaxMode,
        source: 'HOTEL_SETTINGS'
      };
    }

    // 2. Fallback for hotels with no saved HotelSettings:
    // If a room-specific TaxProfile exists, respect it; otherwise default to legacy 12% INCLUSIVE
    if (roomTypeId) {
      const roomType = await prisma.roomType.findUnique({
        where: { id: roomTypeId },
        include: { taxProfile: true }
      });

      if (roomType?.taxProfile && roomType.taxProfile.isActive) {
        return {
          taxEnabled: roomType.taxProfile.rate > 0,
          taxRate: roomType.taxProfile.rate,
          taxMode: roomType.taxProfile.mode || 'INCLUSIVE',
          source: 'ROOM_TYPE_TAX_PROFILE',
          taxProfileId: roomType.taxProfile.id,
          taxProfileName: roomType.taxProfile.name
        };
      }
    }

    // 3. Backward-compatible fallback for unconfigured hotels: 12% INCLUSIVE
    return {
      taxEnabled: true,
      taxRate: 1200,
      taxMode: 'INCLUSIVE',
      source: 'LEGACY_DEFAULT'
    };
  } catch (error) {
    console.error('Error resolving tax config for room:', error);
    return {
      taxEnabled: true,
      taxRate: 1200,
      taxMode: 'INCLUSIVE',
      source: 'LEGACY_DEFAULT'
    };
  }
}
