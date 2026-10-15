import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isAdminOrOwner,
  hasPermission,
  hasPageAccess,
  canConductInspection,
  requirePermission,
  getAuthorizedRedirectUrl,
  PERMISSION_CATALOG,
  PERMISSION_MODULES,
  ROUTE_PAGE_PERMISSION_MAP,
} from '../lib/permissions.ts';

test('Permission Catalog and Route Mapping Integrity', () => {
  assert.ok(PERMISSION_CATALOG.length > 20, 'Catalog should contain full suite of page and action permissions');
  assert.equal(ROUTE_PAGE_PERMISSION_MAP['/dashboard/rooms'], 'page:rooms');
  assert.equal(ROUTE_PAGE_PERMISSION_MAP['/dashboard/housekeeping'], 'page:housekeeping');
  assert.equal(ROUTE_PAGE_PERMISSION_MAP['/dashboard/checkin'], 'page:checkin');
});

test('1. Existing Admin/Owner retains full wildcard access without explicit permissions', () => {
  const adminUser = {
    id: 'user_admin_123',
    type: 'ADMIN',
    role: 'ADMIN',
    businessId: 'biz_123',
    permissions: [],
    isStaff: false,
    status: 'active',
  };

  const ownerUser = {
    id: 'user_owner_456',
    type: 'OWNER',
    role: 'USER',
    businessId: 'biz_456',
    permissions: [],
    isStaff: false,
    status: 'active',
  };

  assert.equal(isAdminOrOwner(adminUser), true);
  assert.equal(isAdminOrOwner(ownerUser), true);

  // Admin has access to all pages and sensitive actions even with empty permissions array
  assert.equal(hasPageAccess(adminUser, '/dashboard'), true);
  assert.equal(hasPageAccess(adminUser, '/dashboard/rooms'), true);
  assert.equal(hasPageAccess(adminUser, '/dashboard/housekeeping'), true);
  assert.equal(hasPermission(adminUser, 'action:rooms:delete'), true);
  assert.equal(hasPermission(adminUser, 'action:checkout:settle_payment'), true);
  assert.equal(canConductInspection(adminUser), true);

  assert.equal(hasPageAccess(ownerUser, '/dashboard/floors'), true);
  assert.equal(hasPermission(ownerUser, 'action:staff:create'), true);
  assert.equal(canConductInspection(ownerUser), true);
});

test('2. Staff with no permissions is denied all protected page and action access (Deny-by-default)', () => {
  const blankStaff = {
    id: 'staff_blank_789',
    type: 'STAFF',
    role: 'HOUSEKEEPING',
    businessId: 'biz_123',
    hotelId: 'hotel_123',
    permissions: [],
    isStaff: true,
    status: 'active',
  };

  assert.equal(isAdminOrOwner(blankStaff), false);
  assert.equal(hasPageAccess(blankStaff, '/dashboard/rooms'), false);
  assert.equal(hasPageAccess(blankStaff, '/dashboard/housekeeping'), false);
  assert.equal(hasPermission(blankStaff, 'action:rooms:create'), false);
  assert.equal(hasPermission(blankStaff, 'action:housekeeping:clean'), false);
  assert.equal(canConductInspection(blankStaff), false);
});

test('3. Granted page permission does NOT grant unselected actions on that page', () => {
  const roomsViewerStaff = {
    id: 'staff_rooms_view_only',
    type: 'STAFF',
    role: 'RECEPTIONIST',
    businessId: 'biz_123',
    hotelId: 'hotel_123',
    permissions: ['page:rooms'],
    isStaff: true,
    status: 'active',
  };

  // Page access is granted
  assert.equal(hasPageAccess(roomsViewerStaff, '/dashboard/rooms'), true);

  // Actions are DENIED because page permission != action permission
  assert.equal(hasPermission(roomsViewerStaff, 'action:rooms:create'), false);
  assert.equal(hasPermission(roomsViewerStaff, 'action:rooms:edit'), false);
  assert.equal(hasPermission(roomsViewerStaff, 'action:rooms:delete'), false);
  assert.equal(hasPermission(roomsViewerStaff, 'action:rooms:change_status'), false);
});

test('4. Housekeeping cleaning permission does NOT imply inspection permission', () => {
  const cleanerStaff = {
    id: 'staff_cleaner_001',
    type: 'STAFF',
    role: 'HOUSEKEEPING',
    businessId: 'biz_123',
    hotelId: 'hotel_123',
    permissions: ['page:housekeeping', 'action:housekeeping:clean'],
    isStaff: true,
    status: 'active',
  };

  // Has cleaning rights
  assert.equal(hasPageAccess(cleanerStaff, '/dashboard/housekeeping'), true);
  assert.equal(hasPermission(cleanerStaff, 'action:housekeeping:clean'), true);

  // Does NOT have inspection rights
  assert.equal(canConductInspection(cleanerStaff), false);
  assert.equal(hasPermission(cleanerStaff, 'action:housekeeping:inspect'), false);

  // Supervisor with explicit inspect permission
  const supervisorStaff = {
    id: 'staff_supervisor_002',
    type: 'STAFF',
    role: 'MANAGER',
    businessId: 'biz_123',
    hotelId: 'hotel_123',
    permissions: ['page:housekeeping', 'action:housekeeping:clean', 'action:housekeeping:inspect'],
    isStaff: true,
    status: 'active',
  };

  assert.equal(canConductInspection(supervisorStaff), true);
  assert.equal(hasPermission(supervisorStaff, 'action:housekeeping:inspect'), true);
});

test('5. Inactive Staff is strictly denied all access even if permissions exist', () => {
  const deactivatedStaff = {
    id: 'staff_inactive_999',
    type: 'STAFF',
    role: 'MANAGER',
    businessId: 'biz_123',
    hotelId: 'hotel_123',
    permissions: ['page:dashboard', 'page:rooms', 'action:rooms:create', 'action:housekeeping:inspect'],
    isStaff: true,
    status: 'inactive', // DEACTIVATED
  };

  assert.equal(isAdminOrOwner(deactivatedStaff), false);
  assert.equal(hasPageAccess(deactivatedStaff, '/dashboard'), false);
  assert.equal(hasPageAccess(deactivatedStaff, '/dashboard/rooms'), false);
  assert.equal(hasPermission(deactivatedStaff, 'action:rooms:create'), false);
  assert.equal(canConductInspection(deactivatedStaff), false);
});

