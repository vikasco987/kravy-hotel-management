"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface HeatmapData {
    [key: string]: number;
}

export default function UserActivityHeatmap({ clerkId }: { clerkId: string }) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<HeatmapData>({});
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    const fetchActivity = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/user/activity?clerkId=${clerkId}&year=${year}`);
            if (res.ok) {
                const json = await res.json();
                setData(json.activity || {});
                setTotal(json.totalBills || 0);
            }
        } catch (e) {
            console.error("Heatmap fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
    }, [year, clerkId]);

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    // Generate grid: 52 weeks x 7 days
    const grid = useMemo(() => {
        const weeks = [];
        const startDate = new Date(year, 0, 1);
        
        // Find first Sunday (or whatever day starts the week)
        const dayOffset = startDate.getDay(); // 0 is Sunday
        const firstDayOfGrid = new Date(startDate);
        firstDayOfGrid.setDate(startDate.getDate() - dayOffset);

        for (let w = 0; w < 53; w++) {
            const days = [];
            for (let d = 0; d < 7; d++) {
                const current = new Date(firstDayOfGrid);
                current.setDate(firstDayOfGrid.getDate() + (w * 7) + d);
                
                if (current.getFullYear() === year) {
                    const dateStr = current.toISOString().split('T')[0];
                    days.push({
                        date: dateStr,
                        count: data[dateStr] || 0
                    });
                } else {
                    days.push(null);
                }
            }
            weeks.push(days);
        }
        return weeks;
    }, [year, data]);

    const getColor = (count: number) => {
        if (count === 0) return "bg-[#1e1e1e]";
        if (count < 3) return "bg-[#4a4ae6]"; // Light blue
        if (count < 6) return "bg-[#6366f1]"; // Brand Indigo
        if (count < 10) return "bg-[#818cf8]"; // Lighter Indigo
        return "bg-[#c7d2fe]"; // Very light
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[#0a0a0a] rounded-[40px] border border-[var(--kravy-border)] p-8 shadow-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Activity size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">User Activity</h2>
                        <p className="text-[10px] text-muted-foreground font-medium">{total} total contributions in {year}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <select 
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="bg-[#1a1a1a] text-white text-[10px] font-black py-2 px-4 rounded-full border border-white/5 outline-none cursor-pointer hover:bg-[#252525] transition-colors appearance-none pr-8 relative"
                        style={{
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'white\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 12px center',
                            backgroundSize: '10px'
                        }}
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                    </select>
                </div>
            </div>

            {/* Grid Container */}
            <div className="relative">
                <div className="flex gap-1.5 overflow-x-auto pb-4 scrollbar-hide">
                    {grid.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-1.5 flex-shrink-0">
                            {week.map((day, di) => (
                                <motion.div
                                    key={di}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: (wi * 0.01) + (di * 0.005) }}
                                    className={`w-[14px] h-[14px] rounded-[4px] transition-all cursor-pointer hover:ring-2 hover:ring-indigo-500/50 ${day ? getColor(day.count) : "bg-transparent"}`}
                                    title={day ? `${day.date}: ${day.count} bills` : ""}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* Months Labels */}
                <div className="flex justify-between mt-4 px-2">
                    {months.map((m, i) => (
                        <span key={i} className="text-[9px] font-black text-muted-foreground tracking-widest">{m}</span>
                    ))}
                </div>
            </div>

            {/* Footer Legend */}
            <div className="flex items-center justify-end gap-3 mt-8">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Less</span>
                <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1e1e1e]" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4a4ae6]" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#6366f1]" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#818cf8]" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#c7d2fe]" />
                </div>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">More</span>
            </div>
        </motion.div>
    );
}
