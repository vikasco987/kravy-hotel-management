with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

target = "      {/* Add Floor Modal */}"
replacement = "    </div>\n      {/* Add Floor Modal */}"
content = content.replace(target, replacement)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
