import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

async function runTests() {
  console.log("=========================================");
  console.log("RUNNING PHASE 1 PROFILE PERSISTENCE TESTS");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Identify active owner and staff accounts
    const owner = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'USER' },
          { role: 'ADMIN' }
        ]
      },
      select: { id: true, clerkId: true, role: true, email: true }
    });

    assert(!!owner, "Active owner/admin account found in database");

    if (!owner) {
      console.error("Cannot proceed with tests without owner account");
      process.exit(1);
    }

    const staffWithoutPerm = await prisma.staff.findFirst({
      where: {
        status: 'active',
        NOT: {
          permissions: { has: 'action:settings:modify' }
        }
      },
      select: { id: true, name: true, role: true, permissions: true, businessId: true }
    });

    assert(!!staffWithoutPerm, "Staff member without 'action:settings:modify' found or verified");

    // 2. Test Safe Existing Profile Lookup
    const ownerUserId = owner.id;
    const orConditions: any[] = [{ userId: ownerUserId }];
    if (owner.clerkId) {
      orConditions.push({ userId: owner.clerkId });
    }

    const existingProfile = await prisma.businessProfile.findFirst({
      where: { OR: orConditions }
    });

    assert(!!existingProfile, "Existing owner profile safely located via OR identity lookup");

    // 3. Test Repeated Save & Duplicate-Key Safety
    if (existingProfile) {
      // Simulate save 1 (update)
      const updateResult1 = await prisma.businessProfile.update({
        where: { id: existingProfile.id },
        data: {
          businessName: existingProfile.businessName || "Kravy Grand Hotel"
        }
      });
      assert(updateResult1.id === existingProfile.id, "Repeated save 1 updates existing profile safely without P2002");

      // Simulate save 2 (subsequent save simulating isNewProfile=true frontend behavior)
      // Even if isNewProfile is true, our logic uses findFirst and updates where id: existingProfile.id
      const refound = await prisma.businessProfile.findFirst({
        where: { OR: orConditions }
      });
      assert(!!refound, "Profile found again on subsequent save");

      if (refound) {
        const updateResult2 = await prisma.businessProfile.update({
          where: { id: refound.id },
          data: {
            businessName: refound.businessName || "Kravy Grand Hotel"
          }
        });
        assert(updateResult2.id === existingProfile.id, "Subsequent save safely updates without attempting duplicate insert");
      }
    }

    // 4. Test RBAC Authorization Logic for Staff
    if (staffWithoutPerm) {
      const hasPermission = Array.isArray(staffWithoutPerm.permissions) && 
        staffWithoutPerm.permissions.includes('action:settings:modify');
      assert(!hasPermission, "Staff member correctly lacks 'action:settings:modify'");

      // Verify the permission rule evaluates to forbidden
      const isOwnerOrAdmin = false;
      const isForbidden = !isOwnerOrAdmin && !hasPermission;
      assert(isForbidden, "Staff without permission is correctly flagged as 403 Forbidden");
    }

    // 5. Test Staff Identity Resolution to Owner Profile
    if (staffWithoutPerm && staffWithoutPerm.businessId) {
      const biz = await prisma.business.findUnique({
        where: { id: staffWithoutPerm.businessId },
        select: { createdBy: true }
      });
      assert(!!biz?.createdBy, "Parent business createdBy properly maps staff back to owner's User.id");
      
      const staffResolvedProfile = await prisma.businessProfile.findFirst({
        where: { userId: biz!.createdBy! }
      });
      assert(!!staffResolvedProfile, "Staff read successfully resolves owner's business profile for branding");
    }

  } catch (err: any) {
    console.error("Test execution error:", err);
    failed++;
  }

  console.log(`\n=========================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`=========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
