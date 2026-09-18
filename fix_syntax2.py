with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("    </div>\n      {/* Add Floor Modal */}", "      {/* Add Floor Modal */}")

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
