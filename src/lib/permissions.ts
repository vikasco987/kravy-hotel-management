/**
 * Kravy Hotel Management - Granular Permission System
 *
 * Core Principles:
 * 1. Admin/Owner Full Access: Hotel owners and administrators bypass permission checks.
 * 2. Deny-by-default for Staff: Unassigned pages and actions are strictly prohibited.
 * 3. Page vs. Action decoupling: Possessing page access does not automatically grant destructive or sensitive actions.
 * 4. Cleaning vs. Inspection decoupling: Housekeeping staff with cleaning rights cannot pass/reject inspections without explicit permission.
 */

export interface UserAuthIdentity {
  id: string;
  type: 'ADMIN' | 'SELLER' | 'STAFF' | 'OWNER' | 'USER' | string;
  businessId?: string;
  hotelId?: string;
  permissions?: string[];
  name?: string;
  email?: string;
  role?: string;
  isStaff?: boolean;
  status?: string;
}

// ==========================================
// 1. PERMISSION CATALOG DEFINITIONS
// ==========================================

export const PERMISSION_MODULES = {
  DASHBOARD: 'dashboard',
  ROOMS: 'rooms',
  RESERVATIONS: 'reservations',
  CHECKIN: 'checkin',
  HOUSEKEEPING: 'housekeeping',
  RESTAURANT: 'restaurant',
  WHATSAPP: 'whatsapp',
  STAFF: 'staff',
  FLOORS: 'floors',
  REPORTS: 'reports',
  EXPENSES: 'expenses',
  SERVICES: 'services',
  SETTINGS: 'settings',
  PRINTING: 'printing',
} as const;

export type PermissionModule = typeof PERMISSION_MODULES[keyof typeof PERMISSION_MODULES];

export interface PermissionDefinition {
  key: string;
  name: string;
  description: string;
  module: PermissionModule;
  type: 'page' | 'action';
}

/**
 * Standardized system permissions catalog
 */