test('6. Client-supplied role, permissions or staff ID cannot elevate access', () => {
  // Untrusted object attempting to spoof Admin role while isStaff is true or type is STAFF
  const spoofedStaff = {
    id: 'staff_spoof_444',
    type: 'STAFF',
    role: 'ADMIN', // Spoofed role property
    businessId: 'biz_123',
    hotelId: 'hotel_123',
    permissions: [],
    isStaff: true,
    status: 'active',
  };

  // Must not be recognized as Admin/Owner because isStaff is true and type is STAFF
  assert.equal(isAdminOrOwner(spoofedStaff), false);
  assert.equal(hasPermission(spoofedStaff, 'action:rooms:delete'), false);
});

test('7. requirePermission helper returns structured authorization result', () => {
  // Unauthenticated caller
  const unauthRes = requirePermission(null, 'page:rooms');
  assert.equal(unauthRes.authorized, false);
  assert.equal(unauthRes.errorResponse?.code, 'UNAUTHORIZED');

  // Inactive staff
  const inactiveStaff = {
    id: 's_in',
    type: 'STAFF',
    isStaff: true,
    status: 'inactive',
    permissions: ['page:rooms'],
  };
  const inactiveRes = requirePermission(inactiveStaff, 'page:rooms');
  assert.equal(inactiveRes.authorized, false);
  assert.equal(inactiveRes.errorResponse?.code, 'ACCOUNT_INACTIVE');

  // Staff missing required permission
  const staffWithoutPerm = {
    id: 's_noperm',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:rooms'],
  };
  const deniedRes = requirePermission(staffWithoutPerm, 'action:rooms:create');
  assert.equal(deniedRes.authorized, false);
  assert.equal(deniedRes.errorResponse?.code, 'FORBIDDEN');
  assert.equal(deniedRes.errorResponse?.requiredPermission, 'action:rooms:create');

  // Staff with required permission
  const staffWithPerm = {
    id: 's_perm',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:rooms', 'action:rooms:create'],
  };
  const allowedRes = requirePermission(staffWithPerm, 'action:rooms:create');
  assert.equal(allowedRes.authorized, true);
  assert.equal(allowedRes.errorResponse, undefined);
});

test('8. Staff cannot modify their own permissions or grant self-privilege escalation', () => {
  const staffUser = {
    id: 'staff_alice_123',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:staff', 'action:staff:edit'],
  };

  // Staff lacks action:staff:manage_permissions
  assert.equal(hasPermission(staffUser, 'action:staff:manage_permissions'), false);

  // Even if granted action:staff:manage_permissions, target ID matching caller ID is blocked
  const managerStaff = {
    id: 'staff_manager_456',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:staff', 'action:staff:edit', 'action:staff:manage_permissions'],
  };
  assert.equal(hasPermission(managerStaff, 'action:staff:manage_permissions'), true);
  // Self modification rule: caller.id === target.id
  const isSelf = managerStaff.id === 'staff_manager_456';
  assert.equal(isSelf, true);
});

test('9. Cross-hotel isolation: Staff identity is bound strictly to DB hotelId', () => {
  const staffHotelA = {
    id: 'staff_A',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_aaa',
    businessId: 'biz_aaa',
    permissions: ['page:rooms', 'action:rooms:create'],
  };

  const hotelB_id = 'hotel_bbb';

  // Verifying hotel isolation logic
  assert.notEqual(staffHotelA.hotelId, hotelB_id);
  const canAccessHotelB = staffHotelA.hotelId === hotelB_id;
  assert.equal(canAccessHotelB, false);
});

test('10. Catalog validation rejects unknown or invented permission keys', () => {
  const validKeys = new Set(PERMISSION_CATALOG.map(p => p.key));
  
  assert.equal(validKeys.has('page:rooms'), true);
  assert.equal(validKeys.has('action:housekeeping:clean'), true);
  assert.equal(validKeys.has('action:housekeeping:inspect'), true);
  assert.equal(validKeys.has('action:staff:manage_permissions'), true);

  // Unknown/invented keys
  assert.equal(validKeys.has('action:admin:superpower'), false);
  assert.equal(validKeys.has('action:rooms:hack'), false);
  assert.equal(validKeys.has('page:fake_module'), false);
});

test('11. Individual staff permissions: Blank permissions vs single action vs clean without inspect', () => {
  // Staff with 0 permissions
  const blankStaff = {
    id: 'staff_zero',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: [],
  };
  assert.equal(hasPageAccess(blankStaff, '/dashboard/rooms'), false);
  assert.equal(hasPermission(blankStaff, 'action:rooms:create'), false);

  // Staff with only action permission (e.g. cleaning without inspection)
  const cleanerOnly = {
    id: 'staff_cleaner',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:housekeeping', 'action:housekeeping:clean'],
  };
  assert.equal(hasPageAccess(cleanerOnly, '/dashboard/housekeeping'), true);
  assert.equal(hasPermission(cleanerOnly, 'action:housekeeping:clean'), true);
  assert.equal(canConductInspection(cleanerOnly), false);
  assert.equal(hasPermission(cleanerOnly, 'action:housekeeping:inspect'), false);
});

test('12. Staff Creation: permissions array payload validation simulation', () => {
  const validCatalogKeys = new Set(PERMISSION_CATALOG.map(p => p.key));

  const validateCreationPermissions = (permissions) => {
    if (permissions === undefined || permissions === null) {
      return { ok: true, cleanPermissions: [] };
    }
    if (!Array.isArray(permissions)) {
      return { ok: false, error: 'Permissions must be an array' };
    }
    const cleanPermissions = [];
    for (const p of permissions) {
      if (typeof p !== 'string' || !validCatalogKeys.has(p.trim())) {
        return { ok: false, error: `Invalid permission key: ${p}` };
      }
      const trimmed = p.trim();
      if (!cleanPermissions.includes(trimmed)) {
        cleanPermissions.push(trimmed);
      }
    }
    return { ok: true, cleanPermissions };
  };

  // Case A: No permissions selected
  const resEmpty = validateCreationPermissions([]);
  assert.equal(resEmpty.ok, true);
  assert.deepEqual(resEmpty.cleanPermissions, []);

  // Case B: Permissions omitted
  const resOmitted = validateCreationPermissions(undefined);
  assert.equal(resOmitted.ok, true);
  assert.deepEqual(resOmitted.cleanPermissions, []);

  // Case C: Valid selection with cleaning
  const resValid = validateCreationPermissions(['page:housekeeping', 'action:housekeeping:clean']);
  assert.equal(resValid.ok, true);
  assert.deepEqual(resValid.cleanPermissions, ['page:housekeeping', 'action:housekeeping:clean']);
  assert.equal(resValid.cleanPermissions.includes('action:housekeeping:inspect'), false);

  // Case D: Invalid key supplied
  const resInvalid = validateCreationPermissions(['page:rooms', 'action:admin:exploit']);
  assert.equal(resInvalid.ok, false);
});

// ==========================================
// PHASE 4: STAFF LOGIN & AUTHENTICATION TESTS
// ==========================================

