import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# find export default function RoomDashboard() { and add filter state
pattern = r'(export default function RoomDashboard\(\) \{\n\s*const \[data, setData\] = useState<DashboardData \| null>\(null\);)'
replacement = r'\1\n  const [filter, setFilter] = useState("ALL");'

content = re.sub(pattern, replacement, content, count=1)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
