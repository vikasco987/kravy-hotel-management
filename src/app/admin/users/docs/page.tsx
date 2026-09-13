import React from "react";
import Link from "next/link";
import { ChevronLeft, Shield, CheckCircle2, XCircle, Info, Lock, Key, Users, BookOpen } from "lucide-react";

export default function AccessControlDocsPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-6 kravy-page-fade">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/users">
          <button className="p-2.5 rounded-xl bg-[var(--kravy-surface)] border border-[var(--kravy-border)] hover:bg-indigo-50 transition-colors">
            <ChevronLeft size={20} className="text-[var(--kravy-text-muted)]" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[var(--kravy-text-primary)] tracking-tight flex items-center gap-2">
            <BookOpen className="text-indigo-500" /> Complete Guide to Access Control & Roles
          </h1>
          <p className="text-sm text-[var(--kravy-text-muted)] mt-1">
            Understand how role-based permissions work to keep your business secure.
          </p>
        </div>
      </div>

      {/* OVERVIEW */}
      <section className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] p-6 rounded-2xl shadow-sm mb-8">
        <h2 className="text-lg font-bold text-[var(--kravy-text-primary)] flex items-center gap-2 mb-4">
          <Shield size={20} className="text-indigo-500" /> Security Overview
        </h2>
        <p className="text-sm text-[var(--kravy-text-muted)] leading-relaxed mb-4">
          The <strong className="text-indigo-600">Access Control</strong> panel helps you as a business owner control who is allowed to do what inside your POS system. 
          By inviting your staff and assigning them correct roles, you can prevent accidental mistakes (like deleting products, changing tax rates, or viewing sensitive business revenue).
        </p>
        <div className="flex bg-indigo-50 border border-indigo-100 rounded-xl p-4 gap-3">
          <Info size={20} className="text-indigo-500 shrink-0" />
          <p className="text-xs text-indigo-800 font-semibold mt-0.5">
            <strong>Pro Tip:</strong> Only give "ADMIN" role to business owners or general managers. Cashiers or kitchen staff should only have the "USER" role. 
          </p>
        </div>
      </section>

      {/* ROLES COMPARISON */}
      <h2 className="text-xl font-black text-[var(--kravy-text-primary)] mb-4 flex items-center gap-2">
        <Key size={20} className="text-green-500" /> Role Permissions
      </h2>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        
        {/* ADMIN */}
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl relative">
          <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-2xl">
            Highest Access
          </div>
          <h3 className="text-lg font-black text-red-700 mb-2">System Admin</h3>
          <p className="text-xs text-red-600/80 font-bold mb-4">Business Owners / Managers</p>
          
          <ul className="space-y-3 text-sm text-gray-800 font-medium">
            <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-red-500 shrink-0" /> Full access to everything.</li>
            <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-red-500 shrink-0" /> Change GST & Taxes</li>
            <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-red-500 shrink-0" /> View Analytics & Past Bills</li>
            <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-red-500 shrink-0" /> Invite or Disable staff accounts</li>
            <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-red-500 shrink-0" /> Manage Security Backups</li>
          </ul>
        </div>

        {/* SELLER */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
          <h3 className="text-lg font-black text-blue-700 mb-2">Store Manager</h3>
          <p className="text-xs text-blue-600/80 font-bold mb-4">Shift Leaders / Supervisors</p>
          
          <ul className="space-y-3 text-sm text-gray-800 font-medium">
            <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-blue-500 shrink-0" /> Process Bills & Checkout</li>
            <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-blue-500 shrink-0" /> Edit Store Item pricing</li>
            <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-blue-500 shrink-0" /> Manage Inventory Stock</li>
            <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-blue-500 shrink-0" /> Manage Tables & Floor</li>
            <li className="flex gap-2 items-start"><XCircle size={16} className="text-gray-400 shrink-0" /> Cannot manage staff or change tax</li>
          </ul>
        </div>

        {/* USER */}
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
          <h3 className="text-lg font-black text-gray-700 mb-2">Basic Staff</h3>
          <p className="text-xs text-gray-500 font-bold mb-4">Waiters / Kitchen / Cashiers</p>
          
          <ul className="space-y-3 text-sm text-gray-600 font-medium">
            <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-green-500 shrink-0" /> Place Orders & Generate Bills</li>
            <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-green-500 shrink-0" /> View active tables</li>
            <li className="flex gap-2 items-start"><CheckCircle2 size={16} className="text-green-500 shrink-0" /> Accept QR Orders</li>
            <li className="flex gap-2 items-start"><XCircle size={16} className="text-red-400 shrink-0" /> Cannot edit menu products</li>
            <li className="flex gap-2 items-start"><XCircle size={16} className="text-red-400 shrink-0" /> Cannot view total past revenue</li>
            <li className="flex gap-2 items-start"><XCircle size={16} className="text-red-400 shrink-0" /> Cannot access settings</li>
          </ul>
        </div>
      </div>

      {/* HOW IT EFFECTS SIDEBAR */}
      <h2 className="text-xl font-black text-[var(--kravy-text-primary)] mb-4 flex items-center gap-2">
        <Lock size={20} className="text-orange-500" /> How It Works in KravyPOS
      </h2>
      <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl overflow-hidden shadow-sm">
         <div className="p-6">
           <p className="text-sm text-[var(--kravy-text-muted)] leading-relaxed">
             Immediately upon changing someone's role, the POS system automatically restructures their menu layout. Sections like <strong>"Tax Management"</strong>, <strong>"Business Profile"</strong>, and <strong>"Access Control"</strong> will simply vanish from the sidebar if they do not have the clearance (e.g. they are downgraded to SELLER or USER).
           </p>
           <p className="text-sm text-[var(--kravy-text-muted)] leading-relaxed mt-4">
             Furthermore, backend APIs block unauthorized access. Even if a regular Staff member knows the URL to the backup page or the tax settings, attempting to open it will instantly fail and boot them out with an "Access Denied" error message.
           </p>
         </div>
         <div className="bg-gray-100 p-4 border-t border-[var(--kravy-border)] flex items-center justify-between">
           <span className="text-sm font-bold text-gray-600">Want to invite a new user?</span>
           <Link href="/admin/users">
             <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition">
               Go to User Management &rarr;
             </button>
           </Link>
         </div>
      </div>
    </div>
  );
}