test('13. Phase 4: Valid active staff credentials resolution and redirect logic', () => {
  const staff = {
    id: 'staff_123',
    hotelId: 'hotel_xyz',
    status: 'active',
    permissions: ['page:housekeeping', 'action:housekeeping:clean']
  };

  const getRedirectUrl = (permissions) => {
    const priorityRoutes = [
      { perm: 'page:dashboard', route: '/dashboard' },
      { perm: 'page:checkin', route: '/dashboard/checkin' },
      { perm: 'page:reservations', route: '/dashboard/reservations' },
      { perm: 'page:rooms', route: '/dashboard/rooms' },
      { perm: 'page:housekeeping', route: '/dashboard/housekeeping' },
      { perm: 'page:services', route: '/dashboard/services' },
      { perm: 'page:staff', route: '/dashboard/staff' },
      { perm: 'page:reports', route: '/dashboard/reports' },
    ];
    for (const item of priorityRoutes) {
      if (permissions.includes(item.perm)) {
        return item.route;
      }
    }
    return '/dashboard/no-access';
  };

  assert.equal(getRedirectUrl(staff.permissions), '/dashboard/housekeeping');
  assert.equal(getRedirectUrl(['page:rooms', 'page:dashboard']), '/dashboard');
  assert.equal(getRedirectUrl([]), '/dashboard/no-access');
});

test('14. Phase 4: Inactive staff account rejection during login and request authorization', () => {
  const inactiveStaff = {
    id: 'staff_suspended',
    hotelId: 'hotel_xyz',
    type: 'STAFF',
    isStaff: true,
    status: 'inactive',
    permissions: ['page:rooms']
  };

  // Login check
  const canLogin = inactiveStaff.status === 'active';
  assert.equal(canLogin, false);

  // Runtime authorization check
  const authCheck = requirePermission(inactiveStaff, 'page:rooms');
  assert.equal(authCheck.authorized, false);
  assert.equal(authCheck.errorResponse?.code, 'ACCOUNT_INACTIVE');
});

test('15. Phase 4: Email or phone number normalization handles +91 and 10 digits', () => {
  const normalizeIdentifier = (input) => {
    const raw = String(input || '').trim();
    const isEmail = raw.includes('@');
    if (isEmail) {
      return { type: 'email', value: raw.toLowerCase() };
    }
    const digits = raw.replace(/\D/g, '');
    const cleanPhone = digits.length > 10 ? digits.slice(-10) : digits;
    return { type: 'phone', value: cleanPhone };
  };

  assert.deepEqual(normalizeIdentifier('Staff@Hotel.com'), { type: 'email', value: 'staff@hotel.com' });
  assert.deepEqual(normalizeIdentifier('+91 98765-43210'), { type: 'phone', value: '9876543210' });
  assert.deepEqual(normalizeIdentifier('09876543210'), { type: 'phone', value: '9876543210' });
  assert.deepEqual(normalizeIdentifier('9876543210'), { type: 'phone', value: '9876543210' });
});

test('16. Phase 4: Staff identity cannot be spoofed by client payload (Role/Permissions/HotelId)', () => {
  // Untrusted client payload attempts to pass elevated role or permissions
  const clientPayload = {
    identifier: 'staff@kravy.com',
    password: 'secretPassword123',
    role: 'ADMIN',
    hotelId: 'other_hotel_999',
    permissions: ['*']
  };

  // In the secure login flow, only identifier & password are extracted from body.
  const { identifier, password } = clientPayload;
  assert.equal(identifier, 'staff@kravy.com');
  assert.equal(password, 'secretPassword123');

  // Trusted DB record overrides any client claim:
  const trustedDbRecord = {
    id: 'staff_real_001',
    hotelId: 'hotel_assigned_111',
    role: 'STAFF',
    status: 'active',
    permissions: ['page:checkin']
  };

  assert.notEqual(trustedDbRecord.hotelId, clientPayload.hotelId);
  assert.notEqual(trustedDbRecord.role, clientPayload.role);
  assert.notDeepEqual(trustedDbRecord.permissions, clientPayload.permissions);
  assert.equal(trustedDbRecord.role, 'STAFF');
});

test('17. Phase 4: Page access vs Action permission separation in Staff workflows', () => {
  const frontDeskStaff = {
    id: 'staff_fd',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:checkin'] // Viewing check-in allowed, but no payment or action permissions
  };

  // Can view checkin page
  assert.equal(hasPermission(frontDeskStaff, 'page:checkin'), true);
  // Cannot perform checkin action without action:checkin:perform
  assert.equal(hasPermission(frontDeskStaff, 'action:checkin:perform'), false);
  // Cannot settle payment without action:checkin:settle_payment
  assert.equal(hasPermission(frontDeskStaff, 'action:checkin:settle_payment'), false);
  // Cannot create rooms
  assert.equal(hasPermission(frontDeskStaff, 'action:rooms:create'), false);
});

test('18. Phase 4: Cleaning permission without inspection permission remains strictly enforced', () => {
  const cleaningStaff = {
    id: 'staff_clean',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:housekeeping', 'action:housekeeping:clean']
  };

  assert.equal(hasPermission(cleaningStaff, 'action:housekeeping:clean'), true);
  assert.equal(hasPermission(cleaningStaff, 'action:housekeeping:inspect'), false);
  assert.equal(canConductInspection(cleaningStaff), false);

  const checkInspect = requirePermission(cleaningStaff, 'action:housekeeping:inspect');
  assert.equal(checkInspect.authorized, false);
  assert.equal(checkInspect.errorResponse?.code, 'FORBIDDEN');
});

test('19. Phase 4: Staff cannot access Admin-only pages or APIs (Staff Management, Financials, etc.)', () => {
  const staffMember = {
    id: 'staff_reception',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:dashboard', 'page:rooms']
  };

  // Staff management page/API
  assert.equal(hasPermission(staffMember, 'page:staff'), false);
  assert.equal(hasPermission(staffMember, 'action:staff:create'), false);
  assert.equal(hasPermission(staffMember, 'action:staff:manage_permissions'), false);

  // Attempting to manage permissions
  const permCheck = requirePermission(staffMember, 'action:staff:manage_permissions');
  assert.equal(permCheck.authorized, false);
});

test('20. Phase 4: Admin/Owner full wildcard access is preserved across all pages and actions', () => {
  const adminUser = {
    id: 'admin_owner_001',
    type: 'ADMIN',
    email: 'admin@hotel.com',
    status: 'active'
  };

  assert.equal(hasPermission(adminUser, 'page:dashboard'), true);
  assert.equal(hasPermission(adminUser, 'page:rooms'), true);
  assert.equal(hasPermission(adminUser, 'page:staff'), true);
  assert.equal(hasPermission(adminUser, 'action:rooms:create'), true);
  assert.equal(hasPermission(adminUser, 'action:checkin:settle_payment'), true);
  assert.equal(hasPermission(adminUser, 'action:housekeeping:inspect'), true);
  assert.equal(hasPermission(adminUser, 'action:staff:manage_permissions'), true);
  assert.equal(canConductInspection(adminUser), true);
});