export const PERMISSION_CATALOG: PermissionDefinition[] = [
  // --- DASHBOARD ---
  {
    key: 'page:dashboard',
    name: 'View Dashboard',
    description: 'Access the main dashboard and view KPI summaries',
    module: PERMISSION_MODULES.DASHBOARD,
    type: 'page',
  },
  {
    key: 'action:dashboard:view_kpi',
    name: 'View Dashboard Financial KPIs',
    description: 'View revenue, occupancy rate, and financial summary numbers on dashboard',
    module: PERMISSION_MODULES.DASHBOARD,
    type: 'action',
  },

  // --- ROOMS ---
  {
    key: 'page:rooms',
    name: 'View Rooms',
    description: 'Access the rooms directory and floor-wise room grid',
    module: PERMISSION_MODULES.ROOMS,
    type: 'page',
  },
  {
    key: 'action:rooms:create',
    name: 'Create Rooms',
    description: 'Add new rooms to a floor',
    module: PERMISSION_MODULES.ROOMS,
    type: 'action',
  },
  {
    key: 'action:rooms:edit',
    name: 'Edit Rooms',
    description: 'Update room number, category, floor assignment, and custom pricing',
    module: PERMISSION_MODULES.ROOMS,
    type: 'action',
  },
  {
    key: 'action:rooms:delete',
    name: 'Delete Rooms',
    description: 'Remove rooms from the hotel inventory',
    module: PERMISSION_MODULES.ROOMS,
    type: 'action',
  },
  {
    key: 'action:rooms:change_status',
    name: 'Change Room Status',
    description: 'Manually toggle room state (Available, Dirty, Maintenance, Blocked)',
    module: PERMISSION_MODULES.ROOMS,
    type: 'action',
  },
  {
    key: 'action:rooms:view_guest_details',
    name: 'View Guest Details in Rooms',
    description: 'Open the stay and guest details modal from occupied room cards',
    module: PERMISSION_MODULES.ROOMS,
    type: 'action',
  },
  {
    key: 'action:rooms:bulk_booking',
    name: 'Select Rooms for Booking',
    description: 'Select multiple rooms on the grid and launch multi-room booking/check-in',
    module: PERMISSION_MODULES.ROOMS,
    type: 'action',
  },

  // --- FLOORS ---
  {
    key: 'page:floors',
    name: 'View Floors',
    description: 'View floor layout and room distributions',
    module: PERMISSION_MODULES.FLOORS,
    type: 'page',
  },
  {
    key: 'action:floors:create',
    name: 'Create Floors',
    description: 'Add new floors to the hotel property',
    module: PERMISSION_MODULES.FLOORS,
    type: 'action',
  },
  {
    key: 'action:floors:edit',
    name: 'Edit Floors',
    description: 'Rename floors and update floor numbering',
    module: PERMISSION_MODULES.FLOORS,
    type: 'action',
  },
  {
    key: 'action:floors:delete',
    name: 'Delete Floors',
    description: 'Delete empty floors that have no assigned rooms',
    module: PERMISSION_MODULES.FLOORS,
    type: 'action',
  },

  // --- RESERVATIONS ---
  {
    key: 'page:reservations',
    name: 'View Reservations',
    description: 'Access booking records and reservation calendar',
    module: PERMISSION_MODULES.RESERVATIONS,
    type: 'page',
  },
  {
    key: 'action:reservations:create',
    name: 'Create Reservations',
    description: 'Book new reservations and collect advance deposits',
    module: PERMISSION_MODULES.RESERVATIONS,
    type: 'action',
  },
  {
    key: 'action:reservations:edit',
    name: 'Edit Reservations',
    description: 'Modify check-in dates, guest details, and room assignments',
    module: PERMISSION_MODULES.RESERVATIONS,
    type: 'action',
  },
  {
    key: 'action:reservations:cancel',
    name: 'Cancel Reservations',
    description: 'Cancel bookings or mark no-show reservations',
    module: PERMISSION_MODULES.RESERVATIONS,
    type: 'action',
  },
  {
    key: 'action:reservations:delete',
    name: 'Delete Reservations',
    description: 'Permanently remove reservation records (without active stays)',
    module: PERMISSION_MODULES.RESERVATIONS,
    type: 'action',
  },
  {
    key: 'action:reservations:view_details',
    name: 'View Reservation Details',
    description: 'Open the detailed reservation drawer with guest and billing breakdown',
    module: PERMISSION_MODULES.RESERVATIONS,
    type: 'action',
  },
  {
    key: 'action:reservations:print_invoice',
    name: 'Print/Download Reservation Invoice',
    description: 'Generate, print, or download A4 tax invoices for reservations & stays',
    module: PERMISSION_MODULES.RESERVATIONS,
    type: 'action',
  },
  {
    key: 'action:reservations:print_receipt',
    name: 'Print Reservation Receipt',
    description: 'Print thermal 80mm or 58mm receipts for reservation stays',
    module: PERMISSION_MODULES.RESERVATIONS,
    type: 'action',
  },

  // --- CHECK-IN / CHECK-OUT ---
  {
    key: 'page:checkin',
    name: 'View Check-in / Check-out',
    description: 'Access the front-desk guest check-in and check-out terminal',
    module: PERMISSION_MODULES.CHECKIN,
    type: 'page',
  },
  {
    key: 'action:checkin:perform',
    name: 'Perform Guest Check-in',
    description: 'Check in arriving guests, verify ID proofs, and assign keys',
    module: PERMISSION_MODULES.CHECKIN,
    type: 'action',
  },
  {
    key: 'action:checkout:settle_payment',
    name: 'Settle Check-out Payments',
    description: 'Finalize bill folios, record cash/UPI payments, and mark check-out',
    module: PERMISSION_MODULES.CHECKIN,
    type: 'action',
  },
  {
    key: 'action:checkout:add_services',
    name: 'Add Extra Charges to Bill',
    description: 'Post extra service charges and restaurant bills onto guest stay folios',
    module: PERMISSION_MODULES.CHECKIN,
    type: 'action',
  },
  {
    key: 'action:checkin:view_guest_details',
    name: 'View Check-in Guest Details',
    description: 'Inspect full guest identity, contact information, and documents',
    module: PERMISSION_MODULES.CHECKIN,
    type: 'action',
  },
  {
    key: 'action:checkin:change_room',
    name: 'Change Room During Check-in',
    description: 'Reassign or swap assigned rooms for guests during check-in',
    module: PERMISSION_MODULES.CHECKIN,
    type: 'action',
  },
  {
    key: 'action:checkout:print_invoice_a4',
    name: 'Print/Download Check-out Invoice (A4)',
    description: 'Generate and print full-page A4 tax invoice after checkout settlement',
    module: PERMISSION_MODULES.CHECKIN,
    type: 'action',
  },
  {
    key: 'action:checkout:print_thermal_80mm',
    name: 'Print 3-inch (80mm) Invoice',
    description: 'Print 80mm thermal receipt/bill at checkout',
    module: PERMISSION_MODULES.CHECKIN,
    type: 'action',
  },
  {
    key: 'action:checkout:print_thermal_58mm',
    name: 'Print 2-inch (58mm) Invoice',
    description: 'Print compact 58mm POS thermal receipt/bill at checkout',
    module: PERMISSION_MODULES.CHECKIN,
    type: 'action',
  },
  {
    key: 'action:checkout:print_receipt',
    name: 'Print/Download Payment Receipt',
    description: 'Print guest check-in registration card (GRC) and official payment receipt',
    module: PERMISSION_MODULES.CHECKIN,
    type: 'action',
  },

  // --- HOUSEKEEPING ---
  {
    key: 'page:housekeeping',
    name: 'View Housekeeping',
    description: 'Access the housekeeping task queue and room cleaning boards',
    module: PERMISSION_MODULES.HOUSEKEEPING,
    type: 'page',
  },
  {
    key: 'action:housekeeping:create_task',
    name: 'Create Cleaning Tasks',
    description: 'Create manual room cleaning tasks and set task priorities',
    module: PERMISSION_MODULES.HOUSEKEEPING,
    type: 'action',
  },
  {
    key: 'action:housekeeping:assign_staff',
    name: 'Assign Housekeeping Staff',
    description: 'Assign or reassign room cleaning tasks to housekeeping staff',
    module: PERMISSION_MODULES.HOUSEKEEPING,
    type: 'action',
  },
  {
    key: 'action:housekeeping:clean',
    name: 'Perform Cleaning Tasks',
    description: 'Start room cleaning, tick checklist items, and submit task as completed',
    module: PERMISSION_MODULES.HOUSEKEEPING,
    type: 'action',
  },
  {
    key: 'action:housekeeping:inspect',
    name: 'Pass / Reject Room Inspections',
    description: 'Conduct supervisory quality inspections and approve room to Available status or require re-cleaning',
    module: PERMISSION_MODULES.HOUSEKEEPING,
    type: 'action',
  },

  // --- RESTAURANT ---
  {
    key: 'page:restaurant',
    name: 'View Restaurant',
    description: 'Access restaurant tables and dining orders',
    module: PERMISSION_MODULES.RESTAURANT,
    type: 'page',
  },
  {
    key: 'action:restaurant:create_order',
    name: 'Create Restaurant Orders',
    description: 'Take kitchen orders and room dining orders',
    module: PERMISSION_MODULES.RESTAURANT,
    type: 'action',
  },
  {
    key: 'action:restaurant:settle',
    name: 'Settle Dining Bills',
    description: 'Collect payment or bill dining directly to guest room',
    module: PERMISSION_MODULES.RESTAURANT,
    type: 'action',
  },

  // --- WHATSAPP ---
  {
    key: 'page:whatsapp',
    name: 'View WhatsApp',
    description: 'Access WhatsApp messaging logs and guest communication history',
    module: PERMISSION_MODULES.WHATSAPP,
    type: 'page',
  },
  {
    key: 'action:whatsapp:send',
    name: 'Send WhatsApp Messages',
    description: 'Send manual notifications, invoices, and confirmation messages to guests',
    module: PERMISSION_MODULES.WHATSAPP,
    type: 'action',
  },

  // --- STAFF MANAGEMENT ---
  {
    key: 'page:staff',
    name: 'View Staff',
    description: 'View the staff directory and operational assignments',
    module: PERMISSION_MODULES.STAFF,
    type: 'page',
  },
  {
    key: 'action:staff:create',
    name: 'Create Staff',
    description: 'Register new staff members into the hotel directory',
    module: PERMISSION_MODULES.STAFF,
    type: 'action',
  },
  {
    key: 'action:staff:edit',
    name: 'Edit Staff',
    description: 'Update staff contact details, role designation, and passwords',
    module: PERMISSION_MODULES.STAFF,
    type: 'action',
  },
  {
    key: 'action:staff:manage_permissions',
    name: 'Configure Staff Permissions',
    description: 'Grant or revoke granular system permissions for other staff members',
    module: PERMISSION_MODULES.STAFF,
    type: 'action',
  },

  // --- REPORTS ---
  {
    key: 'page:reports',
    name: 'View Reports',
    description: 'Access operational and revenue reports',
    module: PERMISSION_MODULES.REPORTS,
    type: 'page',
  },
  {
    key: 'action:reports:view_financials',
    name: 'View Financial Metrics',
    description: 'Inspect detailed revenue, RevPAR, and collection metrics',
    module: PERMISSION_MODULES.REPORTS,
    type: 'action',
  },
  {
    key: 'action:reports:export',
    name: 'Export Reports',
    description: 'Download CSV and PDF audit reports',
    module: PERMISSION_MODULES.REPORTS,
    type: 'action',
  },

  // --- EXPENSES & P&L ---
  {
    key: 'page:expenses',
    name: 'View Expenses & P&L',
    description: 'Access expense registers and profit/loss statements',
    module: PERMISSION_MODULES.EXPENSES,
    type: 'page',
  },
  {
    key: 'action:expenses:create',
    name: 'Record Expenses',
    description: 'Log property operational costs and vendor bills',
    module: PERMISSION_MODULES.EXPENSES,
    type: 'action',
  },
  {
    key: 'action:expenses:delete',
    name: 'Delete Expenses',
    description: 'Remove or void expense records',
    module: PERMISSION_MODULES.EXPENSES,
    type: 'action',
  },

  // --- EXTRA SERVICES ---
  {
    key: 'page:services',
    name: 'View Extra Services',
    description: 'View service pricing and item catalog',
    module: PERMISSION_MODULES.SERVICES,
    type: 'page',
  },
  {
    key: 'action:services:manage',
    name: 'Manage Extra Services',
    description: 'Create, modify, and delete extra services and prices',
    module: PERMISSION_MODULES.SERVICES,
    type: 'action',
  },

  // --- SETTINGS ---
  {
    key: 'page:settings',
    name: 'View Settings',
    description: 'View property settings, tax configuration, and checkout times',
    module: PERMISSION_MODULES.SETTINGS,
    type: 'page',
  },
  {
    key: 'action:settings:modify',
    name: 'Modify Hotel Settings',
    description: 'Update hotel business info, tax rates, checkout rules, and system options',
    module: PERMISSION_MODULES.SETTINGS,
    type: 'action',
  },

  // --- INVOICE & RECEIPT PRINTING (CENTRALIZED) ---
  {
    key: 'action:printing:invoice_a4',
    name: 'Print/Download A4 Invoice',
    description: 'Generate, print, or download full A4 tax invoices across reservations and checkout',
    module: PERMISSION_MODULES.PRINTING,
    type: 'action',
  },
  {
    key: 'action:printing:invoice_80mm',
    name: 'Print 80mm Invoice/Receipt',
    description: 'Print 3-inch (80mm) thermal tax invoices and receipts',
    module: PERMISSION_MODULES.PRINTING,
    type: 'action',
  },
  {
    key: 'action:printing:invoice_58mm',
    name: 'Print 58mm Invoice/Receipt',
    description: 'Print 2-inch (58mm) thermal tax invoices and POS receipts',
    module: PERMISSION_MODULES.PRINTING,
    type: 'action',
  },
  {
    key: 'action:printing:payment_receipt',
    name: 'Print/Download Payment Receipt',
    description: 'Print official payment receipts across check-in and checkout workflows',
    module: PERMISSION_MODULES.PRINTING,
    type: 'action',
  },
  {
    key: 'action:printing:guest_registration_card',
    name: 'Print Guest Registration Card (GRC)',
    description: 'Generate and print Guest Registration Cards (GRC) for arriving and checked-in guests',
    module: PERMISSION_MODULES.PRINTING,
    type: 'action',
  },
];

