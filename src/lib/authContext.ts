import prisma from '@/lib/prisma';
import { getAuthUser } from './auth-utils';
import { cache } from 'react';

export const getAuthContext = cache(async () => {
  const authUser = await getAuthUser();

  if (!authUser) {
    return null;
  }

  let business;
  if (authUser.businessId && authUser.businessId.length === 24) {
    try {
      business = await prisma.business.findUnique({ where: { id: authUser.businessId } });
    } catch (e) {
      console.warn("Invalid businessId in authUser:", authUser.businessId);
    }
  }

  if (!business && (authUser.type === 'OWNER' || authUser.type === 'ADMIN' || authUser.type === 'USER')) {
    business = await prisma.business.findFirst({ where: { createdBy: authUser.id } });
    if (!business) {
      business = await prisma.business.create({
        data: { 
          name: `${authUser.name || 'User'}'s Business`,
          createdBy: authUser.id
        }
      });
    }
  }

  if (!business) return null;

  let hotel = await prisma.hotel.findFirst({
    where: { businessId: business.id }
  });

  if (!hotel && (authUser.type === 'OWNER' || authUser.type === 'ADMIN' || authUser.type === 'USER')) {
    hotel = await prisma.hotel.create({
      data: {
        businessId: business.id,
        name: 'Kravy Grand Hotel',
        createdBy: authUser.id
      }
    });

    await prisma.roomType.createMany({
      data: [
        { hotelId: hotel.id, name: 'Standard', basePrice: 1500 },
        { hotelId: hotel.id, name: 'Deluxe', basePrice: 2500 },
        { hotelId: hotel.id, name: 'Suite', basePrice: 5000 },
      ]
    });
  }

  return { user: authUser, business, hotel };
});