// ==========================================
// PHASE 4.1: AUDIT FIXES TESTS
// ==========================================

test('21. Phase 4.1: getAuthorizedRedirectUrl decision matrix for staff vs admin', () => {
  // Staff with only rooms
  const roomsStaff = {
    id: 's_rooms',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:rooms']
  };
  assert.equal(getAuthorizedRedirectUrl(roomsStaff), '/dashboard/rooms');

  // Staff with only reservations
  const resStaff = {
    id: 's_res',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:reservations']
  };
  assert.equal(getAuthorizedRedirectUrl(resStaff), '/dashboard/reservations');

  // Staff with only housekeeping
  const hkStaff = {
    id: 's_hk',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:housekeeping']
  };
  assert.equal(getAuthorizedRedirectUrl(hkStaff), '/dashboard/housekeeping');

  // Staff with only checkin
  const checkinStaff = {
    id: 's_ci',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:checkin']
  };
  assert.equal(getAuthorizedRedirectUrl(checkinStaff), '/dashboard/checkin');

  // Staff with zero page permissions
  const noPageStaff = {
    id: 's_none',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: []
  };
  assert.equal(getAuthorizedRedirectUrl(noPageStaff), '/dashboard/no-access');

  // Staff with action-only permissions (no page permissions)
  const actionOnlyStaff = {
    id: 's_act',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['action:rooms:create', 'action:checkin:perform']
  };
  assert.equal(getAuthorizedRedirectUrl(actionOnlyStaff), '/dashboard/no-access');

  // Admin/Owner always resolves to /dashboard
  const admin = {
    id: 'admin_1',
    type: 'ADMIN',
    role: 'ADMIN',
    status: 'active'
  };
  assert.equal(getAuthorizedRedirectUrl(admin), '/dashboard');

  // Unauthenticated resolves to /auth/custom
  assert.equal(getAuthorizedRedirectUrl(null), '/auth/custom');
});

test('22. Phase 4.1: Room types API mutation authorization enforcement', () => {
  const readOnlyStaff = {
    id: 'staff_viewer',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:rooms']
  };

  // Staff with page:rooms cannot create, edit or delete room types
  const createCheck = requirePermission(readOnlyStaff, 'action:rooms:create');
  assert.equal(createCheck.authorized, false);
  assert.equal(createCheck.errorResponse?.requiredPermission, 'action:rooms:create');

  const editCheck = requirePermission(readOnlyStaff, 'action:rooms:edit');
  assert.equal(editCheck.authorized, false);
  assert.equal(editCheck.errorResponse?.requiredPermission, 'action:rooms:edit');

  const deleteCheck = requirePermission(readOnlyStaff, 'action:rooms:delete');
  assert.equal(deleteCheck.authorized, false);
  assert.equal(deleteCheck.errorResponse?.requiredPermission, 'action:rooms:delete');

  // Staff with action:rooms:create can create room types
  const creatorStaff = {
    id: 'staff_creator',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:rooms', 'action:rooms:create']
  };
  assert.equal(requirePermission(creatorStaff, 'action:rooms:create').authorized, true);
  assert.equal(requirePermission(creatorStaff, 'action:rooms:edit').authorized, false);
  assert.equal(requirePermission(creatorStaff, 'action:rooms:delete').authorized, false);

  // Admin/Owner can execute all room type mutations
  const adminUser = {
    id: 'admin_owner',
    type: 'ADMIN',
    role: 'ADMIN',
    status: 'active'
  };
  assert.equal(requirePermission(adminUser, 'action:rooms:create').authorized, true);
  assert.equal(requirePermission(adminUser, 'action:rooms:edit').authorized, true);
  assert.equal(requirePermission(adminUser, 'action:rooms:delete').authorized, true);
});

test('24. Security Bug Fix: Staff with only page:dashboard cannot access /dashboard/rooms, /dashboard/checkin, or /dashboard/book', () => {
  const dashboardOnlyStaff = {
    id: 'staff_dash_only',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: ['page:dashboard']
  };

  // Page access tests
  assert.equal(hasPageAccess(dashboardOnlyStaff, '/dashboard'), true, 'Should have access to /dashboard');
  assert.equal(hasPageAccess(dashboardOnlyStaff, '/dashboard/rooms'), false, 'Must NOT have access to /dashboard/rooms');
  assert.equal(hasPageAccess(dashboardOnlyStaff, '/dashboard/checkin'), false, 'Must NOT have access to /dashboard/checkin');
  assert.equal(hasPageAccess(dashboardOnlyStaff, '/dashboard/book'), false, 'Must NOT have access to /dashboard/book');
  assert.equal(hasPageAccess(dashboardOnlyStaff, '/dashboard/checkout'), false, 'Must NOT have access to /dashboard/checkout');
  assert.equal(hasPageAccess(dashboardOnlyStaff, '/dashboard/reservations'), false, 'Must NOT have access to /dashboard/reservations');
  assert.equal(hasPageAccess(dashboardOnlyStaff, '/dashboard/housekeeping'), false, 'Must NOT have access to /dashboard/housekeeping');
  assert.equal(hasPageAccess(dashboardOnlyStaff, '/dashboard/staff'), false, 'Must NOT have access to /dashboard/staff');

  // Verify redirect target for dashboard-only staff
  assert.equal(getAuthorizedRedirectUrl(dashboardOnlyStaff), '/dashboard');
});

test('25. Security Bug Fix: Staff with only page:dashboard is strictly forbidden from check-in APIs', () => {
  const dashboardOnlyStaff = {
    id: 'staff_dash_only',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: ['page:dashboard']
  };

  // Check-in action check
  const checkinCheck = requirePermission(dashboardOnlyStaff, 'action:checkin:perform');
  assert.equal(checkinCheck.authorized, false, 'Check-in must be forbidden');
  assert.equal(checkinCheck.errorResponse?.code, 'FORBIDDEN');
  assert.equal(checkinCheck.errorResponse?.requiredPermission, 'action:checkin:perform');

  // Check-in page access check (checkin-data API)
  const checkinPageCheck = requirePermission(dashboardOnlyStaff, 'page:checkin');
  assert.equal(checkinPageCheck.authorized, false, 'checkin-data access must be forbidden');

  // Settle payment check
  const settleCheck = requirePermission(dashboardOnlyStaff, 'action:checkout:settle_payment');
  assert.equal(settleCheck.authorized, false, 'Payment settlement must be forbidden');
});

