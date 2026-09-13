"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Copy, 
  Mail, 
  Calendar, 
  Shield, 
  User, 
  Lock, 
  Settings as SettingsIcon,
  ChevronRight,
  Upload,
  Check,
  X,
  Loader2,
  Activity,
  History,
  Key,
  Eye,
  EyeOff,
  Code,
  Monitor,
  Smartphone,
  Globe,
  Plus,
  Trash2,
  ShieldAlert,
  Save,
  Phone,
  UserCheck,
  UserMinus
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Square } from "lucide-react";

type UserData = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  accessType?: string;
  clerkId?: string;
  createdAt: string;
  updatedAt?: string;
  isStaffModel: boolean;
  status?: string;
  business?: {
    businessName: string;
  };
  loginType: "CLERK" | "CUSTOM" | "STAFF";
  sessions?: any[];
  secondaryEmails?: string[];
  secondaryPhones?: string[];
  unsafeMetadata?: any;
  privateMetadata?: any;
  allowedPaths?: string[]; // For User model
  permissions?: string[]; // For Staff model
};

const playSound = (type: 'pop' | 'success' | 'error' | 'warning') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'warning') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.1);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.linearRampToValueAtTime(0.05, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    // Ignore autoplay errors
  }
};

const ALL_PATHS = [
  { group: "Operations", name: "Store Dashboard", path: "/dashboard" },
  { group: "Operations", name: "Quick POS Billing", path: "/dashboard/billing/checkout" },
  { group: "Operations", name: "POS Terminal", path: "/dashboard/terminal" },
  { group: "Operations", name: "Kitchen Workflow", path: "/dashboard/kitchen" },
  { group: "Operations", name: "Table Status", path: "/dashboard/tables" },
  { group: "Operations", name: "Bill History", path: "/dashboard/billing" },
  { group: "Operations", name: "Expense Manager", path: "/dashboard/expenses" },
  
  { group: "Store Catalog", name: "Browse Products", path: "/dashboard/menu/view" },
  { group: "Store Catalog", name: "Interactive Editor", path: "/dashboard/menu-editor" },
  { group: "Store Catalog", name: "Add-on Clusters", path: "/dashboard/menu/addons" },
  { group: "Store Catalog", name: "AI Menu Scraper", path: "/dashboard/ai-scraper" },
  { group: "Store Catalog", name: "Add Single Item", path: "/dashboard/menu/upload" },
  { group: "Store Catalog", name: "Bulk Import", path: "/dashboard/store-item-upload" },
  { group: "Store Catalog", name: "Category Editor", path: "/dashboard/menu/edit" },

  { group: "Resources & Marketing", name: "Parties (Customers)", path: "/dashboard/parties" },
  { group: "Resources & Marketing", name: "Staff Management", path: "/dashboard/staff" },
  { group: "Resources & Marketing", name: "Inventory Stock", path: "/dashboard/inventory" },
  { group: "Resources & Marketing", name: "QR Terminal", path: "/dashboard/qr-orders" },
  { group: "Resources & Marketing", name: "Marketing & Combos", path: "/dashboard/combos" },
  { group: "Resources & Marketing", name: "Gallery", path: "/dashboard/gallery" },

  { group: "Reports & Insights", name: "Daily Sales Report", path: "/dashboard/reports/sales/daily" },
  { group: "Reports & Insights", name: "GST Reports", path: "/dashboard/reports/gst" },
  { group: "Reports & Insights", name: "Expense Reports", path: "/dashboard/expenses/reports" },
  { group: "Reports & Insights", name: "Profit & Loss", path: "/dashboard/expenses/pnl" },

  { group: "Administration", name: "Business Profile", path: "/dashboard/profile" },
  { group: "Administration", name: "POS Settings", path: "/dashboard/settings" },
  { group: "Administration", name: "Tax Settings", path: "/dashboard/settings/tax" },
  { group: "Administration", name: "Role & Access Control", path: "/admin/users" },
  { group: "Administration", name: "Security & Backup", path: "/dashboard/backup" },
  { group: "Administration", name: "Trash & Archive", path: "/dashboard/billing/deleted" },
  { group: "Administration", name: "Help & Support", path: "/dashboard/help" },
];

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [showAddPhone, setShowAddPhone] = useState(false);

  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [globalRoles, setGlobalRoles] = useState<Record<string, string[]>>({});
  const [userPaths, setUserPaths] = useState<string[]>([]);
  const [hasOverrides, setHasOverrides] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void | Promise<void>;
    actionText: string;
    isDestructive: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: () => {},
    actionText: "",
    isDestructive: false
  });

  const confirmAction = (title: string, message: string, actionText: string, isDestructive: boolean, action: () => void | Promise<void>) => {
    playSound(isDestructive ? 'warning' : 'pop');
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      actionText,
      isDestructive,
      action: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        await action();
      }
    });
  };

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  const fetchUser = async () => {
    try {
      const [res, rolesRes] = await Promise.all([
        fetch(`/api/admin/users/${params.id}`),
        fetch('/api/admin/roles')
      ]);

      let rolesData: Record<string, string[]> = {};
      if (rolesRes.ok) {
        const d = await rolesRes.json();
        if (Array.isArray(d)) {
          d.forEach(p => {
             if(p.role && p.allowedPaths) rolesData[p.role] = p.allowedPaths;
          });
          setGlobalRoles(rolesData);
        }
      }

      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setEditData({ name: data.name || "", phone: data.phone || "", password: "" });
        
        // Parse permissions logic
        const currentRole = data.role || data.accessType || "USER";
        
        // ONLY check privateMetadata.allowedPaths for explicit overrides.
        // We ignore data.permissions or data.allowedPaths because Staff model may have a default `[]` array 
        // which incorrectly triggers the override state.
        const customPaths = data.privateMetadata?.allowedPaths;
        
        if (customPaths && Array.isArray(customPaths)) {
           setUserPaths(customPaths);
           setHasOverrides(true);
        } else {
           // Use default role permissions
           setUserPaths(rolesData[currentRole] || []);
           setHasOverrides(false);
        }
      } else {
        const data = await res.json();
        toast.error(data?.error || "User not found");
        router.push("/admin/users");
      }
    } catch (error) {
      toast.error("Error loading user data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: editData.name,
          phone: editData.phone,
          password: editData.password || undefined,
          isStaffModel: user.isStaffModel
        })
      });

      if (res.ok) {
        playSound('success');
        toast.success("Profile updated");
        setIsEditing(false);
        fetchUser();
      } else {
        playSound('error');
        const err = await res.json();
        toast.error(err.error || "Update failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddIdentifier = async (type: 'email' | 'phone') => {
    if (!user) return;
    const value = type === 'email' ? newEmail : newPhone;
    if (!value) return;

    setSaving(true);
    try {
      const field = type === 'email' ? 'secondaryEmails' : 'secondaryPhones';
      const currentList = user[field] || [];
      
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          [field]: [...currentList, value]
        })
      });

      if (res.ok) {
        playSound('success');
        toast.success(`${type === 'email' ? 'Email' : 'Phone'} added`);
        if (type === 'email') { setNewEmail(""); setShowAddEmail(false); }
        else { setNewPhone(""); setShowAddPhone(false); }
        fetchUser();
      } else {
        playSound('error');
        const err = await res.json();
        toast.error(err.error || "Failed to add");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveIdentifier = async (type: 'email' | 'phone', value: string) => {
    if (!user) return;
    
    confirmAction(
      "Remove Identifier",
      `Are you sure you want to remove ${value}? This action cannot be undone.`,
      "Remove",
      true,
      async () => {
        setSaving(true);
        try {
          const field = type === 'email' ? 'secondaryEmails' : 'secondaryPhones';
          const currentList = user[field] || [];
          
          const res = await fetch("/api/admin/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              [field]: currentList.filter(v => v !== value)
            })
          });

          if (res.ok) {
            playSound('success');
            toast.success("Removed successfully");
            fetchUser();
          } else {
            playSound('error');
            const err = await res.json();
            toast.error(err.error || "Failed to remove");
          }
        } catch {
          toast.error("Network error");
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const newStatus = !user.isDisabled;

    confirmAction(
      newStatus ? "Suspend User" : "Activate User",
      `Are you sure you want to ${newStatus ? 'suspend' : 'activate'} this user? ${newStatus ? 'They will no longer be able to log in.' : 'They will regain access to their account.'}`,
      newStatus ? "Suspend" : "Activate",
      newStatus,
      async () => {
        setSaving(true);
        try {
          const res = await fetch("/api/admin/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              isDisabled: newStatus,
              isStaffModel: user.isStaffModel
            })
          });

          if (res.ok) {
            playSound('success');
            toast.success(`User ${newStatus ? 'suspended' : 'activated'}`);
            fetchUser();
          } else {
            playSound('error');
            const err = await res.json();
            toast.error(err.error || "Operation failed");
          }
        } catch {
          toast.error("Network error");
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    playSound('pop');
    toast.success(`${label} copied to clipboard!`, { id: `copy-${text}` });
  };

  const handleRevokeAllSessions = async () => {
    if (!user) return;

    confirmAction(
      "Logout Everywhere",
      "Are you sure you want to log this user out of all devices? They will need to re-authenticate to access the system.",
      "Logout All",
      true,
      async () => {
        setSaving(true);
        try {
          const res = await fetch("/api/admin/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              revokeSessions: true,
              isStaffModel: user.isStaffModel
            })
          });

          if (res.ok) {
            playSound('success');
            toast.success("User logged out everywhere");
            fetchUser();
          } else {
            playSound('error');
            const err = await res.json();
            toast.error(err.error || "Operation failed");
          }
        } catch {
          toast.error("Network error");
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const handleChangeRole = async (newRole: string) => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          role: newRole,
          isStaffModel: user.isStaffModel
        })
      });

      if (res.ok) {
        playSound('success');
        toast.success("Role updated");
        fetchUser();
      } else {
        playSound('error');
        const err = await res.json();
        toast.error(err.error || "Update failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const saveCustomPermissions = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          isStaffModel: user.isStaffModel,
          privateMetadata: {
            ...user.privateMetadata,
            allowedPaths: userPaths
          }
        })
      });

      if (res.ok) {
        playSound('success');
        toast.success("Custom permissions saved!");
        setShowPermissionsModal(false);
        setHasOverrides(true);
        fetchUser();
      } else {
        playSound('error');
        const err = await res.json();
        toast.error(err.error || "Failed to save");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const revertToRoleDefaults = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const newMetadata = { ...user.privateMetadata };
      delete newMetadata.allowedPaths; // Remove the override
      
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          isStaffModel: user.isStaffModel,
          privateMetadata: newMetadata
        })
      });

      if (res.ok) {
        playSound('pop');
        toast.success("Reverted to role defaults!");
        setShowPermissionsModal(false);
        fetchUser();
      } else {
        toast.error("Failed to revert");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePath = (path: string) => {
    setUserPaths(prev => {
       if (prev.includes(path)) {
         return prev.filter(p => p !== path);
       } else {
         return [...prev, path];
       }
    });
  };

  const handleImpersonate = async () => {
    if (!user) return;
    setImpersonating(true);
    try {
      const res = await fetch("/api/admin/users/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, loginType: user.loginType })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Logging in as ${user.name}...`);
        window.location.href = data.redirect;
      } else {
        const err = await res.json();
        toast.error(err.error || "Login failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setImpersonating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center">
       <Loader2 className="text-indigo-500 animate-spin" size={32} />
    </div>
  );

  if (!user) return null;

  // Compute analytics
  const activeHours = new Array(24).fill(0);
  let lastLoginDate: Date | null = null;
  
  if (user.sessions && user.sessions.length > 0) {
    const timestamps = user.sessions.map(s => {
      const d = new Date(s.lastActiveAt);
      if (!isNaN(d.getTime())) {
        activeHours[d.getHours()]++;
        return d.getTime();
      }
      return 0;
    }).filter(t => t > 0);
    
    if (timestamps.length > 0) {
      lastLoginDate = new Date(Math.max(...timestamps));
    }
  }
  const maxHourValue = Math.max(...activeHours, 1);

  return (
    <div className="min-h-screen bg-[#0f0f12] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* HEADER BAR */}
      <header className="border-b border-white/5 bg-[#0f0f12]/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/admin/users")}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-slate-500 hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20">
                  {user.name?.[0] || 'U'}
               </div>
               <div>
                  <h1 className="text-sm font-bold text-white leading-none">{user.name || "Unnamed User"}</h1>
                  <p className="text-[9px] text-slate-500 font-bold mt-0.5 tracking-tight">ID: {user.id}</p>
               </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button 
                onClick={() => setShowJson(true)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 text-slate-300"
             >
                <Code size={12} /> Show JSON
             </button>
             <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 text-white shadow-lg shadow-indigo-500/20">
                Actions <ChevronRight size={12} />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* TABS */}
        <nav className="flex items-center gap-6 border-b border-white/5 mb-6 overflow-x-auto scrollbar-none">
           {["Profile", "Organizations", "Devices", "Settings"].map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`py-3 text-[11px] font-black uppercase tracking-widest relative transition-all whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {tab}
               {activeTab === tab && (
                 <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
               )}
             </button>
           ))}
        </nav>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-8 space-y-10">
            
            {activeTab === "Profile" && (
              <>
                {/* ACTIVITY SECTION */}
                <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-2xl">
               <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       <Activity size={14} className="text-indigo-500" /> User Activity
                    </h2>
                    {lastLoginDate && (
                      <p className="text-[9px] font-bold text-slate-500 mt-1.5 flex items-center gap-1.5">
                        <History size={10} /> Last Login: {lastLoginDate.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Most Active Hours</span>
                  </div>
               </div>
               
               {/* 24-Hour Activity Graph */}
               <div className="flex items-end h-32 gap-1.5 pt-4">
                  {activeHours.map((val, hour) => {
                    const heightPercent = (val / maxHourValue) * 100;
                    return (
                      <div key={hour} className="flex-1 flex flex-col justify-end items-center group relative">
                        {val > 0 && (
                          <div className="absolute -top-6 bg-white text-black text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {val}
                          </div>
                        )}
                        <div 
                          className={`w-full rounded-t-sm transition-all duration-500 ${val > 0 ? 'bg-indigo-500 group-hover:bg-indigo-400 cursor-pointer shadow-[0_0_8px_rgba(99,102,241,0.3)]' : 'bg-white/[0.03]'}`}
                          style={{ height: val > 0 ? `${Math.max(10, heightPercent)}%` : '10%' }}
                        />
                      </div>
                    );
                  })}
               </div>
               <div className="flex justify-between mt-3 text-[8px] font-black text-slate-500 uppercase tracking-widest border-t border-white/5 pt-2">
                 <span>12 AM</span>
                 <span>6 AM</span>
                 <span>12 PM</span>
                 <span>6 PM</span>
                 <span>11 PM</span>
               </div>
            </section>

            {/* PERSONAL INFO SECTION */}
            <section className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
               <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01]">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personal Information</h2>
               </div>
               <div className="p-6 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/20">
                        {user.name?.[0] || 'U'}
                     </div>
                     <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold transition-all text-slate-400 hover:text-white">
                        <Upload size={12} /> Update Avatar
                     </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Full Name</label>
                        <input 
                          type="text"
                          disabled={!isEditing}
                          value={editData.name}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Contact Phone</label>
                        <input 
                          type="tel"
                          disabled={!isEditing}
                          value={editData.phone}
                          onChange={(e) => setEditData({...editData, phone: e.target.value})}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
                        />
                     </div>
                   </div>

                    {/* ROLE MANAGEMENT */}
                    <div className="pt-6 border-t border-white/5 space-y-4">
                       <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Role</h3>
                          {user.isStaffModel && <span className="text-[8px] font-black px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded-md border border-orange-500/20 uppercase">Staff Account</span>}
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {["ADMIN", "SELLER", "CASHIER", "STAFF", "USER"].map((role) => (
                            <button
                              key={role}
                              onClick={() => handleChangeRole(role)}
                              disabled={saving}
                              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                (user.role || user.accessType) === role 
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                                : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10'
                              }`}
                            >
                               {role}
                            </button>
                          ))}
                       </div>
                       
                       <div className="mt-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-slate-300">Role Permissions</p>
                            <p className="text-[9px] text-slate-500 font-bold mt-1 max-w-sm">
                              {hasOverrides 
                                ? "This user has custom permission overrides applied." 
                                : `This user's access is currently managed by their default ${user.role || user.accessType} role.`}
                            </p>
                          </div>
                          <button 
                            onClick={() => setShowPermissionsModal(true)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                              hasOverrides 
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20" 
                              : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            {hasOverrides ? "Edit Overrides" : "Customize"}
                          </button>
                       </div>
                    </div>

                   <div className="pt-2 flex justify-end gap-3">
                     {!isEditing ? (
                       <button 
                         onClick={() => setIsEditing(true)}
                         className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                       >
                         Edit Profile
                       </button>
                     ) : (
                       <>
                         <button 
                           onClick={() => {
                             setIsEditing(false);
                             setEditData({ name: user.name, phone: user.phone || "", password: "" });
                           }}
                           className="px-5 py-2.5 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                         >
                           Cancel
                         </button>
                         <button 
                           onClick={handleUpdate}
                           disabled={saving}
                           className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all flex items-center gap-2"
                         >
                           {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                           Save
                         </button>
                       </>
                     )}
                  </div>
               </div>

               {/* SECONDARY IDENTIFIERS (Clerk Style) */}
               <div className="p-6 border-t border-white/5 bg-black/20 space-y-8">
                  {/* EMAILS */}
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Addresses</h3>
                        <button 
                          onClick={() => setShowAddEmail(true)}
                          className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-[10px] font-bold transition-all"
                        >
                           <Plus size={14} /> Add email
                        </button>
                     </div>
                     <div className="space-y-2">
                        {/* Primary */}
                        <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl group">
                           <div className="flex items-center gap-3">
                              <Mail size={14} className="text-slate-500" />
                              <span className="text-xs font-bold text-white">{user.email}</span>
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-500/20">Primary</span>
                           </div>
                           <button 
                             onClick={() => handleCopy(user.email, 'Email address')}
                             className="p-1.5 text-slate-600 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                             title="Copy email"
                           >
                             <Copy size={12} />
                           </button>
                        </div>
                        {/* Secondaries */}
                        {user.secondaryEmails?.map(email => (
                           <div key={email} className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl group hover:bg-white/[0.02] transition-all">
                              <div className="flex items-center gap-3">
                                 <Mail size={14} className="text-slate-500" />
                                 <span className="text-xs font-bold text-slate-300">{email}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                  onClick={() => handleCopy(email, 'Email address')}
                                  className="p-1.5 text-slate-600 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all"
                                  title="Copy email"
                                >
                                  <Copy size={12} />
                                </button>
                                <button 
                                  onClick={() => handleRemoveIdentifier('email', email)}
                                  className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                  title="Remove email"
                                >
                                   <Trash2 size={12} />
                                </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* PHONES */}
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone Numbers</h3>
                        <button 
                          onClick={() => setShowAddPhone(true)}
                          className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-[10px] font-bold transition-all"
                        >
                           <Plus size={14} /> Add phone
                        </button>
                     </div>
                     <div className="space-y-2">
                        {/* Primary */}
                        {user.phone && (
                           <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl group">
                              <div className="flex items-center gap-3">
                                 <Phone size={14} className="text-slate-500" />
                                 <span className="text-xs font-bold text-white">{user.phone}</span>
                                 <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-500/20">Primary</span>
                              </div>
                              <button 
                                onClick={() => handleCopy(user.phone!, 'Phone number')}
                                className="p-1.5 text-slate-600 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title="Copy phone"
                              >
                                <Copy size={12} />
                              </button>
                           </div>
                        )}
                        {/* Secondaries */}
                        {user.secondaryPhones?.map(phone => (
                           <div key={phone} className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl group hover:bg-white/[0.02] transition-all">
                              <div className="flex items-center gap-3">
                                 <Phone size={14} className="text-slate-500" />
                                 <span className="text-xs font-bold text-slate-300">{phone}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                  onClick={() => handleCopy(phone, 'Phone number')}
                                  className="p-1.5 text-slate-600 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all"
                                  title="Copy phone"
                                >
                                  <Copy size={12} />
                                </button>
                                <button 
                                  onClick={() => handleRemoveIdentifier('phone', phone)}
                                  className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                  title="Remove phone"
                                >
                                   <Trash2 size={12} />
                                </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </section>

            {/* SECURITY SECTION */}
            <section className="bg-[#16161a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                     <Key size={16} /> Password & Security
                  </h2>
               </div>
               <div className="p-8">
                  <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl mb-8 flex gap-4">
                     <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                        <Lock size={20} />
                     </div>
                     <div>
                        <h3 className="text-sm font-bold text-amber-500">Security Notice</h3>
                        <p className="text-xs text-slate-500 mt-1">Changing a user's password will immediately invalidate all their active sessions and they will need to login again.</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">New Password</label>
                        <div className="flex gap-3">
                           <div className="relative flex-1">
                              <input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Set a new secure password"
                                value={editData.password}
                                onChange={(e) => setEditData({...editData, password: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all pr-12"
                              />
                              <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                              >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                           </div>
                           <button 
                             onClick={() => {
                               const newPass = Math.random().toString(36).slice(-10) + "!";
                               setEditData({...editData, password: newPass});
                               setShowPassword(true); // Show it automatically when generated
                             }}
                             className="px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-xs font-bold"
                           >
                             Generate
                           </button>
                        </div>
                     </div>
                     <button 
                       onClick={handleUpdate}
                       disabled={!editData.password || saving}
                       className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-20"
                     >
                       Update Password
                     </button>
                  </div>
               </div>
             </section>
              </>
            )}

            {/* DEVICES / SESSIONS TAB */}
            {activeTab === "Devices" && (
                <section className="space-y-6">
                    <div className="bg-[#16161a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Active Sessions</h2>
                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-full border border-indigo-500/10">
                                {user.sessions?.length || 0} Connected
                            </span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {user.sessions && user.sessions.length > 0 ? (
                                user.sessions.map((session: any) => (
                                    <div key={session.id} className="p-8 flex items-start gap-6 hover:bg-white/[0.01] transition-all">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${session.deviceType === 'mobile' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                            {session.deviceType === 'mobile' ? <Smartphone size={24} /> : <Monitor size={24} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-sm font-bold text-white">
                                                    {session.browserName} on {session.osName} {session.osVersion}
                                                </h3>
                                                {session.status === 'active' && (
                                                    <span className="px-2 py-0.5 bg-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-md">Active</span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[11px] text-slate-500 font-bold">
                                                <div className="flex items-center gap-1.5">
                                                    <Globe size={12} className="text-slate-600" /> {session.ipAddress}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-slate-600" /> Last active {new Date(session.lastActiveAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                            Revoke
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-20 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                                        <Monitor size={32} />
                                    </div>
                                    <h3 className="text-slate-400 font-bold">No active sessions found</h3>
                                    <p className="text-slate-600 text-xs mt-1">This user is not currently logged in on any device.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* PLACEHOLDERS FOR OTHER TABS */}
            {activeTab === "Organizations" && (
                <div className="bg-[#16161a] border border-white/5 rounded-3xl p-20 text-center shadow-2xl">
                    <p className="text-slate-500 font-bold">No linked organizations found for this user.</p>
                </div>
            )}

            {activeTab === "Settings" && (
                <div className="bg-[#16161a] border border-white/5 rounded-3xl p-20 text-center shadow-2xl">
                    <p className="text-slate-500 font-bold">Additional user settings will appear here.</p>
                </div>
            )}

          </div>

          {/* RIGHT SIDEBAR */}
           <div className="lg:col-span-4">
             <div className="sticky top-20 space-y-5">
            
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">User ID</p>
                  <div className="flex items-center justify-between group">
                     <p className="text-[10px] font-mono font-bold text-slate-300 truncate max-w-[150px]">{user.id}</p>
                     <button 
                       onClick={() => {
                         navigator.clipboard.writeText(user.id);
                         toast.success("ID Copied");
                       }}
                       className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-lg transition-all text-slate-500"
                     >
                        <Copy size={10} />
                     </button>
                  </div>
               </div>

               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Primary email</p>
                  <div className="flex items-center justify-between group">
                     <p className="text-[10px] font-bold text-white truncate max-w-[150px]">{user.email}</p>
                     <button 
                       onClick={() => {
                         navigator.clipboard.writeText(user.email);
                         toast.success("Email Copied");
                       }}
                       className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-lg transition-all text-slate-500"
                     >
                        <Copy size={10} />
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Joined</p>
                     <p className="text-[10px] font-bold text-white">{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Updated</p>
                     <p className="text-[10px] font-bold text-slate-400">{Math.floor((new Date().getTime() - new Date(user.updatedAt || user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d ago</p>
                  </div>
               </div>

               <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-[9px] font-black uppercase text-slate-500">Auth</span>
                     <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${user.isStaffModel ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {user.isStaffModel ? 'Custom' : 'Clerk'}
                     </span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[9px] font-black uppercase text-slate-500">Role</span>
                     <span className="text-[9px] font-black text-white">{user.role || user.accessType || "Standard User"}</span>
                  </div>
                  {user.business && (
                    <div className="flex items-center justify-between">
                       <span className="text-[9px] font-black uppercase text-slate-500">Business</span>
                       <span className="text-[9px] font-black text-indigo-400 truncate ml-4 text-right">{user.business.businessName}</span>
                    </div>
                  )}
               </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-3">
               <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Quick Actions</h3>
               <button 
                 onClick={handleImpersonate}
                 disabled={impersonating}
                 className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
               >
                  {impersonating ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
                  Login as User
               </button>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleToggleStatus}
                    disabled={saving}
                    className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                      user.isDisabled 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                    }`}
                  >
                     {user.isDisabled ? 'Activate' : 'Suspend'}
                  </button>
                  <button 
                    onClick={handleRevokeAllSessions}
                    disabled={saving}
                    className="py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-slate-400 border border-white/5 disabled:opacity-50"
                  >
                    Logout Everywhere
                  </button>
                </div>
             </div>
           </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .grid-cols-52 {
          grid-template-columns: repeat(52, minmax(0, 1fr));
        }
      `}</style>

      {/* JSON Inspection Modal */}
      <AnimatePresence>
        {showJson && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#0D1117] border border-white/10 w-full max-w-4xl h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
                >
                    <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div>
                            <h3 className="text-white font-black text-lg tracking-tight">Raw User Data</h3>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-0.5">Admin-only JSON Inspector</p>
                        </div>
                        <button 
                            onClick={() => setShowJson(false)}
                            className="w-10 h-10 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-8 font-mono text-sm leading-relaxed custom-scrollbar">
                        <pre className="text-indigo-300">
                            {JSON.stringify(user, null, 2)}
                        </pre>
                    </div>

                    <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex justify-end">
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(user, null, 2));
                                toast.success("JSON copied to clipboard!");
                            }}
                            className="px-6 py-2 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all"
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Add Email Modal */}
      <AnimatePresence>
        {showAddEmail && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#16161a] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl"
                >
                    <h3 className="text-sm font-bold text-white mb-1">Add new email address</h3>
                    <p className="text-[10px] text-slate-500 mb-6">This email can be used as an additional login identifier.</p>
                    
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Email Address</label>
                            <input 
                                type="email"
                                autoFocus
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="e.g. secondary@kravy.in"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button 
                                onClick={() => { setShowAddEmail(false); setNewEmail(""); }}
                                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleAddIdentifier('email')}
                                disabled={!newEmail || saving}
                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20"
                            >
                                {saving ? <Loader2 size={12} className="animate-spin mx-auto" /> : "Add Email"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Add Phone Modal */}
      <AnimatePresence>
        {showAddPhone && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#16161a] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl"
                >
                    <h3 className="text-sm font-bold text-white mb-1">Add new phone number</h3>
                    <p className="text-[10px] text-slate-500 mb-6">This number can be used as an additional login identifier.</p>
                    
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Phone Number</label>
                            <input 
                                type="tel"
                                autoFocus
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                placeholder="e.g. +91 9876543210"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button 
                                onClick={() => { setShowAddPhone(false); setNewPhone(""); }}
                                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleAddIdentifier('phone')}
                                disabled={!newPhone || saving}
                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20"
                            >
                                {saving ? <Loader2 size={12} className="animate-spin mx-auto" /> : "Add Phone"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmConfig.isOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#16161a] border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative overflow-hidden"
                >
                    {confirmConfig.isDestructive && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-red-600" />
                    )}
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                       {confirmConfig.isDestructive && <ShieldAlert size={16} className="text-rose-500" />}
                       {confirmConfig.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-8 leading-relaxed">
                       {confirmConfig.message}
                    </p>
                    
                    <div className="flex gap-3 mt-4">
                        <button 
                            onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => confirmConfig.action()}
                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                              confirmConfig.isDestructive 
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20' 
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                            }`}
                        >
                            {confirmConfig.actionText}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* CUSTOM PERMISSIONS MODAL */}
      <AnimatePresence>
        {showPermissionsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                <div>
                  <h2 className="text-xl font-black text-white">Custom Permissions: {user.name}</h2>
                  <p className="text-sm text-slate-400 mt-1">Select specific modules this user is allowed to access.</p>
                </div>
                <button onClick={() => setShowPermissionsModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {(user.role || user.accessType) === "ADMIN" && (
                   <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-400 text-sm">
                      <ShieldAlert size={20} className="shrink-0" />
                      <p><strong>ADMIN roles</strong> cannot be limited via routing visibility. They will always have complete access to the system. You can change their role first to apply limitations.</p>
                   </div>
                )}
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                   {Array.from(new Set(ALL_PATHS.map(p => p.group))).map(group => (
                      <div key={group} className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest border-b border-white/10 pb-2 mb-3">{group}</h4>
                        {ALL_PATHS.filter(p => p.group === group).map(item => {
                            const isAdmin = (user.role || user.accessType) === "ADMIN";
                            const checked = isAdmin || userPaths.includes(item.path);
                            return (
                               <label 
                                 key={item.path} 
                                 className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${checked ? "bg-white/5 border-indigo-500/30 text-white" : "bg-transparent border-transparent text-slate-500 hover:bg-white/5"}`}
                               >
                                 <div onClick={(e) => { e.preventDefault(); if(!isAdmin) handleTogglePath(item.path); }}>
                                   {checked ? <CheckSquare size={18} className="text-indigo-500" /> : <Square size={18} className="text-slate-600" />}
                                 </div>
                                 <span className="text-sm font-bold flex-1">{item.name}</span>
                               </label>
                            )
                        })}
                      </div>
                   ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                 <button 
                   onClick={revertToRoleDefaults}
                   disabled={!hasOverrides || saving || (user.role || user.accessType) === "ADMIN"}
                   className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors disabled:opacity-50"
                 >
                   Revert to Default
                 </button>
                 <div className="flex items-center gap-3">
                   <button 
                     onClick={() => setShowPermissionsModal(false)}
                     className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={saveCustomPermissions}
                     disabled={saving || (user.role || user.accessType) === "ADMIN"}
                     className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all disabled:opacity-50"
                   >
                     <Save size={14} /> {saving ? "Saving..." : "Save Overrides"}
                   </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
