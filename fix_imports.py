with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

imports = """import { useRouter } from "next/navigation";
import { Check, Clock3, Building2, Sparkles, Plus, Wrench, CircleCheck } from "lucide-react";
"""

content = content.replace('import { useEffect, useState } from "react";', 'import { useEffect, useState } from "react";\n' + imports)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
