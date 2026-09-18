with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

start_index = content.rfind('function FilterBadge({ label, count, bgColor }:')

if start_index != -1:
    content = content[:start_index]

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
