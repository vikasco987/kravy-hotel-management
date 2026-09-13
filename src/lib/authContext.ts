import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function getAuthContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get('kravy_auth_token')?.value;

  // Fallback to mock logic if NO token is present (for development ONLY), 
  // but let's strictly require a token as requested for production auth.
  if (!token) {
    return null; // Force user to login
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
  } catch (e) {
    console.error("JWT Verification failed", e);
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) return null;

  // Find business (either linked to user or generic fallback for now)
  let business;
  if (user.businessId) {
    business = await prisma.business.findUnique({ where: { id: user.businessId } });
  } 
  
  if (!business) {
    business = await prisma.business.findFirst({ where: { createdBy: user.id } });
    if (!business) {
      business = await prisma.business.create({
        data: { 
          name: `${user.name || 'User'}'s Business`,
          createdBy: user.id
        }
      });
    }
    // Link user to business
    await prisma.user.update({
      where: { id: user.id },
      data: { businessId: business.id }
    });
  }

  // Find or create Hotel for this business
  let hotel = await prisma.hotel.findFirst({
    where: { businessId: business.id }
  });

  if (!hotel) {
    hotel = await prisma.hotel.create({
      data: {
        businessId: business.id,
        name: 'Kravy Grand Hotel',
        createdBy: user.id
      }
    });

    // Create default room types since we are at it
    await prisma.roomType.createMany({
      data: [
        { hotelId: hotel.id, name: 'Standard', basePrice: 150000 },
        { hotelId: hotel.id, name: 'Deluxe', basePrice: 250000 },
        { hotelId: hotel.id, name: 'Suite', basePrice: 500000 },
      ]
    });
  }

  return { user, business, hotel };
}
