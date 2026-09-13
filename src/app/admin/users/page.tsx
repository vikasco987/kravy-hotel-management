"use client";

import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserPlus, Shield, ShieldAlert, Mail, Search, Filter, 
  MoreVertical, CheckCircle2, XCircle, Lock, Unlock, ArrowRight,
  ShieldCheck, ArrowLeft, RefreshCw, Eye, Loader2, Trash2
} from "lucide-react";

type Role = "USER" | "SELLER" | "ADMIN" | "STAFF";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isDisabled: boolean;
  clerkId: string;
  createdAt: string;
  isStaffModel?: boolean;
  loginType: "CLERK" | "CUSTOM" | "STAFF";
};

const roleStyles: Record<Role, { bg: string; text: string; icon: any }> = {
  ADMIN: { bg: "bg-rose-50", text: "text-rose-600", icon: <ShieldAlert size={14} /> },
  SELLER: { bg: "bg-indigo-50", text: "text-indigo-600", icon: <ShieldCheck size={14} /> },
  USER: { bg: "bg-slate-50", text: "text-slate-600", icon: <Users size={14} /> },
  STAFF: { bg: "bg-amber-50", text: "text-amber-600", icon: <ShieldCheck size={14} /> },
};

import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ConfirmContext";

export default function AdminUsersPage() {
    const { confirm } = useConfirm();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [loginTypeFilter, setLoginTypeFilter] = useState<"ALL" | "CLERK" | "CUSTOM">("ALL");
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Invite/Add state
  const [activeTab, setActiveTab] = useState<"invite" | "add">("add");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("USER");
  const [inviting, setInviting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then(async (res) => {
        if (!res.ok) throw new Error("Forbidden");
        return res.json();
      })
      .then(setUsers)
      .catch(() => toast.error("Access denied"))
      .finally(() => setLoading(false));
  };

  const inviteUser = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: newRole }),
      });
      if (res.ok) {
        toast.success("Invitation sent successfully");
        setEmail("");
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data?.error || "Invite failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setInviting(false);
    }
  };

  const directAddUser = async () => {
    if (!email || !name || !password) {
      toast.error("Name, Email and Password are required");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: newRole }),
      });
      if (res.ok) {
        toast.success("User added successfully");
        setName("");
        setEmail("");
        setPassword("");
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data?.error || "Creation failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setAdding(false);
    }
  };
  const saveUserEdits = async () => {
    if (!selectedUser) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: selectedUser.id, 
          name: editName, 
          password: editPassword || undefined,
          isStaffModel: selectedUser.isStaffModel
        }),
      });
      if (res.ok) {
        toast.success("User updated successfully");
        fetchUsers();
        setSelectedUser(null);
        setIsEditing(false);
        setEditPassword("");
      } else {
        const data = await res.json();
        toast.error(data?.error || "Update failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingEdit(false);
    }
  };

  const changeRole = async (userId: string, role: Role) => {
    setActionUserId(userId);
    try {
      const target = users.find(u => u.id === userId);
      const res = await fetch("/api/admin/users/role", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          targetUserId: userId, 
          role, 
          isStaffModel: target?.isStaffModel 
        }),
      });
      if (res.ok) {
        toast.success("User role updated");
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      } else {
        toast.error("Failed to update role");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionUserId(null);
    }
  };

  const toggleUserStatus = async (user: User) => {
    setActionUserId(user.id);
    try {
      const res = await fetch("/api/admin/users/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: user.id,
          disable: !user.isDisabled,
          isStaffModel: user.isStaffModel
        }),
      });
      if (res.ok) {
        toast.success(user.isDisabled ? "User access restored" : "User access revoked");
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isDisabled: !u.isDisabled } : u));
      } else {
        toast.error("Status update failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionUserId(null);
    }
  };

  const deleteUser = async (user: User) => {
    if (!await confirm(`Are you sure you want to permanently delete user "${user.name || user.email}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/users?userId=${user.id}&isStaffModel=${Boolean(user.isStaffModel)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("User deleted successfully");
        setUsers(prev => prev.filter(u => u.id !== user.id));
        if (selectedUser?.id === user.id) setSelectedUser(null);
      } else {
        const data = await res.json();
        toast.error(data?.error || "Failed to delete user");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesLoginType = loginTypeFilter === "ALL" || 
                              (loginTypeFilter === "CUSTOM" && u.loginType === "CUSTOM") ||
                              (loginTypeFilter === "CLERK" && u.loginType === "CLERK") ||
                              (loginTypeFilter === "CUSTOM" && u.loginType === "STAFF"); // Staff is also custom-ish
      return matchesSearch && matchesRole && matchesLoginType;
    });
  }, [users, searchQuery, roleFilter, loginTypeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-indigo-600" size={32} />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600">
               <Shield size={20} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Administrative Control</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Access Management</h1>
            <p className="text-slate-500 max-w-lg font-medium">Configure team roles, permissions, and system-wide visibility controls for your staff.</p>
          </div>

          <div className="flex flex-wrap gap-3">
             <Link href="/dashboard" className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-sm shadow-sm">
                <ArrowLeft size={16} /> Exit to Dashboard
             </Link>
             <Link href="/admin/users/roles" className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-black text-sm shadow-lg shadow-indigo-600/20">
                <Lock size={16} /> Visibility Rules
             </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: INVITE & STATS */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* TOGGLE & FORM BOX */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-0 opacity-50" />
               
               <div className="relative z-10 space-y-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                       {activeTab === "invite" ? <UserPlus size={24} /> : <Users size={24} />}
                     </div>
                     <div>
                       <h2 className="text-xl font-black text-slate-900 leading-none">
                         {activeTab === "invite" ? "Invite User" : "Add Direct User"}
                       </h2>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                         {activeTab === "invite" ? "Invite via email link" : "Create account manually"}
                       </p>
                     </div>
                   </div>
                 </div>

                 {/* TAB SWITCHER */}
                 <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button 
                      onClick={() => setActiveTab("invite")}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "invite" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Invite
                    </button>
                    <button 
                      onClick={() => setActiveTab("add")}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "add" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Direct Add
                    </button>
                 </div>

                 <div className="space-y-4 pt-2">
                    {activeTab === "add" && (
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. John Doe"
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-medium transition-all text-slate-900 shadow-sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                       </div>
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="email" 
                            placeholder="staff@kravy.pos"
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-medium transition-all text-slate-900 shadow-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                       </div>
                    </div>

                    {activeTab === "add" && (
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                          <div className="relative">
                              <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Set secure password"
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-medium transition-all text-slate-900 shadow-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                              />
                              <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                              >
                                {showPassword ? <XCircle size={18} /> : <Eye size={18} />}
                              </button>
                           </div>
                       </div>
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Role</label>
                       <select 
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-black text-sm transition-all"
                         value={newRole}
                         onChange={(e) => setNewRole(e.target.value as Role)}
                       >
                         <option value="USER">Standard User</option>
                         <option value="SELLER">Outlet Seller</option>
                         <option value="ADMIN">Super Admin</option>
                       </select>
                    </div>

                    <button 
                      onClick={activeTab === "invite" ? inviteUser : directAddUser}
                      disabled={inviting || adding}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
                    >
                      {inviting || adding ? <RefreshCw className="animate-spin" size={18} /> : (
                        activeTab === "invite" ? <>Send Invitation <ArrowRight size={18} /></> : <>Create Account <Lock size={18} /></>
                      )}
                    </button>
                 </div>
               </div>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm text-center">
                  <p className="text-3xl font-black text-slate-900 leading-none mb-1">{users.length}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Staff</p>
               </div>
               <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm text-center">
                  <p className="text-3xl font-black text-rose-600 leading-none mb-1">{users.filter(u => u.isDisabled).length}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disabled</p>
               </div>
            </div>

          </div>

          {/* RIGHT: TABLE & FILTERS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* SEARCH & FILTER BAR */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by name or email..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-slate-200 font-medium transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-2xl border border-slate-100">
                     <Lock size={14} className="text-slate-400" />
                     <select 
                       className="bg-transparent border-none outline-none font-black text-[11px] uppercase tracking-widest text-slate-600 py-2 pr-4"
                       value={loginTypeFilter}
                       onChange={(e) => setLoginTypeFilter(e.target.value as any)}
                     >
                        <option value="ALL">All Logins</option>
                        <option value="CLERK">Clerk (External)</option>
                        <option value="CUSTOM">Custom (Local)</option>
                     </select>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-2xl border border-slate-100">
                     <Filter size={14} className="text-slate-400" />
                     <select 
                       className="bg-transparent border-none outline-none font-black text-[11px] uppercase tracking-widest text-slate-600 py-2 pr-4"
                       value={roleFilter}
                       onChange={(e) => setRoleFilter(e.target.value as any)}
                     >
                        <option value="ALL">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SELLER">Seller</option>
                        <option value="USER">User</option>
                     </select>
                  </div>
               </div>
            </div>

            {/* USERS TABLE */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                           <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                           <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Role</th>
                           <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrative Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {filteredUsers.map((u) => (
                           <motion.tr 
                             key={u.id}
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                             onClick={() => {
                               setNavigatingId(u.id);
                               router.push(`/admin/users/${u.id}`);
                             }}
                           >
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${roleStyles[u.role].bg} ${roleStyles[u.role].text}`}>
                                       {navigatingId === u.id ? (
                                          <Loader2 size={20} className="animate-spin text-indigo-500" />
                                       ) : (
                                          u.name?.[0] || 'U'
                                       )}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors block text-sm">
                                           {u.name || "Pending Account"}
                                        </div>
                                       <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                                          {u.email}
                                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                                            u.loginType === 'STAFF' ? 'bg-amber-100 text-amber-600' : 
                                            u.loginType === 'CUSTOM' ? 'bg-orange-100 text-orange-600' : 
                                            'bg-blue-100 text-blue-600'
                                          }`}>
                                             {u.loginType}
                                          </span>
                                       </div>
                                    </div>
                                 </div>
                              </td>

                              <td className="px-8 py-6 text-center">
                                 <div className="flex flex-col items-center gap-2">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${roleStyles[u.role].bg} ${roleStyles[u.role].text} text-[10px] font-black uppercase tracking-widest`}>
                                       {roleStyles[u.role].icon}
                                       {u.role}
                                    </div>
                                    <div className="flex items-center gap-1">
                                       <div className={`w-1.5 h-1.5 rounded-full ${u.isDisabled ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                       <span className={`text-[9px] font-black uppercase tracking-tighter ${u.isDisabled ? 'text-rose-600' : 'text-emerald-600'}`}>
                                          {u.isDisabled ? "Access Revoked" : "Live Session"}
                                       </span>
                                    </div>
                                 </div>
                              </td>

                              <td className="px-8 py-6">
                                 <div className="flex items-center justify-end gap-3">
                                    <select 
                                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
                                      value={u.role}
                                      disabled={u.isDisabled || actionUserId === u.id}
                                      onChange={(e) => changeRole(u.id, e.target.value as Role)}
                                    >
                                       <option value="USER">User</option>
                                       <option value="SELLER">Seller</option>
                                       <option value="ADMIN">Admin</option>
                                    </select>

                                    <div className="w-[1px] h-6 bg-slate-100" />

                                     <button 
                                       disabled={actionUserId === u.id || deletingId === u.id}
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         toggleUserStatus(u);
                                       }}
                                       className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${u.isDisabled ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'} shadow-sm active:scale-90`}
                                       title={u.isDisabled ? "Grant Access" : "Revoke Access"}
                                     >
                                        {actionUserId === u.id ? <RefreshCw className="animate-spin" size={16} /> : (
                                           u.isDisabled ? <Unlock size={18} /> : <Lock size={18} />
                                        )}
                                     </button>

                                     <button 
                                       disabled={deletingId === u.id || actionUserId === u.id}
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         deleteUser(u);
                                       }}
                                       className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                                       title="Delete User Permanently"
                                     >
                                        {deletingId === u.id ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={18} />}
                                     </button>

                                    <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all">
                                       <MoreVertical size={18} />
                                    </button>
                                 </div>
                              </td>
                           </motion.tr>
                        ))}
                     </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                     <div className="p-12 text-center space-y-2">
                        <Users className="mx-auto text-slate-200" size={48} />
                        <p className="text-slate-400 font-bold">No matching users found in your scope.</p>
                     </div>
                  )}
               </div>
            </div>

          </div>
        </div>

      </div>

      {/* USER DETAIL MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-slate-100"
            >
               <div className={`h-32 bg-gradient-to-br ${uRoleGradient[selectedUser.role]} p-8 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl" />
                  <div className="relative flex justify-between items-start">
                     <div>
                        <h3 className="text-white text-2xl font-black">{selectedUser.name || "New Staff"}</h3>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">{selectedUser.role}</p>
                     </div>
                     <button onClick={() => setSelectedUser(null)} className="w-8 h-8 bg-black/20 text-white rounded-full flex items-center justify-center hover:bg-black/40 transition-all">
                        <XCircle size={20} />
                     </button>
                  </div>
               </div>

               <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform ID</p>
                        <p className="font-mono text-[10px] font-bold text-slate-800 bg-slate-50 p-2 rounded-lg truncate">{selectedUser.id}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Onboarded</p>
                        <p className="text-xs font-bold text-slate-800">{new Date(selectedUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                     </div>
                  </div>

                   {!isEditing ? (
                     <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                           <Mail className="text-indigo-600" size={20} />
                           <div className="flex-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Email</p>
                              <p className="text-sm font-bold text-slate-900">{selectedUser.email}</p>
                           </div>
                           <button 
                             onClick={() => {
                               navigator.clipboard.writeText(selectedUser.email);
                               toast.success("Email copied");
                             }}
                             className="text-[10px] font-black text-indigo-600 uppercase"
                           >
                              Copy
                           </button>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                           <Lock className="text-slate-400" size={20} />
                           <div className="flex-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authentication ID</p>
                              <p className="text-[10px] font-bold text-slate-800 truncate max-w-[180px]">{selectedUser.clerkId}</p>
                           </div>
                           <button 
                             onClick={() => {
                               navigator.clipboard.writeText(selectedUser.clerkId);
                               toast.success("ID copied");
                             }}
                             className="text-[10px] font-black text-indigo-600 uppercase"
                           >
                              Copy
                           </button>
                        </div>

                         <div className="pt-4 flex gap-2">
                            <button 
                              onClick={() => toggleUserStatus(selectedUser)}
                              className={`flex-1 py-3 rounded-2xl font-black uppercase text-[10px] tracking-wider transition-all ${selectedUser.isDisabled ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100'}`}
                            >
                               {selectedUser.isDisabled ? "Resume" : "Revoke"}
                            </button>
                            <button 
                              onClick={() => setIsEditing(true)}
                              className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-wider shadow-lg hover:bg-black transition-all"
                            >
                               Edit Profile
                            </button>
                            <button 
                              onClick={() => deleteUser(selectedUser)}
                              disabled={deletingId === selectedUser.id}
                              className="py-3 px-4 rounded-2xl bg-rose-600 text-white font-black uppercase text-[10px] tracking-wider shadow-lg hover:bg-rose-700 transition-all flex items-center justify-center gap-1.5"
                              title="Delete Account Permanently"
                            >
                               {deletingId === selectedUser.id ? <RefreshCw className="animate-spin" size={14} /> : <Trash2 size={14} />}
                               Delete
                            </button>
                         </div>
                     </div>
                   ) : (
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                           <input 
                             type="text" 
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-medium transition-all"
                             value={editName}
                             onChange={(e) => setEditName(e.target.value)}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password (Optional)</label>
                           <input 
                             type="text" 
                             placeholder="Leave empty to keep current"
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-medium transition-all"
                             value={editPassword}
                             onChange={(e) => setEditPassword(e.target.value)}
                           />
                        </div>
                        <div className="pt-4 flex gap-3">
                           <button 
                             onClick={() => setIsEditing(false)}
                             className="flex-1 py-3 rounded-2xl font-black uppercase text-xs tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                           >
                              Cancel
                           </button>
                           <button 
                             onClick={saveUserEdits}
                             disabled={savingEdit}
                             className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                           >
                              {savingEdit ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                              Save Changes
                           </button>
                        </div>
                     </div>
                   )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </>
  );
}

const uRoleGradient: Record<Role, string> = {
  ADMIN: "from-rose-600 to-rose-400",
  SELLER: "from-indigo-600 to-indigo-400",
  USER: "from-slate-600 to-slate-400",
};
