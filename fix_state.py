with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

target = "const [quickStatusRoomId, setQuickStatusRoomId] = useState('');"
replacement = "const [quickStatusRoomId, setQuickStatusRoomId] = useState('');\n  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);\n  const [focusedFloorId, setFocusedFloorId] = useState<string | null>(null);"

content = content.replace(target, replacement)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
