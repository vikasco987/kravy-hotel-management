import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace('{/* Add Floor Modal */}', '</div>\n      {/* Add Floor Modal */}', 1)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
