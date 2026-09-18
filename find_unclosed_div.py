import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    if '//' in line and '<div' in line: continue
    
    # Strip string literals and JSX comments if possible, but let's just do naive
    opens = re.finditer(r'<div\b', line)
    closes = re.finditer(r'</div\b', line)
    
    for _ in opens:
        stack.append(i + 1)
    for _ in closes:
        if stack:
            stack.pop()
        else:
            print(f"Extra closing div at line {i + 1}")

if stack:
    print(f"Unclosed divs opened at lines: {stack}")
else:
    print("All divs closed.")
