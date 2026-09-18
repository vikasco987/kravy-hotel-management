import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
new_imports = """import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  Building2,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Droplets,
  Plus,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";"""

content = content.replace(
    'import { useEffect, useState } from "react";\nimport { useRouter } from "next/navigation";',
    new_imports
)

# 2. Add STATUS constant before export default
status_const = """
const STATUS: Record<string, any> = {
  AVAILABLE: {
    label: "Available",
    shortLabel: "Available",
    icon: Check,
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    strongBg: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
  OCCUPIED: {
    label: "Occupied",
    shortLabel: "Occupied",
    icon: BedDouble,
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    strongBg: "bg-blue-500",
    ring: "ring-blue-200",
  },
  DIRTY: {
    label: "Dirty",
    shortLabel: "Dirty",
    icon: Droplets,
    dot: "bg-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    strongBg: "bg-red-500",
    ring: "ring-red-200",
  },
  MAINTENANCE: {
    label: "Maintenance",
    shortLabel: "Maintenance",
    icon: Wrench,
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    strongBg: "bg-amber-500",
    ring: "ring-amber-200",
  },
  BLOCKED: {
    label: "Blocked",
    shortLabel: "Blocked",
    icon: X,
    dot: "bg-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
    text: "text-slate-700",
    strongBg: "bg-slate-500",
    ring: "ring-slate-200",
  },
  RESERVED: {
    label: "Reserved",
    shortLabel: "Rsrvd",
    icon: Clock3,
    dot: "bg-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    strongBg: "bg-purple-500",
    ring: "ring-purple-200",
  },
  CLEANING: {
    label: "Cleaning",
    shortLabel: "Clean",
    icon: Sparkles,
    dot: "bg-yellow-500",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    strongBg: "bg-yellow-500",
    ring: "ring-yellow-200",
  },
  INSPECTED: {
    label: "Inspected",
    shortLabel: "Insp",
    icon: Check,
    dot: "bg-teal-500",
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    strongBg: "bg-teal-500",
    ring: "ring-teal-200",
  }
};

export default function RoomDashboard() {"""

content = content.replace("export default function RoomDashboard() {", status_const)

# 3. Add states
state_addition = """  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [statusModalRoom, setStatusModalRoom] = useState<any | null>(null);

  // New UI states
  const [filter, setFilter] = useState<RoomStatus | "ALL">("ALL");
  const [selectedFloor, setSelectedFloor] = useState<string>("");
"""

content = content.replace(
    '  const [isStatusChanging, setIsStatusChanging] = useState(false);\n  const [statusModalRoom, setStatusModalRoom] = useState<any | null>(null);',
    state_addition
)

# 4. Handle initial selected floor logic inside useEffect
use_effect_mod = """          if (dashRes.ok) {
            const data = await dashRes.json();
            setData(data);
            if (data.floors && data.floors.length > 0) {
              setSelectedFloor(data.floors[0].name);
            }
          }"""

content = content.replace(
    """          if (dashRes.ok) {
            setData(await dashRes.json());
          }""",
    use_effect_mod
)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