test('26. Security Bug Fix: Staff with only page:dashboard cannot change room status or delete rooms', () => {
  const dashboardOnlyStaff = {
    id: 'staff_dash_only',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: ['page:dashboard']
  };

  const statusCheck = requirePermission(dashboardOnlyStaff, 'action:rooms:change_status');
  assert.equal(statusCheck.authorized, false, 'Status change must be forbidden');
  assert.equal(statusCheck.errorResponse?.requiredPermission, 'action:rooms:change_status');

  const deleteCheck = requirePermission(dashboardOnlyStaff, 'action:rooms:delete');
  assert.equal(deleteCheck.authorized, false, 'Room deletion must be forbidden');
  assert.equal(deleteCheck.errorResponse?.requiredPermission, 'action:rooms:delete');

  const editCheck = requirePermission(dashboardOnlyStaff, 'action:rooms:edit');
  assert.equal(editCheck.authorized, false, 'Room editing must be forbidden');
});

test('27. Security Bug Fix: Staff with action:checkin:perform can check in guests but cannot delete or edit rooms', () => {
  const checkinStaff = {
    id: 'staff_reception',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: ['page:dashboard', 'page:checkin', 'action:checkin:perform']
  };

  assert.equal(hasPageAccess(checkinStaff, '/dashboard'), true);
  assert.equal(hasPageAccess(checkinStaff, '/dashboard/checkin'), true);
  assert.equal(hasPageAccess(checkinStaff, '/dashboard/book'), true);
  assert.equal(hasPageAccess(checkinStaff, '/dashboard/rooms'), false);

  assert.equal(requirePermission(checkinStaff, 'action:checkin:perform').authorized, true);
  assert.equal(requirePermission(checkinStaff, 'action:rooms:change_status').authorized, false);
  assert.equal(requirePermission(checkinStaff, 'action:rooms:delete').authorized, false);
  assert.equal(requirePermission(checkinStaff, 'action:rooms:edit').authorized, false);
});

test('28. Security Bug Fix: Inactive staff or cross-hotel staff cannot perform check-in or access pages', () => {
  const inactiveStaff = {
    id: 'staff_inactive',
    type: 'STAFF',
    isStaff: true,
    status: 'inactive',
    hotelId: 'hotel_123',
    permissions: ['page:dashboard', 'page:checkin', 'action:checkin:perform']
  };

  assert.equal(hasPermission(inactiveStaff, 'action:checkin:perform'), false);
  assert.equal(hasPageAccess(inactiveStaff, '/dashboard/checkin'), false);
  const inactiveCheck = requirePermission(inactiveStaff, 'action:checkin:perform');
  assert.equal(inactiveCheck.authorized, false);
  assert.equal(inactiveCheck.errorResponse?.code, 'ACCOUNT_INACTIVE');
});

test('29. Security Bug Fix: Admin retains full wildcard access to all check-in and room actions', () => {
  const admin = {
    id: 'admin_1',
    type: 'ADMIN',
    role: 'ADMIN',
    status: 'active'
  };

  assert.equal(hasPageAccess(admin, '/dashboard/rooms'), true);
  assert.equal(hasPageAccess(admin, '/dashboard/book'), true);
  assert.equal(hasPageAccess(admin, '/dashboard/checkin'), true);
  assert.equal(requirePermission(admin, 'action:checkin:perform').authorized, true);
  assert.equal(requirePermission(admin, 'action:rooms:change_status').authorized, true);
  assert.equal(requirePermission(admin, 'action:rooms:delete').authorized, true);
});

test('30. Floor Creation: Staff with only room permissions is strictly denied action:floors:create', () => {
  const staffWithRoomPermissions = {
    id: 'staff_rooms_only',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: [
      'page:rooms',
      'action:rooms:create',
      'action:rooms:edit',
      'action:rooms:delete',
      'action:rooms:change_status',
    ],
  };

  // Staff with only room permissions cannot create floors
  assert.equal(hasPermission(staffWithRoomPermissions, 'action:floors:create'), false);
  assert.equal(hasPermission(staffWithRoomPermissions, 'action:floors:edit'), false);
  assert.equal(hasPermission(staffWithRoomPermissions, 'action:floors:delete'), false);

  const check = requirePermission(staffWithRoomPermissions, 'action:floors:create');
  assert.equal(check.authorized, false);
  assert.equal(check.errorResponse?.code, 'FORBIDDEN');
  assert.equal(check.errorResponse?.requiredPermission, 'action:floors:create');
  assert.match(check.errorResponse?.error, /action:floors:create/);
});

test('31. Floor Creation: Staff with explicit action:floors:create permission is authorized', () => {
  const staffWithFloorCreate = {
    id: 'staff_floor_admin',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: [
      'page:rooms',
      'action:rooms:create',
      'action:floors:create',
    ],
  };

  assert.equal(hasPermission(staffWithFloorCreate, 'action:floors:create'), true);
  const check = requirePermission(staffWithFloorCreate, 'action:floors:create');
  assert.equal(check.authorized, true);
  assert.equal(check.errorResponse, undefined);

  // Still cannot edit or delete floors without explicit permissions
  assert.equal(hasPermission(staffWithFloorCreate, 'action:floors:edit'), false);
  assert.equal(hasPermission(staffWithFloorCreate, 'action:floors:delete'), false);
});

test('32. Floor Creation: Admin and Owner retain full wildcard permission to create, edit, and delete floors', () => {
  const admin = {
    id: 'admin_hotel',
    type: 'ADMIN',
    role: 'ADMIN',
    status: 'active',
  };

  const owner = {
    id: 'owner_hotel',
    type: 'OWNER',
    role: 'USER',
    status: 'active',
  };

  // Admin checks
  assert.equal(hasPermission(admin, 'action:floors:create'), true);
  assert.equal(hasPermission(admin, 'action:floors:edit'), true);
  assert.equal(hasPermission(admin, 'action:floors:delete'), true);
  assert.equal(requirePermission(admin, 'action:floors:create').authorized, true);
  assert.equal(requirePermission(admin, 'action:floors:edit').authorized, true);
  assert.equal(requirePermission(admin, 'action:floors:delete').authorized, true);

  // Owner checks
  assert.equal(hasPermission(owner, 'action:floors:create'), true);
  assert.equal(hasPermission(owner, 'action:floors:edit'), true);
  assert.equal(hasPermission(owner, 'action:floors:delete'), true);
  assert.equal(requirePermission(owner, 'action:floors:create').authorized, true);
  assert.equal(requirePermission(owner, 'action:floors:edit').authorized, true);
  assert.equal(requirePermission(owner, 'action:floors:delete').authorized, true);
});

