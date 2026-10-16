"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Sparkles,
  Shield,
  Phone,
  Mail,
  Search,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Power,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Code,
  Info,
  Lock
} from 'lucide-react';
import dayjs from 'dayjs';
import { ApiJsonDebugger } from '@/components/ui/ApiJsonDebugger';
import { StaffPermissionsModal, ACTIVE_MODULE_CONFIG } from '@/components/hotel/StaffPermissionsModal';
import { PERMISSION_CATALOG, type PermissionDefinition } from '@/lib/permissions';

interface StaffMember {
  id: string;
  name: string;
  role: 'HOUSEKEEPING' | 'RECEPTIONIST' | 'MANAGER' | 'STAFF';
  email: string | null;
  phone: string | null;
  status: 'active' | 'inactive';
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}

const ROLE_CONFIG: Record<string, { label: string; badgeBg: string; badgeText: string; border: string }> = {
  HOUSEKEEPING: {
    label: 'Housekeeping (HK)',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    border: 'border-amber-200'
  },
  RECEPTIONIST: {
    label: 'Receptionist / Front Desk',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    border: 'border-indigo-200'
  },
  MANAGER: {
    label: 'Hotel Manager',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    border: 'border-purple-200'
  },
  STAFF: {
    label: 'Operational Staff',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    border: 'border-slate-200'
  }
};

