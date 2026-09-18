with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

target = "</main>\n\n\n      {/* Add Floor Modal */}"
replacement = "</main>\n</div>\n</div>\n\n      {/* Add Floor Modal */}"

if target in content:
    content = content.replace(target, replacement)
    with open('src/app/components/RoomDashboard.tsx', 'w') as f:
        f.write(content)
    print("Fixed missing divs.")
else:
    print("Target not found again.")