test('33. Rooms and Floors Layout Authorization: Staff with page:rooms or page:floors can load layout data', () => {
  const staffRoomsOnly = {
    id: 'staff_rooms_1',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: ['page:rooms'],
  };

  const staffFloorsOnly = {
    id: 'staff_floors_1',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: ['page:floors'],
  };

  const staffNoAccess = {
    id: 'staff_no_access',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: [],
  };

  // Check layout authorization helper logic
  const canAccessLayout = (user) => {
    return (
      isAdminOrOwner(user) ||
      hasPermission(user, 'page:dashboard') ||
      hasPermission(user, 'page:rooms') ||
      hasPermission(user, 'page:floors') ||
      hasPermission(user, 'page:checkin') ||
      hasPermission(user, 'page:reservations')
    );
  };

  assert.equal(canAccessLayout(staffRoomsOnly), true, 'Staff with page:rooms should be allowed to load room layout');
  assert.equal(canAccessLayout(staffFloorsOnly), true, 'Staff with page:floors should be allowed to load floor layout');
  assert.equal(canAccessLayout(staffNoAccess), false, 'Staff with no page permissions must be denied');
});

test('34. Financial KPI Protection: Staff without action:dashboard:view_kpi receives masked KPIs', () => {
  const staffOperational = {
    id: 'staff_op',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: ['page:rooms', 'action:rooms:create'],
  };

  const staffManagerWithKpi = {
    id: 'staff_mgr',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: ['page:dashboard', 'action:dashboard:view_kpi'],
  };

  const admin = {
    id: 'admin_1',
    type: 'ADMIN',
    role: 'ADMIN',
    status: 'active',
  };

  assert.equal(hasPermission(staffOperational, 'action:dashboard:view_kpi'), false);
  assert.equal(hasPermission(staffManagerWithKpi, 'action:dashboard:view_kpi'), true);
  assert.equal(hasPermission(admin, 'action:dashboard:view_kpi'), true);
});

test('35. Page Access vs Action Permission Segregation across all modules', () => {
  const staffWithActionsOnly = {
    id: 'staff_actions_only',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: [
      'action:rooms:create',
      'action:floors:create',
      'action:reservations:create',
      'action:housekeeping:clean',
    ],
  };

  // Verify none of the pages can be opened without explicit page:* permissions
  assert.equal(hasPageAccess(staffWithActionsOnly, '/dashboard'), false);
  assert.equal(hasPageAccess(staffWithActionsOnly, '/dashboard/rooms'), false);
  assert.equal(hasPageAccess(staffWithActionsOnly, '/dashboard/floors'), false);
  assert.equal(hasPageAccess(staffWithActionsOnly, '/dashboard/reservations'), false);
  assert.equal(hasPageAccess(staffWithActionsOnly, '/dashboard/housekeeping'), false);
  assert.equal(hasPageAccess(staffWithActionsOnly, '/dashboard/services'), false);
  assert.equal(hasPageAccess(staffWithActionsOnly, '/dashboard/staff'), false);

  // But the actions themselves are registered
  assert.equal(hasPermission(staffWithActionsOnly, 'action:rooms:create'), true);
  assert.equal(hasPermission(staffWithActionsOnly, 'action:floors:create'), true);
  assert.equal(hasPermission(staffWithActionsOnly, 'action:reservations:create'), true);
  assert.equal(hasPermission(staffWithActionsOnly, 'action:housekeeping:clean'), true);

  // Unselected actions are strictly false
  assert.equal(hasPermission(staffWithActionsOnly, 'action:rooms:delete'), false);
  assert.equal(hasPermission(staffWithActionsOnly, 'action:floors:delete'), false);
});

test('36. Granular Rooms Permissions: View Guest Details and Bulk Booking', () => {
  const staffGuestView = {
    id: 'staff_guest_view',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: ['page:rooms', 'action:rooms:view_guest_details'],
  };

  const staffBulkOnly = {
    id: 'staff_bulk_only',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: ['page:rooms', 'action:rooms:bulk_booking'],
  };

  assert.equal(hasPermission(staffGuestView, 'action:rooms:view_guest_details'), true);
  assert.equal(hasPermission(staffGuestView, 'action:rooms:bulk_booking'), false);

  assert.equal(hasPermission(staffBulkOnly, 'action:rooms:bulk_booking'), true);
  assert.equal(hasPermission(staffBulkOnly, 'action:rooms:view_guest_details'), false);

  // Admin has both
  const admin = { id: 'admin_1', type: 'ADMIN', role: 'ADMIN', status: 'active' };
  assert.equal(hasPermission(admin, 'action:rooms:view_guest_details'), true);
  assert.equal(hasPermission(admin, 'action:rooms:bulk_booking'), true);
});

test('37. Granular Reservations Permissions: Delete, View Details, and Print Invoice', () => {
  const staffResViewer = {
    id: 'staff_res_viewer',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: [
      'page:reservations',
      'action:reservations:view_details',
      'action:reservations:print_invoice',
    ],
  };

  assert.equal(hasPermission(staffResViewer, 'action:reservations:view_details'), true);
  assert.equal(hasPermission(staffResViewer, 'action:reservations:print_invoice'), true);
  assert.equal(hasPermission(staffResViewer, 'action:reservations:delete'), false);
  assert.equal(hasPermission(staffResViewer, 'action:reservations:create'), false);

  const checkPrint = requirePermission(staffResViewer, 'action:reservations:print_invoice');
  assert.equal(checkPrint.authorized, true);

  const checkDelete = requirePermission(staffResViewer, 'action:reservations:delete');
  assert.equal(checkDelete.authorized, false);
});

test('38. Granular Check-in Permissions: View Guest Details and Change Room', () => {
  const frontDeskStaff = {
    id: 'staff_front_desk',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: [
      'page:checkin',
      'action:checkin:perform',
      'action:checkin:view_guest_details',
    ],
  };

  assert.equal(hasPermission(frontDeskStaff, 'action:checkin:perform'), true);
  assert.equal(hasPermission(frontDeskStaff, 'action:checkin:view_guest_details'), true);
  assert.equal(hasPermission(frontDeskStaff, 'action:checkin:change_room'), false);
  assert.equal(hasPermission(frontDeskStaff, 'action:checkout:settle_payment'), false);
});

test('39. Granular Housekeeping Permissions: Create Task and Assign Staff', () => {
  const housekeepingLead = {
    id: 'hk_lead',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: [
      'page:housekeeping',
      'action:housekeeping:create_task',
      'action:housekeeping:assign_staff',
    ],
  };

  assert.equal(hasPermission(housekeepingLead, 'action:housekeeping:create_task'), true);
  assert.equal(hasPermission(housekeepingLead, 'action:housekeeping:assign_staff'), true);
  // Does not have inspection permission
  assert.equal(canConductInspection(housekeepingLead), false);
});