const sanitizeBody = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeBody);
  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    if (['password', 'token', 'secret', 'cookie', 'authorization'].includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeBody(sanitized[key]);
    }
  }
  return sanitized;
};

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState<string>('ALL');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Permissions Modal State
  const [permissionsModal, setPermissionsModal] = useState<{
    isOpen: boolean;
    staff: StaffMember | null;
  }>({
    isOpen: false,
    staff: null
  });

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<'HOUSEKEEPING' | 'RECEPTIONIST' | 'MANAGER' | 'STAFF'>('HOUSEKEEPING');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formPassword, setFormPassword] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formPermissionsExpanded, setFormPermissionsExpanded] = useState(false);
  const [formExpandedPages, setFormExpandedPages] = useState<Record<string, boolean>>({});

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    staff: StaffMember | null;
    action: 'activate' | 'deactivate';
  }>({
    isOpen: false,
    staff: null,
    action: 'deactivate'
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // API JSON Debugger State
  const [apiRequests, setApiRequests] = useState<any[]>([]);
  const [isApiJsonOpen, setIsApiJsonOpen] = useState(false);

  const trackedFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const startTime = Date.now();
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    try {
      const response = await window.fetch(input, init);
      const cloned = response.clone();
      const status = response.status;
      const responseTimeMs = Date.now() - startTime;
      const text = await cloned.text();
      let d;
      try { d = JSON.parse(text); } catch { d = text; }

      setApiRequests(prev => [...prev, {
        url,
        method,
        status,
        responseTimeMs,
        timestamp: new Date().toISOString(),
        response: sanitizeBody(d)
      }]);

      return response;
    } catch (e: any) {
      setApiRequests(prev => [...prev, {
        url,
        method,
        status: 'ERROR',
        responseTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        response: { error: String(e) }
      }]);
      throw e;
    }
  }, []);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await trackedFetch('/api/hotel/staff');
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please log in to manage hotel staff.');
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load staff list.');
      }
      const data = await res.json();
      setStaffList(Array.isArray(data) ? data : []);
      setErrorMessage(null);
    } catch (err: unknown) {
      console.error('Error fetching staff:', err);
      const msg = err instanceof Error ? err.message : 'Unable to load staff data.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [trackedFetch]);

  useEffect(() => {
    let active = true;
    trackedFetch('/api/hotel/staff')
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) throw new Error('Please log in to manage hotel staff.');
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load staff list.');
        }
        return res.json();
      })
      .then((data) => {
        if (active) {
          setStaffList(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : 'Unable to load staff data.';
          setErrorMessage(msg);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [trackedFetch]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter(s => s.status === 'active').length;
    const inactive = staffList.filter(s => s.status === 'inactive').length;
    const housekeeping = staffList.filter(s => s.role === 'HOUSEKEEPING').length;
    const receptionAndManagement = staffList.filter(s => s.role === 'RECEPTIONIST' || s.role === 'MANAGER').length;
    return { total, active, inactive, housekeeping, receptionAndManagement };
  }, [staffList]);

  // Filtered List
  const filteredStaff = useMemo(() => {
    return staffList.filter(member => {
      // Role filter
      if (activeRoleFilter !== 'ALL' && member.role !== activeRoleFilter) {
        return false;
      }
      // Status filter
      if (activeStatusFilter !== 'ALL' && member.status !== activeStatusFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim() !== '') {
        const query = searchQuery.trim().toLowerCase();
        const matchName = member.name.toLowerCase().includes(query);
        const matchEmail = (member.email || '').toLowerCase().includes(query);
        const matchPhone = (member.phone || '').includes(query);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }
      return true;
    });
  }, [staffList, activeRoleFilter, activeStatusFilter, searchQuery]);

  // Active Permission Module Groups (Implemented Modules Only)
  const [formPermissionSearch, setFormPermissionSearch] = useState('');

  const activeModuleGroups = useMemo(() => {
    const activeModuleKeys = new Set(ACTIVE_MODULE_CONFIG.map(m => m.module));
    const activeDefs = PERMISSION_CATALOG.filter(p => activeModuleKeys.has(p.module));
    const q = formPermissionSearch.trim().toLowerCase();

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
  }, [formPermissionSearch]);

  // Open Add Modal
  const openAddModal = () => {
    setEditingStaff(null);
    setFormName('');
    setFormRole('HOUSEKEEPING');
    setFormEmail('');
    setFormPhone('');
    setFormStatus('active');
    setFormPassword('');
    setFormPermissions([]);
    setFormPermissionsExpanded(false);
    const initialPages: Record<string, boolean> = {};
    ACTIVE_MODULE_CONFIG.forEach((cfg, idx) => {
      initialPages[cfg.module] = idx === 0;
    });
    setFormExpandedPages(initialPages);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (member: StaffMember) => {
    setEditingStaff(member);
    setFormName(member.name);
    setFormRole(member.role);
    setFormEmail(member.email || '');
    setFormPhone(member.phone || '');
    setFormStatus(member.status);
    setFormPassword('');
    const existing = Array.isArray(member.permissions) ? [...member.permissions] : [];
    setFormPermissions(existing);
    setFormPermissionsExpanded(false);
    const initialPages: Record<string, boolean> = {};
    ACTIVE_MODULE_CONFIG.forEach((cfg, idx) => {
      const pageKey = `page:${cfg.module}`;
      const hasAny = existing.some(
        p => p === pageKey || p.startsWith(`action:${cfg.module}:`)
      );
      initialPages[cfg.module] = hasAny || idx === 0;
    });
    setFormExpandedPages(initialPages);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Staff name is required');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const isEditing = !!editingStaff;
      const url = isEditing ? `/api/hotel/staff/${editingStaff.id}` : '/api/hotel/staff';
      const method = isEditing ? 'PATCH' : 'POST';

      const payload: Record<string, any> = {
        name: formName.trim(),
        role: formRole,
        email: formEmail.trim() || undefined,
        phone: formPhone.trim() || undefined,
        status: formStatus
      };

      if (formPassword.trim()) {
        payload.password = formPassword.trim();
      }

      // If creating new staff, include selected permissions (or empty array if none selected)
      if (!isEditing) {
        payload.permissions = formPermissions;
      }

      const res = await trackedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save staff member');
      }

      showNotification('success', isEditing ? 'Staff member updated successfully' : 'Staff member created successfully');
      setIsModalOpen(false);
      fetchStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong while saving staff details.';
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle status (Safe deactivation / activation)
  const handleToggleStatus = async () => {
    if (!confirmModal.staff) return;
    const member = confirmModal.staff;
    const newStatus = confirmModal.action === 'deactivate' ? 'inactive' : 'active';

    try {
      const res = await trackedFetch(`/api/hotel/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      showNotification('success', `Staff member successfully ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      setConfirmModal({ isOpen: false, staff: null, action: 'deactivate' });
      fetchStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update staff status';
      showNotification('error', msg);
      setConfirmModal({ isOpen: false, staff: null, action: 'deactivate' });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'ST';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-indigo-100 text-indigo-700',
      'bg-rose-100 text-rose-700',
      'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700',
      'bg-purple-100 text-purple-700',
      'bg-sky-100 text-sky-700'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-bold ${
            notification.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                <Users size={22} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff Management</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Configure team members, hotel roles, contact details, and active operational status
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsApiJsonOpen(true)}
              className="flex items-center gap-1.5 bg-slate-800 text-white hover:bg-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm whitespace-nowrap"
              title="View Staff API JSON and Network Logs"
            >
              <Code size={14} strokeWidth={2.5} />
              <span>API JSON</span>
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-indigo-500/20 transition-all hover:scale-[1.01] shrink-0"
            >
              <UserPlus size={16} strokeWidth={2.5} />
              <span>Add Staff Member</span>
            </button>
          </div>
        </div>

        {/* SUMMARY KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate">Total Staff</span>
              <span className="text-2xl font-black text-gray-900 mt-1">{stats.total}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-emerald-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate">Active Staff</span>
              <span className="text-2xl font-black text-gray-900 mt-1">{stats.active}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-rose-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <UserX size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate">Inactive Staff</span>
              <span className="text-2xl font-black text-gray-900 mt-1">{stats.inactive}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-purple-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Shield size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate">Reception & Management</span>
              <span className="text-2xl font-black text-gray-900 mt-1">{stats.receptionAndManagement}</span>
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTERS BAR */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
            <button
              onClick={() => setActiveRoleFilter('ALL')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-colors whitespace-nowrap ${
                activeRoleFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Roles <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeRoleFilter === 'ALL' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{staffList.length}</span>
            </button>

            <button
              onClick={() => setActiveRoleFilter('HOUSEKEEPING')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-colors whitespace-nowrap ${
                activeRoleFilter === 'HOUSEKEEPING'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Housekeeping <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeRoleFilter === 'HOUSEKEEPING' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{stats.housekeeping}</span>
            </button>

            <button
              onClick={() => setActiveRoleFilter('RECEPTIONIST')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-colors whitespace-nowrap ${
                activeRoleFilter === 'RECEPTIONIST'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Receptionists <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeRoleFilter === 'RECEPTIONIST' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{staffList.filter(s => s.role === 'RECEPTIONIST').length}</span>
            </button>

            <button
              onClick={() => setActiveRoleFilter('MANAGER')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-colors whitespace-nowrap ${
                activeRoleFilter === 'MANAGER'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Managers <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeRoleFilter === 'MANAGER' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{staffList.filter(s => s.role === 'MANAGER').length}</span>
            </button>

            <button
              onClick={() => setActiveRoleFilter('STAFF')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-colors whitespace-nowrap ${
                activeRoleFilter === 'STAFF'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Staff <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeRoleFilter === 'STAFF' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{staffList.filter(s => s.role === 'STAFF').length}</span>
            </button>
          </div>

          {/* Right: Search & Status dropdown */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <div className="relative shrink-0">
              <select
                value={activeStatusFilter}
                onChange={(e) => setActiveStatusFilter(e.target.value as 'ALL' | 'active' | 'inactive')}
                className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none hover:border-gray-300 focus:border-indigo-500 appearance-none transition-colors"
              >
                <option value="ALL">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Search Input */}
            <div className="relative flex-1 md:w-[260px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, phone, email..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-gray-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* STAFF DIRECTORY TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={32} className="animate-spin text-indigo-600 mb-3" />
              <span className="text-sm font-bold">Loading staff directory...</span>
            </div>
          ) : errorMessage ? (
            <div className="p-12 text-center">
              <AlertCircle size={36} className="text-rose-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Unable to load staff data</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">{errorMessage}</p>
              <button
                onClick={fetchStaff}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
              >
                Retry
              </button>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mb-4">
                <Users size={30} />
              </div>
              <h3 className="text-base font-black text-slate-900">No Staff Members Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
                {searchQuery || activeRoleFilter !== 'ALL' || activeStatusFilter !== 'ALL'
                  ? 'No staff members matched your current filters. Try resetting the filters or search term.'
                  : 'Get started by registering your first hotel staff member to assign housekeeping and front desk responsibilities.'}
              </p>
              {searchQuery || activeRoleFilter !== 'ALL' || activeStatusFilter !== 'ALL' ? (
                <button
                  onClick={() => { setSearchQuery(''); setActiveRoleFilter('ALL'); setActiveStatusFilter('ALL'); }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <UserPlus size={15} />
                  <span>Add First Staff Member</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="px-5 py-4">Staff Member</th>
                    <th className="px-5 py-4">Designation / Role</th>
                    <th className="px-5 py-4">Contact Info</th>
                    <th className="px-5 py-4">Housekeeping Tasks</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStaff.map((member) => {
                    const roleInfo = ROLE_CONFIG[member.role] || ROLE_CONFIG.STAFF;
                    const taskCount = member._count?.tasks || 0;

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition-colors bg-white">
                        {/* Name & Avatar */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${getAvatarColor(member.name)}`}>
                              {getInitials(member.name)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 leading-tight">{member.name}</span>
                              <span className="text-[11px] text-slate-400 mt-0.5">
                                Added {dayjs(member.createdAt).format('DD MMM YYYY')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${roleInfo.badgeBg} ${roleInfo.badgeText} ${roleInfo.border}`}>
                            {roleInfo.label}
                          </span>
                        </td>

                        {/* Contact Info */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-0.5">
                            {member.phone ? (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                <Phone size={12} className="text-slate-400 shrink-0" />
                                <span>{member.phone}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No phone</span>
                            )}
                            {member.email ? (
                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                <Mail size={12} className="text-slate-400 shrink-0" />
                                <span className="truncate max-w-[200px]">{member.email}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No email</span>
                            )}
                          </div>
                        </td>

                        {/* Tasks Count */}
                        <td className="px-5 py-4">
                          {member.role === 'HOUSEKEEPING' ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/70 border border-amber-100 text-amber-800 text-xs font-bold">
                              <Sparkles size={12} className="text-amber-500" />
                              <span>{taskCount} {taskCount === 1 ? 'task' : 'tasks'}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          {member.status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPermissionsModal({ isOpen: true, staff: member })}
                              title="Manage individual permissions"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition shadow-xs"
                            >
                              <Shield size={13} className="text-indigo-600" />
                              <span className="hidden sm:inline">Permissions</span>
                            </button>

                            <button
                              onClick={() => openEditModal(member)}
                              title="Edit staff details"
                              className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-100 transition shadow-xs"
                            >
                              <Edit2 size={14} />
                            </button>

                            {member.status === 'active' ? (
                              <button
                                onClick={() => setConfirmModal({ isOpen: true, staff: member, action: 'deactivate' })}
                                title="Deactivate staff member"
                                className="p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 hover:border-rose-100 transition shadow-xs"
                              >
                                <Power size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmModal({ isOpen: true, staff: member, action: 'activate' })}
                                title="Reactivate staff member"
                                className="p-2 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-100 transition shadow-xs"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT STAFF MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {editingStaff ? <Edit2 size={18} /> : <UserPlus size={18} />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingStaff ? `Update details for ${editingStaff.name}` : 'Register a staff member for hotel operations'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                />
              </div>

              {/* Operational Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Operational Role / Designation <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as StaffMember['role'])}
                    className="w-full h-11 px-3.5 pr-10 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 appearance-none transition"
                  >
                    <option value="HOUSEKEEPING">Housekeeping (Room Cleaning & Maintenance)</option>
                    <option value="RECEPTIONIST">Receptionist / Front Desk (Check-in/Check-out)</option>
                    <option value="MANAGER">Hotel Manager (Operations & Approvals)</option>
                    <option value="STAFF">Operational Staff (General Operations)</option>
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. ramesh@hotel.com"
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Employment Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormStatus('active')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                      formStatus === 'active'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                        : 'bg-slate-50 border-gray-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 size={14} className={formStatus === 'active' ? 'text-emerald-600' : 'text-slate-400'} />
                    Active
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('inactive')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                      formStatus === 'inactive'
                        ? 'bg-slate-200 border-slate-300 text-slate-800 shadow-xs'
                        : 'bg-slate-50 border-gray-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <UserX size={14} className={formStatus === 'inactive' ? 'text-slate-700' : 'text-slate-400'} />
                    Inactive
                  </button>
                </div>
              </div>

              {/* Optional Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {editingStaff ? 'Change Password (Leave blank to keep current)' : 'Password (Optional for Portal Access)'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingStaff ? '••••••••' : 'Enter password if login required'}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Collapsible Page & Action Permissions Section (Only for new staff creation) */}
              {!editingStaff && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-slate-300 transition-colors overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFormPermissionsExpanded(prev => !prev)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl transition"
                    >
                      {/* Left: Shield icon + Heading + Description + Badge */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                          <Shield size={19} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              Configure Permissions
                            </h4>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                                formPermissions.length > 0
                                  ? 'bg-indigo-100 text-indigo-700 font-bold border border-indigo-200'
                                  : 'bg-slate-200/80 text-slate-600 border border-slate-300/60'
                              }`}
                            >
                              {formPermissions.length} selected
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                            Choose which pages and actions this staff member can access.
                          </p>
                        </div>
                      </div>

                      {/* Right: Configure/Collapse Action + Chevron */}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 shrink-0 self-center pl-2">
                        <span className="hidden sm:inline">
                          {formPermissionsExpanded ? 'Collapse' : 'Configure'}
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          {formPermissionsExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </div>
                      </div>
                    </button>

                    {formPermissionsExpanded && (
                      <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-indigo-100/70 bg-white">
                        {/* Notice, Search & Quick Actions */}
                        <div className="space-y-2 pt-2 pb-1 border-b border-gray-100">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-medium">
                              <Info size={13} className="shrink-0 text-amber-600" />
                              <span>Expand each page to configure page access and actions independently.</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const allOpen: Record<string, boolean> = {};
                                  ACTIVE_MODULE_CONFIG.forEach(cfg => { allOpen[cfg.module] = true; });
                                  setFormExpandedPages(allOpen);
                                }}
                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                              >
                                Expand All
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const allClosed: Record<string, boolean> = {};
                                  ACTIVE_MODULE_CONFIG.forEach(cfg => { allClosed[cfg.module] = false; });
                                  setFormExpandedPages(allClosed);
                                }}
                                className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                              >
                                Collapse All
                              </button>
                              {formPermissions.length > 0 && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    type="button"
                                    onClick={() => setFormPermissions([])}
                                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline shrink-0"
                                  >
                                    Clear All ({formPermissions.length})
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={formPermissionSearch}
                              onChange={e => setFormPermissionSearch(e.target.value)}
                              placeholder="Search permissions by name, page, or action..."
                              className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-gray-200 bg-slate-50/60 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                            {formPermissionSearch && (
                              <button
                                type="button"
                                onClick={() => setFormPermissionSearch('')}
                                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Modules Page-by-Page Accordion */}
                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                          {activeModuleGroups.map((group) => {
                            const Icon = group.icon;
                            const pageKey = group.pagePermission?.key;
                            const isPageChecked = pageKey ? formPermissions.includes(pageKey) : false;
                            const isExpanded = !!formExpandedPages[group.module];

                            const allModuleKeys: string[] = [];
                            if (pageKey) allModuleKeys.push(pageKey);
                            group.actionPermissions.forEach(a => allModuleKeys.push(a.key));

                            const checkedInModule = allModuleKeys.filter(k => formPermissions.includes(k)).length;
                            const isAllSelected = allModuleKeys.length > 0 && checkedInModule === allModuleKeys.length;

                            return (
                              <div
                                key={group.module}
                                className={`rounded-xl border transition-all ${
                                  isExpanded
                                    ? 'border-indigo-200 bg-white shadow-xs'
                                    : 'border-gray-200 bg-slate-50/50 hover:border-gray-300'
                                }`}
                              >
                                {/* Page Section Header */}
                                <div
                                  onClick={() => setFormExpandedPages(prev => ({ ...prev, [group.module]: !prev[group.module] }))}
                                  className="p-3 flex items-center justify-between gap-2 cursor-pointer select-none rounded-t-xl"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-7 h-7 rounded-lg ${group.accentColor.bg} ${group.accentColor.text} flex items-center justify-center shrink-0 border ${group.accentColor.border}`}>
                                      <Icon size={14} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-black text-slate-900">{group.label}</span>
                                        <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                                          {group.routePath}
                                        </span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${group.accentColor.badge}`}>
                                          {checkedInModule} / {allModuleKeys.length}
                                        </span>
                                        {isPageChecked && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                            Page Allowed
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isAllSelected) {
                                          setFormPermissions(prev => prev.filter(k => !allModuleKeys.includes(k)));
                                        } else {
                                          setFormPermissions(prev => Array.from(new Set([...prev, ...allModuleKeys])));
                                        }
                                      }}
                                      className="text-[10px] font-bold text-slate-600 hover:text-indigo-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md hover:bg-slate-50 transition shadow-xs cursor-pointer"
                                    >
                                      {isAllSelected ? 'Deselect Page' : 'Select All'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setFormExpandedPages(prev => ({ ...prev, [group.module]: !prev[group.module] }))}
                                      className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                      aria-label="Toggle page section"
                                    >
                                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                    </button>
                                  </div>
                                </div>

                                {/* Expanded Page Content */}
                                {isExpanded && (
                                  <div className="p-3 pt-1 space-y-2.5 border-t border-gray-100 bg-white rounded-b-xl animate-in fade-in duration-150">
                                    {/* Primary Page Access Checkbox */}
                                    {group.pagePermission && (
                                      <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-2.5">
                                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={isPageChecked}
                                            onChange={() => {
                                              const key = group.pagePermission!.key;
                                              setFormPermissions(prev =>
                                                prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                                              );
                                            }}
                                            className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                          />
                                          <div className="flex-1">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-[11px] font-bold text-slate-900">
                                                {group.pagePermission.name} ({group.routePath})
                                              </span>
                                              <span className="text-[8px] font-black uppercase px-1 rounded bg-indigo-600 text-white">
                                                Page Access
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                              {group.pagePermission.description}. When disabled, this page cannot be opened.
                                            </p>
                                          </div>
                                        </label>
                                      </div>
                                    )}

                                    {/* Action Permissions */}
                                    {group.actionPermissions.length > 0 && (
                                      <div className="pt-0.5">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
                                          Available Actions on this Page
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {group.actionPermissions.map((action: PermissionDefinition) => {
                                            const isActionChecked = formPermissions.includes(action.key);
                                            const isInspect = action.key === 'action:housekeeping:inspect';

                                            return (
                                              <label
                                                key={action.key}
                                                className={`flex items-start gap-2 p-2 rounded-lg border transition cursor-pointer select-none ${
                                                  isActionChecked
                                                    ? isInspect
                                                      ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300/30'
                                                      : 'bg-indigo-50/40 border-indigo-200'
                                                    : 'bg-white border-gray-200 hover:bg-slate-50'
                                                }`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isActionChecked}
                                                  onChange={() => {
                                                    setFormPermissions(prev =>
                                                      prev.includes(action.key)
                                                        ? prev.filter(k => k !== action.key)
                                                        : [...prev, action.key]
                                                    );
                                                  }}
                                                  className={`mt-0.5 h-3.5 w-3.5 rounded border-gray-300 ${
                                                    isInspect ? 'text-amber-600 focus:ring-amber-500' : 'text-indigo-600 focus:ring-indigo-500'
                                                  }`}
                                                />
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-1">
                                                    <span className="text-[11px] font-bold text-slate-900 truncate">
                                                      {action.name}
                                                    </span>
                                                    {isInspect && (
                                                      <span className="text-[8px] font-black uppercase px-1 rounded bg-amber-200 text-amber-900 shrink-0 flex items-center gap-0.5">
                                                        <Lock size={7} /> Supervisory
                                                      </span>
                                                    )}
                                                  </div>
                                                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
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
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                  className="flex-1 py-3 bg-white border border-gray-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-indigo-500/20 transition flex items-center justify-center gap-2"
                >
                  {formSubmitting && <Loader2 size={15} className="animate-spin" />}
                  <span>{editingStaff ? 'Save Changes' : 'Create Staff Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAFE DEACTIVATION / ACTIVATION CONFIRM MODAL */}
      {confirmModal.isOpen && confirmModal.staff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
              confirmModal.action === 'deactivate' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {confirmModal.action === 'deactivate' ? <Power size={22} /> : <CheckCircle2 size={22} />}
            </div>

            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {confirmModal.action === 'deactivate' ? 'Deactivate Staff Member?' : 'Reactivate Staff Member?'}
            </h3>

            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
              {confirmModal.action === 'deactivate' ? (
                <>
                  Are you sure you want to deactivate <strong className="text-slate-800">{confirmModal.staff.name}</strong>?
                  <span className="block mt-1 text-slate-400">
                    Safe deactivation preserves past housekeeping tasks and history, but prevents new task assignments.
                  </span>
                </>
              ) : (
                <>
                  Reactivating <strong className="text-slate-800">{confirmModal.staff.name}</strong> will allow them to be assigned to room cleaning tasks and operations again.
                </>
              )}
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmModal({ isOpen: false, staff: null, action: 'deactivate' })}
                className="flex-1 py-3 bg-white border border-gray-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                className={`flex-1 py-3 text-white rounded-xl text-xs font-bold transition shadow-sm ${
                  confirmModal.action === 'deactivate'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                }`}
              >
                {confirmModal.action === 'deactivate' ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL STAFF PERMISSIONS MODAL */}
      <StaffPermissionsModal
        isOpen={permissionsModal.isOpen}
        staff={permissionsModal.staff}
        onClose={() => setPermissionsModal({ isOpen: false, staff: null })}
        onSuccess={(updatedPermissions) => {
          showNotification('success', `Permissions updated for ${permissionsModal.staff?.name}`);
          // Optimistically update the staff member's permissions in staffList
          if (permissionsModal.staff) {
            const updatedId = permissionsModal.staff.id;
            setStaffList(prev =>
              prev.map(s => (s.id === updatedId ? { ...s, permissions: updatedPermissions } : s))
            );
          }
        }}
      />

      {/* API JSON DEBUGGER MODAL */}
      <ApiJsonDebugger
        apiRequests={apiRequests}
        isOpen={isApiJsonOpen}
        onClose={() => setIsApiJsonOpen(false)}
        onClear={() => setApiRequests([])}
      />
    </div>
  );
}
