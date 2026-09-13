"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { ChevronLeft, Save, ShieldAlert, CheckSquare, Square } from "lucide-react";

type Role = "ADMIN" | "SELLER" | "USER";

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

export default function RolePermissionsPage() {
  const [activeRole, setActiveRole] = useState<Role>("SELLER");
  const [permissions, setPermissions] = useState<Record<Role, string[]>>({
    ADMIN: ["*"],
    SELLER: ["/dashboard", "/dashboard/billing/checkout", "/dashboard/tables", "/dashboard/billing", "/dashboard/expenses", "/dashboard/expenses/reports", "/dashboard/expenses/pnl", "/dashboard/terminal", "/dashboard/kitchen", "/dashboard/menu/view", "/dashboard/menu/upload", "/dashboard/store-item-upload", "/dashboard/menu/edit", "/dashboard/parties", "/dashboard/inventory", "/dashboard/combos", "/dashboard/gallery", "/dashboard/settings", "/dashboard/billing/deleted", "/dashboard/help"],
    USER: ["/dashboard", "/dashboard/billing/checkout", "/dashboard/tables", "/dashboard/terminal", "/dashboard/kitchen", "/dashboard/qr-orders", "/dashboard/help"],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/roles")
      .then((res) => res.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const newPerms = { ...permissions };
        data.forEach(p => {
           if(p.role && p.allowedPaths) newPerms[p.role as Role] = p.allowedPaths;
        });
        setPermissions(newPerms);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        toast.error("Failed to load permissions");
        setLoading(false);
      });
  }, []);

  const togglePath = (path: string) => {
    if (activeRole === "ADMIN") return; // Admin has everything
    setPermissions(prev => {
       const clone = { ...prev };
       const list = clone[activeRole];
       if (list.includes(path)) {
         clone[activeRole] = list.filter(p => p !== path);
       } else {
         clone[activeRole] = [...list, path];
       }
       return clone;
    });
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
       const res = await fetch("/api/admin/roles", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ role: activeRole, allowedPaths: permissions[activeRole] })
       });
       if(res.ok) {
           toast.success(`${activeRole} permissions updated!`);
       } else {
         const d = await res.json();
         toast.error(d.error || "Failed to save");
       }
    } catch(e) {
       toast.error("Network error");
    } finally {
       setSaving(false);
    }
  };

  if (loading) return <div className="p-10 font-bold">Loading...</div>;

  const currentPaths = permissions[activeRole] || [];
  const isAdmin = activeRole === "ADMIN";

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 kravy-page-fade">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/users">
          <button className="p-2.5 rounded-xl bg-[var(--kravy-surface)] border border-[var(--kravy-border)] hover:bg-indigo-50 transition-colors">
            <ChevronLeft size={20} className="text-[var(--kravy-text-muted)]" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[var(--kravy-text-primary)]">
            Manage Role Visibility
          </h1>
          <p className="text-sm text-[var(--kravy-text-muted)] mt-1">
            Choose what sections each role is allowed to see and access.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {/* ROLE SELECTOR */}
        <div className="md:col-span-1 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--kravy-text-muted)] mb-4">Select Role</h3>
          
          {(["SELLER", "USER", "ADMIN"] as Role[]).map(r => (
             <button
                key={r}
                onClick={() => setActiveRole(r)}
                className={`w-full text-left px-5 py-4 rounded-xl border font-bold transition-all ${activeRole === r ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-indigo-300"}`}
             >
                {r}
                {r === "ADMIN" && <span className="block text-[10px] font-medium opacity-70 mt-1">Full System Access</span>}
                {r === "SELLER" && <span className="block text-[10px] font-medium opacity-70 mt-1">Store Managers</span>}
                {r === "USER" && <span className="block text-[10px] font-medium opacity-70 mt-1">Cashiers & Waiters</span>}
             </button>
          ))}

          {isAdmin && (
             <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-800 text-sm">
                <ShieldAlert size={20} className="shrink-0 text-red-500" />
                <p><strong>ADMIN roles</strong> cannot be limited. They will always have complete access to the system.</p>
             </div>
          )}
        </div>

        {/* PERMISSION CHECKLIST */}
        <div className="md:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-gray-800">
                {activeRole} Permissions
              </h2>
              {!isAdmin && (
                 <button 
                   onClick={savePermissions} 
                   disabled={saving}
                   className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-bold transition-all disabled:opacity-50"
                 >
                   <Save size={16} /> {saving ? "Saving..." : "Save Visibility"}
                 </button>
              )}
           </div>

           <div className="grid sm:grid-cols-2 gap-x-8 gap-y-10">
              {Array.from(new Set(ALL_PATHS.map(p => p.group))).map(group => (
                 <div key={group} className="space-y-3">
                   <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest border-b pb-2 mb-3">{group}</h4>
                   {ALL_PATHS.filter(p => p.group === group).map(item => {
                       const checked = isAdmin || currentPaths.includes(item.path);
                       return (
                          <label 
                            key={item.path} 
                            className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${checked ? "bg-indigo-50 border-indigo-200 text-indigo-900" : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"}`}
                          >
                            <div onClick={(e) => { e.preventDefault(); togglePath(item.path); }}>
                              {checked ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-gray-400" />}
                            </div>
                            <span className="text-sm font-semibold flex-1">{item.name}</span>
                          </label>
                       )
                   })}
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
