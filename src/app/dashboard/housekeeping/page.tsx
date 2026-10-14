"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  RotateCcw,
  Clock,
  Play,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Wrench,
  Loader2,
  X,
  ChevronDown,
  FileText,
  Calendar,
  Building2,
  BedDouble,
  UserX,
  Eye,
  CheckSquare,
  Square,
  Code
} from 'lucide-react';
import dayjs from 'dayjs';
import { ApiJsonDebugger } from '@/components/ui/ApiJsonDebugger';

interface TaskStaff {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  status: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

interface HousekeepingTaskItem {
  id: string;
  roomId: string;
  roomNumber: string;
  floorName: string;
  floorNumber?: number;
  roomTypeName: string;
  roomStatus: string;
  isOccupied: boolean;
  occupantGuestName: string | null;
  staffId: string | null;
  staff: TaskStaff | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  checklist: ChecklistItem[];
  notes: string | null;
  inspectionStatus: 'PENDING' | 'PASSED' | 'RE_CLEAN' | null;
  inspectedBy: string | null;
  inspectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TaskCounts {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  awaitingInspection: number;
  maintenance: number;
}

interface RoomOption {
  id: string;
  roomNumber: string;
  status: string;
  floor?: { name: string; floorNumber: number };
  roomType?: { name: string };
}

interface StaffOption {
  id: string;
  name: string;
  role: string;
  status: string;
}

const PRIORITY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  LOW: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  HIGH: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  URGENT: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
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

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState<HousekeepingTaskItem[]>([]);
  const [counts, setCounts] = useState<TaskCounts>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    awaitingInspection: 0,
    maintenance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');

