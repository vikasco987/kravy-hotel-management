import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    lines = f.readlines()

open_divs = 0
close_divs = 0

for i, line in enumerate(lines):
    if '//' in line and '<div' in line:
        continue
    o = len(re.findall(r'<div\b', line))
    c = len(re.findall(r'</div>', line))
    open_divs += o
    close_divs += c

print(f"Open: {open_divs}, Close: {close_divs}")