// Mapping helper to resolve route pathname to corresponding page permission
export const ROUTE_PAGE_PERMISSION_MAP: Record<string, string> = {
  '/dashboard': 'page:dashboard',
  '/dashboard/rooms': 'page:rooms',
  '/dashboard/reservations': 'page:reservations',
  '/dashboard/checkin': 'page:checkin',
  '/dashboard/book': 'page:checkin',
  '/dashboard/checkout': 'page:checkin',
  '/dashboard/housekeeping': 'page:housekeeping',
  '/dashboard/restaurant': 'page:restaurant',
  '/dashboard/whatsapp': 'page:whatsapp',
  '/dashboard/staff': 'page:staff',
  '/dashboard/floors': 'page:floors',
  '/dashboard/reports': 'page:reports',
  '/dashboard/expenses': 'page:expenses',
  '/dashboard/services': 'page:services',
  '/dashboard/settings': 'page:settings',
};

// ==========================================
// 2. AUTHORIZATION HELPERS
// ==========================================

/**
 * Checks whether an authenticated user is an Admin/Owner account.
 * Admin/Owner accounts possess full system clearance and bypass individual permission restrictions.
 */
export function isAdminOrOwner(user: UserAuthIdentity | null | undefined): boolean {
  if (!user) return false;

  // Explicitly check that the account is NOT a staff account
  if (user.isStaff || user.type === 'STAFF') {
    return false;
  }

  // Trusted user account roles from User model
  const privilegedRoles = ['ADMIN', 'OWNER', 'SELLER', 'MASTER', 'USER'];
  return privilegedRoles.includes(user.type) || privilegedRoles.includes(user.role || '');
}

