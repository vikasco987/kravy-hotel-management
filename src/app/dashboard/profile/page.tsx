"use client";

import { useEffect, useState, useCallback } from "react";
import BusinessProfile from "./BusinessProfile";
import ProfileEmpty from "./empty";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [enableMultipleProfiles, setEnableMultipleProfiles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/profiles", {
        cache: "no-store",
      });

      if (!res.ok) {
        setProfiles([]);
        return;
      }

      const data = await res.json();
      
      setProfiles(data.profiles || []);
      setEnableMultipleProfiles(data.enableMultipleProfiles || false);
      
    } catch (err) {
      console.error("Profile fetch error:", err);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const toggleMultipleProfiles = async () => {
    const newValue = !enableMultipleProfiles;
    setEnableMultipleProfiles(newValue);
    
    // Save to server
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enableMultipleProfiles: newValue })
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 space-y-8 animate-pulse">
        <div className="h-20 rounded-2xl bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)]" />
        <div className="h-64 rounded-[40px] bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)]" />
      </div>
    );
  }

  // Edit an existing profile or create a new one
  if (selectedProfileIndex !== null || isCreatingNew) {
    const profileData = isCreatingNew ? {} : profiles[selectedProfileIndex!];
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {enableMultipleProfiles && (
          <Button variant="outline" onClick={() => { setSelectedProfileIndex(null); setIsCreatingNew(false); }}>
            ← Back to Profiles
          </Button>
        )}
        <BusinessProfile
          data={profileData}
          onProfileUpdated={() => {
            fetchProfiles();
            if (isCreatingNew) setIsCreatingNew(false);
            if (!enableMultipleProfiles) setSelectedProfileIndex(null); // Keep it open if single mode
          }}
          isNew={isCreatingNew}
        />
      </div>
    );
  }

  // Single Profile Mode
  if (!enableMultipleProfiles) {
    if (profiles.length === 0) {
      return (
        <div className="space-y-4 max-w-5xl mx-auto">
          <Card className="p-6 flex items-center justify-between rounded-3xl bg-[var(--kravy-surface)] border-[var(--kravy-border)]">
            <div>
              <h3 className="font-bold text-lg">Multi-Business Profiles</h3>
              <p className="text-sm text-slate-500">Manage multiple restaurants from a single account.</p>
            </div>
            <Switch checked={enableMultipleProfiles} onCheckedChange={toggleMultipleProfiles} />
          </Card>
          <ProfileEmpty />
        </div>
      );
    }

    return (
      <div className="space-y-4 max-w-5xl mx-auto p-6">
        <Card className="p-6 flex items-center justify-between rounded-3xl bg-[var(--kravy-surface)] border-[var(--kravy-border)] shadow-sm">
          <div>
            <h3 className="font-bold text-lg">Multi-Business Profiles</h3>
            <p className="text-sm text-slate-500">Manage multiple restaurants from a single account.</p>
          </div>
          <Switch checked={enableMultipleProfiles} onCheckedChange={toggleMultipleProfiles} />
        </Card>
        <BusinessProfile
          data={profiles[0]}
          onProfileUpdated={fetchProfiles}
        />
      </div>
    );
  }

  // Multi-Profile List Mode
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <Card className="p-6 flex items-center justify-between rounded-3xl bg-[var(--kravy-surface)] border-[var(--kravy-border)] shadow-sm">
        <div>
          <h3 className="font-bold text-lg">Multi-Business Profiles</h3>
          <p className="text-sm text-slate-500">Manage multiple restaurants from a single account.</p>
        </div>
        <Switch checked={enableMultipleProfiles} onCheckedChange={toggleMultipleProfiles} />
      </Card>

      <div>
        <h2 className="text-2xl font-black mb-6">Your Businesses</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((p, idx) => (
            <Card 
              key={p.id} 
              className="p-6 cursor-pointer hover:shadow-lg transition-all border border-slate-200 rounded-3xl bg-white hover:border-indigo-300"
              onClick={() => setSelectedProfileIndex(idx)}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{p.businessName || "Unnamed Business"}</h3>
                  <p className="text-xs text-slate-500">{p.district || p.state || "No Location"}</p>
                </div>
              </div>
              <div className="text-sm text-slate-600">
                <p>Phone: {p.contactPersonPhone || "N/A"}</p>
                <p>GST: {p.gstNumber || "N/A"}</p>
              </div>
            </Card>
          ))}

          <Card 
            className="p-6 cursor-pointer hover:shadow-lg transition-all border border-dashed border-slate-300 rounded-3xl bg-slate-50 flex flex-col items-center justify-center min-h-[160px] hover:border-indigo-400 hover:bg-indigo-50"
            onClick={() => setIsCreatingNew(true)}
          >
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
              <Plus size={24} />
            </div>
            <h3 className="font-bold text-indigo-900">Add New Business</h3>
            <p className="text-xs text-slate-500 text-center mt-1">Create another profile</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
