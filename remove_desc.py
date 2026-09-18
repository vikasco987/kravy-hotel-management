import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# Match <div className="action-desc">...</div> and remove it
content = re.sub(r'\s*<div className="action-desc">.*?</div>', '', content)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)

print("Descriptions removed.")
