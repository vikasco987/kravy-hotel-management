"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Shield,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  BedDouble,
  CalendarCheck,
  LogIn,
  SlidersHorizontal,
  UserCog,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  Printer
} from 'lucide-react';
import {
  PERMISSION_CATALOG,
  PERMISSION_MODULES,
  type PermissionModule,
  type PermissionDefinition
} from '@/lib/permissions';

export interface StaffPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: {
    id: string;
    name: string;
    role: string;
    email?: string | null;
    phone?: string | null;
    status: 'active' | 'inactive';
    permissions?: string[];
  } | null;
  onSuccess: (updatedPermissions: string[]) => void;
}

// Implemented Admin pages and their features in Kravy Hotel Management
export const ACTIVE_MODULE_CONFIG: {
  module: PermissionModule;
  label: string;
  routePath: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: {
    bg: string;
    text: string;
    border: string;
    ring: string;
    badge: string;
  };
}[] = [
  {
    module: PERMISSION_MODULES.DASHBOARD,
    label: 'Dashboard',
    routePath: '/dashboard',
    description: 'Main operational overview, room summary grid, and financial KPIs',
    icon: SlidersHorizontal,
    accentColor: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      ring: 'focus:ring-blue-500',
      badge: 'bg-blue-100 text-blue-800'
    }
  },
  {
    module: PERMISSION_MODULES.ROOMS,
    label: 'Rooms Management',
    routePath: '/dashboard/rooms',
    description: 'Floor-wise room grid, add room, edit category/pricing, delete room, and change room status',
    icon: BedDouble,
    accentColor: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      ring: 'focus:ring-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800'
    }
  },
  {
    module: PERMISSION_MODULES.FLOORS,
    label: 'Floors Layout',
    routePath: '/dashboard/floors',
    description: 'Property floor layout, create floor, rename/renumber floors, and delete empty floors',
    icon: Layers,
    accentColor: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      ring: 'focus:ring-sky-500',
      badge: 'bg-sky-100 text-sky-800'
    }
  },
  {
    module: PERMISSION_MODULES.RESERVATIONS,
    label: 'Reservations',
    routePath: '/dashboard/reservations',
    description: 'Booking directory, new booking wizard, edit reservation, and cancellation',
    icon: CalendarCheck,
    accentColor: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      ring: 'focus:ring-indigo-500',
      badge: 'bg-indigo-100 text-indigo-800'
    }
  },
  {
    module: PERMISSION_MODULES.CHECKIN,
    label: 'Check-in & Check-out',
    routePath: '/dashboard/checkin',
    description: 'Arrivals terminal, guest check-in workflow, check-out settlement, and extra bill charges',
    icon: LogIn,
    accentColor: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
      ring: 'focus:ring-teal-500',
      badge: 'bg-teal-100 text-teal-800'
    }
  },
  {
    module: PERMISSION_MODULES.HOUSEKEEPING,
    label: 'Housekeeping',
    routePath: '/dashboard/housekeeping',
    description: 'Cleaning task queues, cleaning workflow, task checklists, and supervisory room inspection',
    icon: Sparkles,
    accentColor: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      ring: 'focus:ring-amber-500',
      badge: 'bg-amber-100 text-amber-800'
    }
  },
  {
    module: PERMISSION_MODULES.SERVICES,
    label: 'Extra Services',
    routePath: '/dashboard/services',
    description: 'Extra guest amenities, laundry, food pricing, and service catalog management',
    icon: Sparkles,
    accentColor: {
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      border: 'border-violet-200',
      ring: 'focus:ring-violet-500',
      badge: 'bg-violet-100 text-violet-800'
    }
  },
  {
    module: PERMISSION_MODULES.STAFF,
    label: 'Staff Directory',
    routePath: '/dashboard/staff',
    description: 'Staff directory profiles, add staff, edit details, and permission configuration',
    icon: UserCog,
    accentColor: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      ring: 'focus:ring-purple-500',
      badge: 'bg-purple-100 text-purple-800'
    }
  },
  {
    module: PERMISSION_MODULES.PRINTING,
    label: 'Invoice & Receipt Printing',
    routePath: '/dashboard/print',
    description: 'Centralized controls for A4 tax invoices, 80mm/58mm thermal receipts, payment receipts, and GRC cards',
    icon: Printer,
    accentColor: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      ring: 'focus:ring-rose-500',
      badge: 'bg-rose-100 text-rose-800'
    }
  }
];

