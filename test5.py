import re
with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    lines = f.readlines()
open_cnt = 0
for i, line in enumerate(lines):
    if '//' in line and '<div' in line: continue
    opens = len(re.findall(r'<div\b', line))
    closes = len(re.findall(r'</div\b', line))
    open_cnt += (opens - closes)
print(f"Final open div count: {open_cnt}")
