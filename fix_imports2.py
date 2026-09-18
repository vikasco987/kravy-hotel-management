with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

old_import = 'import { Check, Clock3, Building2, Sparkles, Plus, Wrench, CircleCheck } from "lucide-react";'
new_import = 'import { Check, Clock3, Building2, Sparkles, Plus, Wrench, CircleCheck, BedDouble, Droplets, X, ChevronRight } from "lucide-react";'

content = content.replace(old_import, new_import)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
