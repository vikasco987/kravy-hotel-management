with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    lines = f.readlines()

# Delete lines 162 to 219 (0-indexed: 161 to 219)
del lines[161:219]

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.writelines(lines)
