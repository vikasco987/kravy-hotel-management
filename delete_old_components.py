with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    lines = f.readlines()

# Delete lines 162 to 226 (0-indexed: 161 to 226)
del lines[161:226]

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.writelines(lines)