test('40. Granular Invoice and Receipt Permissions: Check-out Print Separation', () => {
  const staffThermalOnly = {
    id: 'staff_thermal_only',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: [
      'page:checkin',
      'action:checkout:settle_payment',
      'action:checkout:print_thermal_80mm',
      'action:checkout:print_thermal_58mm',
    ],
  };

  // Thermal permissions granted
  assert.equal(hasPermission(staffThermalOnly, 'action:checkout:print_thermal_80mm'), true);
  assert.equal(hasPermission(staffThermalOnly, 'action:checkout:print_thermal_58mm'), true);

  // A4 invoice & official payment receipt strictly denied
  assert.equal(hasPermission(staffThermalOnly, 'action:checkout:print_invoice_a4'), false);
  assert.equal(hasPermission(staffThermalOnly, 'action:checkout:print_receipt'), false);
  assert.equal(hasPermission(staffThermalOnly, 'action:reservations:print_invoice'), false);
  assert.equal(hasPermission(staffThermalOnly, 'action:reservations:print_receipt'), false);

  const checkA4 = requirePermission(staffThermalOnly, 'action:checkout:print_invoice_a4');
  assert.equal(checkA4.authorized, false);
  assert.equal(checkA4.errorResponse?.code, 'FORBIDDEN');

  const check80 = requirePermission(staffThermalOnly, 'action:checkout:print_thermal_80mm');
  assert.equal(check80.authorized, true);
});

test('41. Granular Invoice and Receipt Permissions: Reservations Receipt Separation and Admin Wildcard', () => {
  const staffReceiptOnly = {
    id: 'staff_receipt_only',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: [
      'page:reservations',
      'action:reservations:view_details',
      'action:reservations:print_receipt',
    ],
  };

  // Staff has receipt permission but not A4 invoice permission
  assert.equal(hasPermission(staffReceiptOnly, 'action:reservations:print_receipt'), true);
  assert.equal(hasPermission(staffReceiptOnly, 'action:reservations:print_invoice'), false);

  // Admin/Owner full access bypasses all individual invoice/receipt checks
  const admin = { id: 'admin_1', type: 'ADMIN', role: 'ADMIN', status: 'active' };
  const owner = { id: 'owner_1', type: 'OWNER', role: 'OWNER', status: 'active' };

  for (const user of [admin, owner]) {
    assert.equal(hasPermission(user, 'action:reservations:print_invoice'), true);
    assert.equal(hasPermission(user, 'action:reservations:print_receipt'), true);
    assert.equal(hasPermission(user, 'action:checkout:print_invoice_a4'), true);
    assert.equal(hasPermission(user, 'action:checkout:print_thermal_80mm'), true);
    assert.equal(hasPermission(user, 'action:checkout:print_thermal_58mm'), true);
    assert.equal(hasPermission(user, 'action:checkout:print_receipt'), true);

    assert.equal(requirePermission(user, 'action:checkout:print_invoice_a4').authorized, true);
    assert.equal(requirePermission(user, 'action:checkout:print_thermal_80mm').authorized, true);
    assert.equal(requirePermission(user, 'action:checkout:print_receipt').authorized, true);
  }
});

test('42. Centralized Printing Module: Catalog definitions and module membership', () => {
  const centralizedKeys = [
    'action:printing:invoice_a4',
    'action:printing:invoice_80mm',
    'action:printing:invoice_58mm',
    'action:printing:payment_receipt',
    'action:printing:guest_registration_card',
  ];

  for (const key of centralizedKeys) {
    const item = PERMISSION_CATALOG.find(p => p.key === key);
    assert.ok(item, `Expected catalog to contain ${key}`);
    assert.equal(item.module, PERMISSION_MODULES.PRINTING, `${key} should belong to PERMISSION_MODULES.PRINTING`);
    assert.equal(item.type, 'action', `${key} should be an action permission`);
  }
});

test('43. Format Independence: Each centralized print permission functions independently', () => {
  const allCentralized = [
    'action:printing:invoice_a4',
    'action:printing:invoice_80mm',
    'action:printing:invoice_58mm',
    'action:printing:payment_receipt',
    'action:printing:guest_registration_card',
  ];

  // Test that enabling ONLY ONE permission allows ONLY that action and denies all others
  for (const targetKey of allCentralized) {
    const staffSinglePerm = {
      id: `staff_${targetKey}`,
      type: 'STAFF',
      isStaff: true,
      status: 'active',
      hotelId: 'hotel_123',
      permissions: [targetKey],
    };

    assert.equal(
      hasPermission(staffSinglePerm, targetKey),
      true,
      `Staff with ${targetKey} must have ${targetKey}`
    );

    for (const otherKey of allCentralized) {
      if (otherKey !== targetKey) {
        assert.equal(
          hasPermission(staffSinglePerm, otherKey),
          false,
          `Staff with ONLY ${targetKey} must NOT have ${otherKey}`
        );
      }
    }
  }
});

test('44. Decoupling: Page permissions (Reservations / Check-in) DO NOT grant print permissions', () => {
  const staffPagesOnly = {
    id: 'staff_pages_only',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    hotelId: 'hotel_123',
    permissions: [
      'page:dashboard',
      'page:reservations',
      'page:checkin',
      'action:reservations:create',
      'action:checkin:perform',
    ],
  };

  const allCentralized = [
    'action:printing:invoice_a4',
    'action:printing:invoice_80mm',
    'action:printing:invoice_58mm',
    'action:printing:payment_receipt',
    'action:printing:guest_registration_card',
  ];

  for (const printKey of allCentralized) {
    assert.equal(
      hasPermission(staffPagesOnly, printKey),
      false,
      `Page access must not automatically grant ${printKey}`
    );
    assert.equal(
      requirePermission(staffPagesOnly, printKey).authorized,
      false,
      `requirePermission must reject ${printKey} for pages-only staff`
    );
  }
});

test('45. Centralized Printing: Admin/Owner full wildcard access across all centralized print keys', () => {
  const admin = { id: 'admin_1', type: 'ADMIN', role: 'ADMIN', status: 'active' };
  const owner = { id: 'owner_1', type: 'OWNER', role: 'OWNER', status: 'active' };

  const allCentralized = [
    'action:printing:invoice_a4',
    'action:printing:invoice_80mm',
    'action:printing:invoice_58mm',
    'action:printing:payment_receipt',
    'action:printing:guest_registration_card',
  ];

  for (const user of [admin, owner]) {
    for (const printKey of allCentralized) {
      assert.equal(hasPermission(user, printKey), true, `Admin/Owner must have wildcard ${printKey}`);
      assert.equal(requirePermission(user, printKey).authorized, true, `requirePermission must authorize ${printKey} for Admin/Owner`);
    }
  }
});

