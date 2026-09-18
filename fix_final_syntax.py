with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# Replace the extra closing div and fix the fragment end
content = content.replace("    </div>\n  );\n}", "    </>\n  );\n}")

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