export function StaffPermissionsModal({
  isOpen,
  onClose,
  staff,
  onSuccess
}: StaffPermissionsModalProps) {
  if (!isOpen || !staff) return null;

  return (
    <StaffPermissionsModalContent
      key={`${staff.id}-${(staff.permissions || []).join(',')}`}
      staff={staff}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function StaffPermissionsModalContent({
  staff,
  onClose,
  onSuccess
}: {
  staff: NonNullable<StaffPermissionsModalProps['staff']>;
  onClose: () => void;
  onSuccess: (updatedPermissions: string[]) => void;
}) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(() =>
    Array.isArray(staff.permissions) ? [...staff.permissions] : []
  );
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>(() => {
    // Expand by default any module where the staff currently has permissions, plus the first module
    const initial: Record<string, boolean> = {};
    ACTIVE_MODULE_CONFIG.forEach((cfg, idx) => {
      const pageKey = `page:${cfg.module}`;
      const hasAny = (staff.permissions || []).some(
        p => p === pageKey || p.startsWith(`action:${cfg.module}:`)
      );
      initial[cfg.module] = hasAny || idx === 0;
    });
    return initial;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Group catalog items by supported active modules
  const moduleGroups = useMemo(() => {
    const activeModuleKeys = new Set(ACTIVE_MODULE_CONFIG.map(m => m.module));
    const activeDefs = PERMISSION_CATALOG.filter(p => activeModuleKeys.has(p.module));
    const q = searchQuery.trim().toLowerCase();

    return ACTIVE_MODULE_CONFIG.map(cfg => {
      const pagePermission = activeDefs.find(p => p.module === cfg.module && p.type === 'page');
      let actionPermissions = activeDefs.filter(p => p.module === cfg.module && p.type === 'action');

      if (q) {
        actionPermissions = actionPermissions.filter(a =>
          a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.key.toLowerCase().includes(q)
        );
      }

      return {
        ...cfg,
        pagePermission,
        actionPermissions
      };
    }).filter(group => {
      if (!q) return true;
      const matchesPage = group.label.toLowerCase().includes(q) ||
        group.description.toLowerCase().includes(q) ||
        (group.pagePermission && (group.pagePermission.name.toLowerCase().includes(q) || group.pagePermission.description.toLowerCase().includes(q)));
      return matchesPage || group.actionPermissions.length > 0;
    });
  }, [searchQuery]);

  const togglePageAccordion = (moduleKey: string) => {
    setExpandedPages(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
  };

  const expandAllPages = () => {
    const next: Record<string, boolean> = {};
    ACTIVE_MODULE_CONFIG.forEach(cfg => {
      next[cfg.module] = true;
    });
    setExpandedPages(next);
  };

  const collapseAllPages = () => {
    const next: Record<string, boolean> = {};
    ACTIVE_MODULE_CONFIG.forEach(cfg => {
      next[cfg.module] = false;
    });
    setExpandedPages(next);
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllInModule = (group: typeof moduleGroups[0]) => {
    const allKeys: string[] = [];
    if (group.pagePermission) allKeys.push(group.pagePermission.key);
    group.actionPermissions.forEach(a => allKeys.push(a.key));

    const allSelected = allKeys.every(k => selectedPermissions.includes(k));

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(k => !allKeys.includes(k)));
    } else {
      setSelectedPermissions(prev => Array.from(new Set([...prev, ...allKeys])));
    }
  };

  const handleGrantRecommendedForRole = () => {
    let presetKeys: string[] = [];
    switch (staff.role) {
      case 'HOUSEKEEPING':
        presetKeys = [
          'page:housekeeping',
          'action:housekeeping:clean'
        ];
        break;
      case 'RECEPTIONIST':
        presetKeys = [
          'page:dashboard',
          'page:rooms',
          'action:rooms:change_status',
          'page:reservations',
          'action:reservations:create',
          'action:reservations:edit',
          'page:checkin',
          'action:checkin:perform',
          'action:checkout:settle_payment',
          'action:checkout:add_services',
          'page:housekeeping',
          'page:services'
        ];
        break;
      case 'MANAGER':
        presetKeys = [
          'page:dashboard',
          'action:dashboard:view_kpi',
          'page:rooms',
          'action:rooms:create',
          'action:rooms:edit',
          'action:rooms:change_status',
          'page:reservations',
          'action:reservations:create',
          'action:reservations:edit',
          'action:reservations:cancel',
          'page:checkin',
          'action:checkin:perform',
          'action:checkout:settle_payment',
          'action:checkout:add_services',
          'page:housekeeping',
          'action:housekeeping:clean',
          'action:housekeeping:inspect',
          'page:floors',
          'action:floors:create',
          'action:floors:edit',
          'page:services',
          'action:services:manage',
          'page:staff'
        ];
        break;
      default:
        presetKeys = [
          'page:dashboard',
          'page:rooms',
          'page:reservations'
        ];
    }
    setSelectedPermissions(presetKeys);
  };

  const handleClearAll = () => {
    setSelectedPermissions([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/hotel/staff/${staff.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          permissions: selectedPermissions
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update staff permissions.');
      }

      setSuccessMessage('Permissions successfully updated.');
      onSuccess(selectedPermissions);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      console.error('Error saving staff permissions:', err);
      const msg = err instanceof Error ? err.message : 'An error occurred while saving permissions.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-100">
              <Shield size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Staff Permissions: {staff.name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    staff.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      staff.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {staff.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Role: <span className="font-semibold text-slate-700">{staff.role}</span>
                {staff.email && <span className="ml-2 font-mono text-[11px] text-slate-400">• {staff.email}</span>}
                {staff.phone && <span className="ml-2 font-mono text-[11px] text-slate-400">• {staff.phone}</span>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition disabled:opacity-50 cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* NOTIFICATION BANNERS */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold shrink-0 animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs font-semibold shrink-0 animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {/* INFO NOTICE */}
        <div className="mx-6 mt-4 px-4 py-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl flex items-start gap-2.5 text-[11px] text-amber-900 font-medium shrink-0">
          <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <p>
            <span className="font-bold">Page-by-Page Permission Control:</span> Expand each page below to configure its page route access and individual operational features. Page access determines whether staff can open that page; action permissions independently control which buttons and operations they can perform.
          </p>
        </div>

        {/* TOOLBAR: SEARCH, SUMMARY & QUICK ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-3 pb-2.5 shrink-0 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-sm">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search page or action permission..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-slate-50/50 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active: <span className="text-indigo-600 font-black">{selectedPermissions.length}</span>
            </span>
            <div className="h-3 w-px bg-slate-200" />
            <button
              type="button"
              onClick={expandAllPages}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAllPages}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Collapse All
            </button>
            <div className="h-3 w-px bg-slate-200" />
            <button
              type="button"
              onClick={handleGrantRecommendedForRole}
              className="px-3 py-1.5 text-xs font-bold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
            >
              Recommended for {staff.role}
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 text-xs font-bold rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* EXPANDABLE PAGE-BY-PAGE LIST */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
          {moduleGroups.map(group => {
            const Icon = group.icon;
            const pageKey = group.pagePermission?.key;
            const isPageChecked = pageKey ? selectedPermissions.includes(pageKey) : false;
            const isExpanded = !!expandedPages[group.module];

            const allModuleKeys: string[] = [];
            if (pageKey) allModuleKeys.push(pageKey);
            group.actionPermissions.forEach(a => allModuleKeys.push(a.key));

            const totalInModule = allModuleKeys.length;
            const checkedInModule = allModuleKeys.filter(k => selectedPermissions.includes(k)).length;
            const isAllSelected = totalInModule > 0 && checkedInModule === totalInModule;

            return (
              <div
                key={group.module}
                className={`rounded-2xl border transition-all ${
                  isExpanded
                    ? 'border-indigo-200 bg-white shadow-sm ring-1 ring-indigo-500/10'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Collapsible Header Bar */}
                <div
                  onClick={() => togglePageAccordion(group.module)}
                  className="p-4 bg-slate-50/70 border-b border-gray-100 flex items-center justify-between gap-3 cursor-pointer select-none rounded-t-2xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl ${group.accentColor.bg} ${group.accentColor.text} flex items-center justify-center shrink-0 border ${group.accentColor.border}`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900">{group.label}</h4>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {group.routePath}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${group.accentColor.badge}`}>
                          {checkedInModule} / {totalInModule} active
                        </span>
                        {isPageChecked && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Page Allowed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{group.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleSelectAllInModule(group)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-slate-600 hover:text-slate-900 bg-white border border-gray-200 hover:bg-slate-100 transition shadow-xs cursor-pointer"
                    >
                      {isAllSelected ? 'Deselect Page' : 'Select All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePageAccordion(group.module)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      aria-label="Toggle page section"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="p-4 space-y-3.5 bg-white rounded-b-2xl animate-in fade-in duration-150">
                    {/* Primary Page Access Checkbox */}
                    {group.pagePermission && (
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3.5">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isPageChecked}
                            onChange={() => togglePermission(group.pagePermission!.key)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900">
                                {group.pagePermission.name} ({group.routePath})
                              </span>
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-600 text-white tracking-wider">
                                Page Access
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              {group.pagePermission.description}. When disabled, staff cannot open or view this page.
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Individual Page Features & Action Permissions */}
                    {group.actionPermissions.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Available Features & Actions on this Page
                          </span>
                          <span className="text-[10px] text-slate-400 italic">
                            Independent of page access
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {group.actionPermissions.map((action: PermissionDefinition) => {
                            const isChecked = selectedPermissions.includes(action.key);
                            const isInspection = action.key === 'action:housekeeping:inspect';

                            return (
                              <label
                                key={action.key}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                                  isChecked
                                    ? isInspection
                                      ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/30'
                                      : 'bg-indigo-50/30 border-indigo-200 ring-1 ring-indigo-500/10'
                                    : 'bg-white border-gray-200 hover:bg-slate-50/60'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(action.key)}
                                  className={`mt-0.5 h-4 w-4 rounded border-gray-300 ${
                                    isInspection ? 'text-amber-600 focus:ring-amber-500' : 'text-indigo-600 focus:ring-indigo-500'
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-900">
                                      {action.name}
                                    </span>
                                    {isInspection && (
                                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 tracking-wide flex items-center gap-0.5">
                                        <Lock size={9} /> Supervisory
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                    {action.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-slate-50 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Configuring <span className="font-bold text-slate-900">{staff.name}</span> ({staff.role})
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving Permissions...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Save Permissions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