/**
 * Checks whether an authenticated identity has permission to perform a specific action or view a page.
 *
 * Rules:
 * 1. Unauthenticated -> false
 * 2. Inactive staff -> false
 * 3. Admin / Owner -> true (Full access)
 * 4. Staff -> requires explicit match in granted permissions array
 */
export function hasPermission(user: UserAuthIdentity | null | undefined, permissionKey: string): boolean {
  if (!user) return false;

  // Inactive staff are denied all access
  if (user.isStaff && user.status !== 'active') {
    return false;
  }

  // Administrators and property owners possess wildcard access
  if (isAdminOrOwner(user)) {
    return true;
  }

  // Staff requires explicit granted permission (Deny-by-default)
  if (!user.permissions || !Array.isArray(user.permissions)) {
    return false;
  }

  // Direct match
  if (user.permissions.includes(permissionKey)) {
    return true;
  }

  // Backward compatibility fallback for legacy printing permission keys
  if (permissionKey === 'action:printing:invoice_a4') {
    return user.permissions.includes('action:checkout:print_invoice_a4') ||
           user.permissions.includes('action:reservations:print_invoice');
  }

  if (permissionKey === 'action:printing:invoice_80mm') {
    return user.permissions.includes('action:checkout:print_thermal_80mm') ||
           user.permissions.includes('action:reservations:print_receipt');
  }

  if (permissionKey === 'action:printing:invoice_58mm') {
    return user.permissions.includes('action:checkout:print_thermal_58mm') ||
           user.permissions.includes('action:reservations:print_receipt');
  }

  if (permissionKey === 'action:printing:payment_receipt') {
    return user.permissions.includes('action:checkout:print_receipt') ||
           user.permissions.includes('action:reservations:print_receipt');
  }

  if (permissionKey === 'action:printing:guest_registration_card') {
    return user.permissions.includes('action:checkout:print_receipt');
  }

  return false;
}