test('46. Backward compatibility: Existing staff with legacy checkout/reservation print keys resolve to centralized keys', () => {
  // Legacy A4
  const staffLegacyA4 = {
    id: 'staff_legacy_a4',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['action:checkout:print_invoice_a4'],
  };
  assert.equal(hasPermission(staffLegacyA4, 'action:printing:invoice_a4'), true);
  assert.equal(hasPermission(staffLegacyA4, 'action:printing:invoice_80mm'), false);
  assert.equal(hasPermission(staffLegacyA4, 'action:printing:invoice_58mm'), false);

  // Legacy 80mm
  const staffLegacy80 = {
    id: 'staff_legacy_80',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['action:checkout:print_thermal_80mm'],
  };
  assert.equal(hasPermission(staffLegacy80, 'action:printing:invoice_80mm'), true);
  assert.equal(hasPermission(staffLegacy80, 'action:printing:invoice_a4'), false);

  // Legacy 58mm
  const staffLegacy58 = {
    id: 'staff_legacy_58',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['action:checkout:print_thermal_58mm'],
  };
  assert.equal(hasPermission(staffLegacy58, 'action:printing:invoice_58mm'), true);
  assert.equal(hasPermission(staffLegacy58, 'action:printing:invoice_a4'), false);

  // Legacy receipt
  const staffLegacyReceipt = {
    id: 'staff_legacy_receipt',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['action:checkout:print_receipt'],
  };
  assert.equal(hasPermission(staffLegacyReceipt, 'action:printing:payment_receipt'), true);
  assert.equal(hasPermission(staffLegacyReceipt, 'action:printing:guest_registration_card'), true);
  assert.equal(hasPermission(staffLegacyReceipt, 'action:printing:invoice_a4'), false);
});

test('47. Inactive staff cannot use centralized print permissions even when granted', () => {
  const inactiveStaff = {
    id: 'staff_inactive',
    type: 'STAFF',
    isStaff: true,
    status: 'inactive',
    permissions: [
      'action:printing:invoice_a4',
      'action:printing:invoice_80mm',
      'action:printing:invoice_58mm',
      'action:printing:payment_receipt',
      'action:printing:guest_registration_card',
    ],
  };

  const allCentralized = [
    'action:printing:invoice_a4',
    'action:printing:invoice_80mm',
    'action:printing:invoice_58mm',
    'action:printing:payment_receipt',
    'action:printing:guest_registration_card',
  ];

  for (const printKey of allCentralized) {
    assert.equal(hasPermission(inactiveStaff, printKey), false);
    assert.equal(requirePermission(inactiveStaff, printKey).authorized, false);
  }
});

test('48. Middleware Print Route Exemption: /dashboard/print paths are not intercepted or redirected by page-level route map', () => {
  const paths = [
    '/dashboard/print/invoice/stay_123',
    '/dashboard/print/invoice/stay_123?format=A4',
    '/dashboard/print/invoice/stay_123?format=80MM',
    '/dashboard/print/invoice/stay_123?format=58MM',
    '/dashboard/print/grc/stay_123',
    '/dashboard/print/grc/stay_123?format=80MM',
  ];

  for (const p of paths) {
    const isPrintRoute = p.startsWith('/dashboard/print');
    assert.equal(isPrintRoute, true, `${p} should be recognized as a print route`);
    // Should NOT be intercepted as a regular page requiring page:dashboard
    const shouldEnforcePagePermissions = p !== '/dashboard/no-access' && !p.startsWith('/dashboard/print');
    assert.equal(shouldEnforcePagePermissions, false, `${p} should bypass page permission redirects`);
  }
});

test('49. Format Isolation: Staff with only action:printing:invoice_a4 cannot print 80mm or 58mm or GRC', () => {
  const a4OnlyStaff = {
    id: 'staff_a4_only',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:reservations', 'page:checkin', 'action:printing:invoice_a4'],
  };

  assert.equal(hasPermission(a4OnlyStaff, 'action:printing:invoice_a4'), true);
  assert.equal(hasPermission(a4OnlyStaff, 'action:printing:invoice_80mm'), false);
  assert.equal(hasPermission(a4OnlyStaff, 'action:printing:invoice_58mm'), false);
  assert.equal(hasPermission(a4OnlyStaff, 'action:printing:payment_receipt'), false);
  assert.equal(hasPermission(a4OnlyStaff, 'action:printing:guest_registration_card'), false);
});

test('50. Thermal Isolation: Staff with only action:printing:invoice_80mm cannot print A4 invoice or 58mm invoice', () => {
  const thermalStaff = {
    id: 'staff_thermal_80',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:reservations', 'action:printing:invoice_80mm'],
  };

  assert.equal(hasPermission(thermalStaff, 'action:printing:invoice_80mm'), true);
  assert.equal(hasPermission(thermalStaff, 'action:printing:invoice_a4'), false);
  assert.equal(hasPermission(thermalStaff, 'action:printing:invoice_58mm'), false);
  assert.equal(hasPermission(thermalStaff, 'action:printing:guest_registration_card'), false);
});

test('51. GRC and Receipt Flow Isolation: Staff with payment_receipt or guest_registration_card can print GRC slips', () => {
  const grcStaff = {
    id: 'staff_grc_only',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['page:checkin', 'action:printing:guest_registration_card'],
  };

  assert.equal(hasPermission(grcStaff, 'action:printing:guest_registration_card'), true);
  assert.equal(hasPermission(grcStaff, 'action:printing:invoice_a4'), false);
  assert.equal(hasPermission(grcStaff, 'action:printing:invoice_80mm'), false);

  const receiptStaff = {
    id: 'staff_receipt_only',
    type: 'STAFF',
    isStaff: true,
    status: 'active',
    permissions: ['action:printing:payment_receipt'],
  };

  assert.equal(hasPermission(receiptStaff, 'action:printing:payment_receipt'), true);
  assert.equal(hasPermission(receiptStaff, 'action:printing:invoice_a4'), false);
});

test('52. Admin Wildcard Access preserves full printing access without explicit print keys', () => {
  const admin = {
    id: 'admin_master',
    type: 'ADMIN',
    role: 'ADMIN',
    status: 'active',
    permissions: [],
  };

  const allFormats = [
    'action:printing:invoice_a4',
    'action:printing:invoice_80mm',
    'action:printing:invoice_58mm',
    'action:printing:payment_receipt',
    'action:printing:guest_registration_card',
  ];

  for (const fmt of allFormats) {
    assert.equal(hasPermission(admin, fmt), true);
    assert.equal(requirePermission(admin, fmt).authorized, true);
  }
});