  // Modal: Create Cleaning Task
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);
  const [housekeepingStaff, setHousekeepingStaff] = useState<StaffOption[]>([]);
  const [loadingCreateDeps, setLoadingCreateDeps] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [taskNotes, setTaskNotes] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal: Checklist & Cleaning Details
  const [selectedTask, setSelectedTask] = useState<HousekeepingTaskItem | null>(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Open Checklist / Task Details Modal
  const openChecklistModal = useCallback((task: HousekeepingTaskItem) => {
    setSelectedTask(task);
    setActionError(null);
    setActionSuccess(null);
    setIsChecklistModalOpen(true);
  }, []);

  // Modal: Assign Staff
  const [assigningTask, setAssigningTask] = useState<HousekeepingTaskItem | null>(null);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Fetch Tasks with filters
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (staffFilter !== 'ALL') params.set('staffId', staffFilter);
      if (floorFilter !== 'ALL') params.set('floorId', floorFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await trackedFetch(`/api/hotel/housekeeping?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}: Failed to fetch housekeeping tasks`);
      }
      const data = await res.json();
      setTasks(data.tasks || []);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err: unknown) {
      console.error('Housekeeping fetch error:', err);
      setApiError(err instanceof Error ? err.message : 'Failed to connect to housekeeping service');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, staffFilter, floorFilter, searchQuery, trackedFetch]);

  const initialRoomIdHandled = React.useRef(false);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
    if (staffFilter !== 'ALL') params.set('staffId', staffFilter);
    if (floorFilter !== 'ALL') params.set('floorId', floorFilter);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    trackedFetch(`/api/hotel/housekeeping?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Error ${res.status}: Failed to fetch housekeeping tasks`);
        }
        return res.json();
      })
      .then((data) => {
        if (active) {
          const fetchedTasks: HousekeepingTaskItem[] = data.tasks || [];
          setTasks(fetchedTasks);
          if (data.counts) {
            setCounts(data.counts);
          }
          setLoading(false);

          // Check if roomId is in query params and auto-open modal for that room's task
          if (!initialRoomIdHandled.current && typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const targetRoomId = urlParams.get('roomId');
            if (targetRoomId) {
              const matchedTask = fetchedTasks.find(t => t.roomId === targetRoomId);
              if (matchedTask) {
                initialRoomIdHandled.current = true;
                openChecklistModal(matchedTask);
              }
            }
          }
        }
      })
      .catch((err: unknown) => {
        if (active) {
          console.error('Housekeeping fetch error:', err);
          setApiError(err instanceof Error ? err.message : 'Failed to connect to housekeeping service');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [statusFilter, priorityFilter, staffFilter, floorFilter, searchQuery, openChecklistModal, trackedFetch]);

  // Load Rooms and Staff for creation
  const openCreateModal = async () => {
    setIsCreateModalOpen(true);
    setCreateError(null);
    setSelectedRoomId('');
    setSelectedStaffId('');
    setTaskPriority('MEDIUM');
    setTaskNotes('');
    setLoadingCreateDeps(true);

    try {
      const [roomsRes, staffRes] = await Promise.all([
        trackedFetch('/api/hotel/rooms'),
        trackedFetch('/api/hotel/staff?role=HOUSEKEEPING&status=active'),
      ]);

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRoomOptions(roomsData || []);
      }
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setHousekeepingStaff(staffData || []);
      }
    } catch (err) {
      console.error('Failed to load room/staff options:', err);
    } finally {
      setLoadingCreateDeps(false);
    }
  };

  // Submit Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      setCreateError('Please select a room.');
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const payload = {
        roomId: selectedRoomId,
        staffId: selectedStaffId || undefined,
        priority: taskPriority,
        notes: taskNotes.trim() || undefined,
      };

      const res = await trackedFetch('/api/hotel/housekeeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      setIsCreateModalOpen(false);
      fetchTasks();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Error creating task');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Assign Modal
  const openAssignModal = async (task: HousekeepingTaskItem) => {
    setAssigningTask(task);
    setAssignStaffId(task.staffId || '');
    setAssignError(null);

    if (housekeepingStaff.length === 0) {
      try {
        const staffRes = await trackedFetch('/api/hotel/staff?role=HOUSEKEEPING&status=active');
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setHousekeepingStaff(staffData || []);
        }
      } catch (err) {
        console.error('Error fetching staff list:', err);
      }
    }
  };

  // Submit Assign / Reassign Staff
  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTask) return;

    setAssignSubmitting(true);
    setAssignError(null);

    try {
      const res = await trackedFetch(`/api/hotel/housekeeping/${assigningTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: assignStaffId || null }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign staff');
      }

      setAssigningTask(null);
      fetchTasks();
    } catch (err: unknown) {
      setAssignError(err instanceof Error ? err.message : 'Assignment error');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Start Cleaning
  const handleStartCleaning = async (task: HousekeepingTaskItem) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await trackedFetch(`/api/hotel/housekeeping/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START_CLEANING' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start cleaning');

      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask(prev => prev ? {
          ...prev,
          status: 'IN_PROGRESS',
          checklist: (data.checklist && Array.isArray(data.checklist) && data.checklist.length > 0)
            ? data.checklist
            : prev.checklist,
        } : null);
      }
      fetchTasks();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to start cleaning');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Checklist Item
  const handleToggleChecklist = async (itemId: string) => {
    if (!selectedTask) return;

    const currentChecklist = Array.isArray(selectedTask.checklist) ? selectedTask.checklist : [];
    const updatedChecklist = currentChecklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    // Optimistic update
    setSelectedTask({ ...selectedTask, checklist: updatedChecklist });

    try {
      const res = await trackedFetch(`/api/hotel/housekeeping/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: updatedChecklist }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save checklist state');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Checklist save error');
      // Revert optimistic update
      fetchTasks();
    }
  };

  // Complete Cleaning (Awaiting Inspection)
  const handleCompleteCleaning = async () => {
    if (!selectedTask) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await trackedFetch(`/api/hotel/housekeeping/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'COMPLETE_CLEANING' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete cleaning');

      setActionSuccess('Cleaning marked as completed. Awaiting supervisor inspection.');
      setSelectedTask(prev => prev ? {
        ...prev,
        status: 'COMPLETED',
        inspectionStatus: 'PENDING'
      } : null);
      fetchTasks();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Completion error');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Inspection (Pass or Re-clean)
  const handleSubmitInspection = async (decision: 'PASSED' | 'RE_CLEAN') => {
    if (!selectedTask) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await trackedFetch(`/api/hotel/housekeeping/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_INSPECTION',
          inspectionStatus: decision,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Inspection submission failed');

      if (decision === 'PASSED') {
        setActionSuccess('Inspection passed successfully! Room availability updated if unoccupied.');
      } else {
        setActionSuccess('Sent back for re-clean. Task is back in progress.');
      }

      setSelectedTask(prev => prev ? {
        ...prev,
        status: decision === 'PASSED' ? 'COMPLETED' : 'IN_PROGRESS',
        inspectionStatus: decision,
      } : null);
      fetchTasks();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Inspection error');
    } finally {
      setActionLoading(false);
    }
  };

  // Distinct Floor Options for Filter
  const floorOptions = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach(t => {
      if (t.floorName) map.set(t.floorName, t.floorName);
    });
    return Array.from(map.values());
  }, [tasks]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles size={22} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Housekeeping</h1>
                <p className="text-xs text-gray-500 font-medium">Manage room cleaning queues, staff assignments, and quality inspections</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsApiJsonOpen(true)}
              className="h-10 px-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
              title="View Housekeeping API JSON and Network Logs"
            >
              <Code size={15} strokeWidth={2.5} />
              <span>API JSON</span>
            </button>
            <button
              onClick={fetchTasks}
              className="h-10 px-3.5 bg-slate-50 border border-gray-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition flex items-center gap-2"
              title="Refresh Task Queue"
            >
              <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={openCreateModal}
              className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* SUMMARY KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Pending */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate">Pending Cleaning</span>
              <span className="text-2xl font-black text-gray-900 mt-1">{counts.pending}</span>
            </div>
          </div>

          {/* Card 2: In Progress */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Play size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate">In Progress</span>
              <span className="text-2xl font-black text-gray-900 mt-1">{counts.inProgress}</span>
            </div>
          </div>

          {/* Card 3: Awaiting Inspection */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate">Awaiting Inspection</span>
              <span className="text-2xl font-black text-gray-900 mt-1">{counts.awaitingInspection}</span>
            </div>
          </div>

          {/* Card 4: Maintenance / Issues */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Wrench size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate">Maintenance Rooms</span>
              <span className="text-2xl font-black text-gray-900 mt-1">{counts.maintenance}</span>
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTERS BAR */}
        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-[320px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by room, staff, or notes..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-gray-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-hide flex-wrap">
            {/* Status Filter */}
            <div className="relative shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none hover:border-gray-300 focus:border-indigo-500 appearance-none transition-colors"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending Only</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Priority Filter */}
            <div className="relative shrink-0">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none hover:border-gray-300 focus:border-indigo-500 appearance-none transition-colors"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Staff Filter */}
            <div className="relative shrink-0">
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none hover:border-gray-300 focus:border-indigo-500 appearance-none transition-colors"
              >
                <option value="ALL">All Staff</option>
                <option value="UNASSIGNED">Unassigned</option>
                {housekeepingStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Floor Filter */}
            {floorOptions.length > 0 && (
              <div className="relative shrink-0">
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none hover:border-gray-300 focus:border-indigo-500 appearance-none transition-colors"
                >
                  <option value="ALL">All Floors</option>
                  {floorOptions.map(floorName => (
                    <option key={floorName} value={floorName}>{floorName}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            )}

            {/* Reset Filters */}
            {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || staffFilter !== 'ALL' || floorFilter !== 'ALL' || searchQuery !== '') && (
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setStaffFilter('ALL');
                  setFloorFilter('ALL');
                  setSearchQuery('');
                }}
                className="h-10 px-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* TASK QUEUE TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={32} className="animate-spin text-amber-500 mb-3" />
              <span className="text-sm font-bold">Loading housekeeping queue...</span>
            </div>
          ) : apiError ? (
            <div className="p-12 text-center">
              <AlertTriangle size={36} className="text-rose-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Failed to load housekeeping tasks</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">{apiError}</p>
              <button
                onClick={fetchTasks}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900">No housekeeping tasks found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                {statusFilter !== 'ALL' || searchQuery
                  ? 'No tasks matched your current filter criteria.'
                  : 'All rooms are cleaned or no active tasks have been created yet.'}
              </p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> Create New Task
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-5 py-4">Room & Floor</th>
                    <th className="px-5 py-4">Occupancy State</th>
                    <th className="px-5 py-4">Task Status</th>
                    <th className="px-5 py-4">Priority</th>
                    <th className="px-5 py-4">Assigned Staff</th>
                    <th className="px-5 py-4">Checklist Progress</th>
                    <th className="px-5 py-4">Updated</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.map((task) => {
                    const taskChecklist = Array.isArray(task.checklist) ? task.checklist : [];
                    const completedItems = taskChecklist.filter(c => c.completed).length;
                    const totalItems = taskChecklist.length;
                    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                    const priorityBadge = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.MEDIUM;

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Room & Floor */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-sm shrink-0">
                              {task.roomNumber}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                Room {task.roomNumber}
                                <span className="text-[10px] font-normal text-slate-400">({task.roomTypeName})</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">{task.floorName}</div>
                            </div>
                          </div>
                        </td>

                        {/* Occupancy State */}
                        <td className="px-5 py-4">
                          {task.isOccupied ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              Occupied ({task.occupantGuestName || 'Guest'})
                            </span>
                          ) : task.roomStatus === 'MAINTENANCE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Wrench size={10} /> Maintenance
                            </span>
                          ) : task.roomStatus === 'BLOCKED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Vacant
                            </span>
                          )}
                        </td>

                        {/* Task Status */}
                        <td className="px-5 py-4">
                          {task.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={11} /> Pending
                            </span>
                          ) : task.status === 'IN_PROGRESS' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Play size={11} /> In Progress
                            </span>
                          ) : task.inspectionStatus === 'PASSED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck size={11} /> Inspected (Passed)
                            </span>
                          ) : task.inspectionStatus === 'RE_CLEAN' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle size={11} /> Re-clean Needed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <ShieldCheck size={11} /> Awaiting Inspection
                            </span>
                          )}
                        </td>

                        {/* Priority */}
                        <td className="px-5 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${priorityBadge.bg} ${priorityBadge.text} ${priorityBadge.border}`}>
                            {task.priority}
                          </span>
                        </td>

                        {/* Assigned Staff */}
                        <td className="px-5 py-4">
                          {task.staff ? (
                            <button
                              onClick={() => openAssignModal(task)}
                              className="group flex items-center gap-1.5 text-left font-bold text-slate-800 hover:text-indigo-600 transition"
                            >
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] shrink-0">
                                {task.staff.name.charAt(0)}
                              </div>
                              <span className="truncate max-w-[120px]">{task.staff.name}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openAssignModal(task)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-800 transition bg-amber-50 px-2 py-1 rounded-lg border border-amber-200"
                            >
                              <UserCheck size={11} /> Assign Staff
                            </button>
                          )}
                        </td>

                        {/* Checklist Progress */}
                        <td className="px-5 py-4">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>{completedItems}/{totalItems} items</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Updated Timestamp */}
                        <td className="px-5 py-4 text-slate-400 font-medium text-[11px]">
                          {dayjs(task.updatedAt).format('DD MMM, hh:mm A')}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {task.status === 'PENDING' && (
                              <button
                                onClick={() => handleStartCleaning(task)}
                                className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1"
                                title="Start Cleaning"
                              >
                                <Play size={11} /> Start
                              </button>
                            )}

                            <button
                              onClick={() => openChecklistModal(task)}
                              className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1"
                              title="View Cleaning Checklist & Details"
                            >
                              <Eye size={11} /> Details
                            </button>
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

      {/* MODAL 1: CREATE CLEANING TASK */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create Cleaning Task</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Add a room to the cleaning queue</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {loadingCreateDeps ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 size={24} className="animate-spin text-amber-500 mx-auto mb-2" />
                  <span className="text-xs font-bold">Loading rooms & staff...</span>
                </div>
              ) : (
                <>
                  {/* Room Select */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Select Room <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
                      required
                    >
                      <option value="">-- Choose Room --</option>
                      {roomOptions.map((r) => (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNumber} ({r.floor?.name || 'Floor'}, Status: {r.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Select */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Task Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium (Normal)</option>
                      <option value="HIGH">High (Priority Arrival)</option>
                      <option value="URGENT">Urgent (Immediate)</option>
                    </select>
                  </div>

                  {/* Staff Select */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Assign Housekeeping Staff (Optional)
                    </label>
                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
                    >
                      <option value="">-- Leave Unassigned --</option>
                      {housekeepingStaff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Active)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cleaning Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Notes / Special Instructions
                    </label>
                    <textarea
                      value={taskNotes}
                      onChange={(e) => setTaskNotes(e.target.value)}
                      placeholder="e.g. Extra pillows requested, deep sanitize bathroom..."
                      rows={3}
                      className="w-full p-3 rounded-xl border border-gray-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createSubmitting}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {createSubmitting ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <span>Create Task</span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHECKLIST, DETAILS & INSPECTION */}
      {isChecklistModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm">
                  {selectedTask.roomNumber}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Room {selectedTask.roomNumber} Checklist
                    <span className="text-[11px] font-normal text-slate-400">({selectedTask.floorName})</span>
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <span>Status: <strong className="text-slate-800">{selectedTask.status}</strong></span>
                    <span>•</span>
                    <span>Staff: <strong className="text-slate-800">{selectedTask.staff?.name || 'Unassigned'}</strong></span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChecklistModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="p-5 overflow-y-auto space-y-5">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}
              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Notes Display */}
              {selectedTask.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Special Instructions
                  </span>
                  <p className="text-xs text-slate-700 font-medium">{selectedTask.notes}</p>
                </div>
              )}

              {/* Checklist Items */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Room Cleaning Checklist
                </span>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {(Array.isArray(selectedTask.checklist) ? selectedTask.checklist : []).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={selectedTask.status === 'COMPLETED' && selectedTask.inspectionStatus === 'PASSED'}
                      onClick={() => handleToggleChecklist(item.id)}
                      className="w-full p-3 flex items-center gap-3 text-left hover:bg-slate-50 transition cursor-pointer disabled:cursor-default"
                    >
                      {item.completed ? (
                        <CheckSquare size={18} className="text-emerald-600 shrink-0" />
                      ) : (
                        <Square size={18} className="text-slate-400 shrink-0" />
                      )}
                      <span className={`text-xs font-medium ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspection Status Banner */}
              {selectedTask.status === 'COMPLETED' && (
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-purple-800 font-bold text-xs">
                    <ShieldCheck size={16} />
                    <span>Supervisor Quality Inspection</span>
                  </div>
                  <p className="text-[11px] text-purple-700">
                    Cleaning has been marked completed by housekeeping staff. Supervisors can inspect the room and approve availability or request a re-clean.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleSubmitInspection('PASSED')}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} />
                      <span>Pass Inspection</span>
                    </button>
                    <button
                      onClick={() => handleSubmitInspection('RE_CLEAN')}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      <RotateCcw size={13} />
                      <span>Request Re-clean</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-slate-50">
              <span className="text-[11px] text-slate-500 font-medium">
                {(Array.isArray(selectedTask.checklist) ? selectedTask.checklist : []).filter(c => c.completed).length} of {(Array.isArray(selectedTask.checklist) ? selectedTask.checklist : []).length} items checked
              </span>

              <div className="flex items-center gap-2">
                {selectedTask.status === 'PENDING' && (
                  <button
                    onClick={() => handleStartCleaning(selectedTask)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Play size={13} />
                    <span>Start Cleaning</span>
                  </button>
                )}

                {selectedTask.status === 'IN_PROGRESS' && (
                  <button
                    onClick={handleCompleteCleaning}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} />
                    <span>Complete Cleaning</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsChecklistModalOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSIGN STAFF */}
      {assigningTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Assign Housekeeper</h3>
                <p className="text-[11px] text-slate-400 font-medium">Room {assigningTask.roomNumber} ({assigningTask.floorName})</p>
              </div>
              <button
                onClick={() => setAssigningTask(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAssignStaff} className="p-5 space-y-4">
              {assignError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{assignError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Active Housekeeping Staff
                </label>
                <select
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
                >
                  <option value="">-- Unassigned --</option>
                  {housekeepingStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningTask(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {assignSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Assignment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