/**
 * Checks whether an authenticated identity has permission to view a specific dashboard page route.
 */
export function hasPageAccess(user: UserAuthIdentity | null | undefined, pathname: string): boolean {
  if (!user) return false;

  if (isAdminOrOwner(user)) {
    return true;
  }

  // Normalize path (e.g., match '/dashboard/rooms/123' to '/dashboard/rooms')
  const matchedRoute = Object.keys(ROUTE_PAGE_PERMISSION_MAP).find(route => {
    if (route === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });

  if (!matchedRoute) {
    // If not a registered protected subpage, default to checking page:dashboard
    return hasPermission(user, 'page:dashboard');
  }

  const requiredPermission = ROUTE_PAGE_PERMISSION_MAP[matchedRoute];
  return hasPermission(user, requiredPermission);
}

/**
 * Specialized helper: Checks whether an identity can conduct housekeeping inspections.
 * Even if a staff member has 'page:housekeeping' or 'action:housekeeping:clean',
 * they MUST specifically have 'action:housekeeping:inspect' to pass or reject inspections.
 */
export function canConductInspection(user: UserAuthIdentity | null | undefined): boolean {
  return hasPermission(user, 'action:housekeeping:inspect');
}

/**
 * Standard server-side helper for route handlers.
 * Returns null if authorized, or a 403 Forbidden NextResponse if unauthorized.
 */
export function requirePermission(user: UserAuthIdentity | null | undefined, permissionKey: string): { authorized: boolean; errorResponse?: { error: string; code: string; requiredPermission: string } } {
  if (!user) {
    return {
      authorized: false,
      errorResponse: { error: 'Unauthorized: Authentication required', code: 'UNAUTHORIZED', requiredPermission: permissionKey }
    };
  }

  if (user.isStaff && user.status !== 'active') {
    return {
      authorized: false,
      errorResponse: { error: 'Forbidden: Account is inactive', code: 'ACCOUNT_INACTIVE', requiredPermission: permissionKey }
    };
  }

  if (!hasPermission(user, permissionKey)) {
    return {
      authorized: false,
      errorResponse: {
        error: `Forbidden: Missing required permission '${permissionKey}'`,
        code: 'FORBIDDEN',
        requiredPermission: permissionKey
      }
    };
  }

  return { authorized: true };
}

/**
 * Returns the highest priority authorized route for an authenticated user,
 * or '/dashboard/no-access' if no page permissions are held.
 * Admin/Owner always defaults to '/dashboard'.
 */
export function getAuthorizedRedirectUrl(user: UserAuthIdentity | null | undefined): string {
  if (!user) return '/auth/custom';
  if (isAdminOrOwner(user)) return '/dashboard';

  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];

  const routePriority: Array<{ perm: string; url: string }> = [
    { perm: 'page:dashboard', url: '/dashboard' },
    { perm: 'page:checkin', url: '/dashboard/checkin' },
    { perm: 'page:housekeeping', url: '/dashboard/housekeeping' },
    { perm: 'page:reservations', url: '/dashboard/reservations' },
    { perm: 'page:rooms', url: '/dashboard/rooms' },
    { perm: 'page:services', url: '/dashboard/services' },
    { perm: 'page:floors', url: '/dashboard/floors' },
    { perm: 'page:staff', url: '/dashboard/staff' },
    { perm: 'page:reports', url: '/dashboard/reports' },
    { perm: 'page:expenses', url: '/dashboard/expenses' },
    { perm: 'page:settings', url: '/dashboard/settings' },
  ];

  for (const item of routePriority) {
    if (userPermissions.includes(item.perm)) {
      return item.url;
    }
  }

  return '/dashboard/no-access';
}
