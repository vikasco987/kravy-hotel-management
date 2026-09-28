import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAuth() {
  const users = await prisma.user.findMany({ take: 5 });
  const staffs = await prisma.staff.findMany({ take: 5 });
  const businesses = await prisma.business.findMany({ take: 5 });
  const hotels = await prisma.hotel.findMany({ take: 5 });
  
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email, businessId: u.businessId, role: u.role, ownerId: u.ownerId })));
  console.log("Staffs:", staffs.map(s => ({ id: s.id, email: s.email, businessId: s.businessId })));
  console.log("Businesses:", businesses.map(b => ({ id: b.id, name: b.name, createdBy: b.createdBy })));
  console.log("Hotels:", hotels.map(h => ({ id: h.id, name: h.name, businessId: h.businessId })));
}

testAuth()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
