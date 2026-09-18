with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

toggle_room_func = """
  const handleToggleRoom = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };
"""

content = content.replace("  const router = useRouter();", "  const router = useRouter();\n" + toggle_room_func)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
