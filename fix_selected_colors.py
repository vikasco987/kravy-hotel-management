with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# Replace the incorrect className logic
old_class_logic = """className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected ? 'border-gray-900 shadow-md transform scale-[1.02]' : `border-transparent hover:border-gray-300 ${colorClass}`
              }`}"""

new_class_logic = """className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${colorClass} ${
                isSelected ? 'border-gray-900 shadow-md transform scale-[1.02]' : 'border-transparent hover:border-gray-300'
              }`}"""

content = content.replace(old_class_logic, new_class_logic)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
