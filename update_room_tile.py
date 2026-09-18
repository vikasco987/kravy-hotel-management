import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# We need to replace the inner return of the room map.
# Find this exact block:
old_return = """          return (
            <div 
              key={room.id}
              onClick={() => handleToggleRoom(room.id)}
              className={`relative px-4 py-2 flex items-center gap-2 rounded-xl border cursor-pointer font-bold text-sm transition-all ${colorClass} ${
                isSelected ? 'ring-2 ring-indigo-500 shadow-md scale-105 z-10' : 'hover:scale-[1.02]'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white rounded-full p-0.5 shadow-sm z-20">
                  <Check size={10} strokeWidth={4} />
                </div>
              )}
              <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
              {room.number}
            </div>
          );"""

new_return = """          return (
            <div 
              key={room.id}
              onClick={() => handleToggleRoom(room.id)}
              className={`relative px-6 py-2.5 min-w-[70px] flex items-center justify-center rounded-xl border cursor-pointer font-extrabold text-base transition-all ${colorClass} ${
                isSelected ? 'ring-2 ring-indigo-500 shadow-md scale-105 z-10' : 'hover:scale-[1.02]'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white rounded-full p-0.5 shadow-sm z-20">
                  <Check size={10} strokeWidth={4} />
                </div>
              )}
              {room.number}
            </div>
          );"""

# Replace in content
if old_return in content:
    content = content.replace(old_return, new_return)
    with open('src/app/components/RoomDashboard.tsx', 'w') as f:
        f.write(content)
    print("Successfully updated room tile.")
else:
    # If indentation differs, let's use regex
    pattern = re.compile(r'return \(\s*<div\s*key=\{room\.id\}.*?\{room\.number\}\s*<\/div>\s*\);', re.DOTALL)
    if pattern.search(content):
        content = pattern.sub(new_return, content)
        with open('src/app/components/RoomDashboard.tsx', 'w') as f:
            f.write(content)
        print("Successfully updated room tile via regex.")
    else:
        print("Could not find the block to replace.")
