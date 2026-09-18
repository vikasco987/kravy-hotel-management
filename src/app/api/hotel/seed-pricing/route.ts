import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Seed endpoint is only available in development mode' }, { status: 403 });
  }

  try {
    // 1. Ensure a dummy business & hotel exist
    let business = await prisma.business.findFirst();
    if (!business) {
      business = await prisma.business.create({
        data: { name: 'Kravy Test Business' }
      });
    }

    let hotel = await prisma.hotel.findFirst({ where: { businessId: business.id } });
    if (!hotel) {
      hotel = await prisma.hotel.create({
        data: { name: 'Kravy Test Hotel', businessId: business.id }
      });
    }

    // Settings
    await prisma.hotelSettings.upsert({
      where: { hotelId: hotel.id },
      update: { maxDiscountPercent: 10, maxFixedDiscount: 100000 },
      create: { hotelId: hotel.id, maxDiscountPercent: 10, maxFixedDiscount: 100000 }
    });

    // 2. Tax Profile (12% GST)
    let taxProfile = await prisma.taxProfile.findFirst({ where: { hotelId: hotel.id, rate: 1200 } });
    if (!taxProfile) {
      taxProfile = await prisma.taxProfile.create({
        data: {
          hotelId: hotel.id,
          name: 'GST 12%',
          rate: 1200,
          cgstRate: 600,
          sgstRate: 600,
          mode: 'INCLUSIVE',
        }
      });
    }

    // 3. Room Type (Deluxe)
    let roomType = await prisma.roomType.findFirst({ where: { hotelId: hotel.id, name: 'Deluxe' } });
    if (!roomType) {
      roomType = await prisma.roomType.create({
        data: {
          hotelId: hotel.id,
          name: 'Deluxe',
          basePrice: 250000, // 2500 in paise
          taxProfileId: taxProfile.id
        }
      });
    }

    // 4. Rate Plans
    let standardPlan = await prisma.ratePlan.findFirst({ where: { hotelId: hotel.id, name: 'Standard Rate' } });
    if (!standardPlan) {
      standardPlan = await prisma.ratePlan.create({
        data: {
          hotelId: hotel.id,
          name: 'Standard Rate',
          rules: {
            create: [{
              roomTypeId: roomType.id,
              priority: 0,
              basePrice: 250000,
              daysOfWeek: [0,1,2,3,4,5,6]
            }]
          }
        }
      });
    }

    let weekendPlan = await prisma.ratePlan.findFirst({ where: { hotelId: hotel.id, name: 'Weekend Rate' } });
    if (!weekendPlan) {
      weekendPlan = await prisma.ratePlan.create({
        data: {
          hotelId: hotel.id,
          name: 'Weekend Rate',
          rules: {
            create: [{
              roomTypeId: roomType.id,
              priority: 10, // Higher priority overrides standard
              basePrice: 300000, // 3000 in paise
              daysOfWeek: [0, 6] // Sunday, Saturday
            }]
          }
        }
      });
    }

    // 5. Floor & Rooms
    let floor = await prisma.floor.findFirst({ where: { hotelId: hotel.id } });
    if (!floor) {
      floor = await prisma.floor.create({
        data: { hotelId: hotel.id, name: '1st Floor', floorNumber: 1 }
      });
    }

    const roomNames = ['101', '102'];
    for (const roomNum of roomNames) {
      let room = await prisma.room.findFirst({ where: { hotelId: hotel.id, roomNumber: roomNum } });
      if (!room) {
        await prisma.room.create({
          data: {
            hotelId: hotel.id,
            floorId: floor.id,
            roomTypeId: roomType.id,
            roomNumber: roomNum,
            status: 'AVAILABLE'
          }
        });
      }
    }

    // 6. Charge Template
    let extraBed = await prisma.chargeTemplate.findFirst({ where: { hotelId: hotel.id, name: 'Extra Bed' } });
    if (!extraBed) {
      extraBed = await prisma.chargeTemplate.create({
        data: {
          hotelId: hotel.id,
          name: 'Extra Bed',
          defaultRate: 50000, // 500 in paise
          mode: 'DAILY',
          taxProfileId: taxProfile.id
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Seeded development data successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Seed failed' }, { status: 500 });
  }
}
