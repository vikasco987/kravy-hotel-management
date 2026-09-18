with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

missing_state = """
  const [quickStatusRoomId, setQuickStatusRoomId] = useState<string>('');
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [statusModalRoom, setStatusModalRoom] = useState<any | null>(null);
"""

content = content.replace("  const router = useRouter();", "  const router = useRouter();\n" + missing_state)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
