import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    lines = f.readlines()

open_divs = 0
close_divs = 0
open_main = 0
close_main = 0

for i, line in enumerate(lines):
    if '//' in line and '<div' in line:
        continue
    open_divs += len(re.findall(r'<div\b', line))
    close_divs += len(re.findall(r'</div>', line))
    open_main += len(re.findall(r'<main\b', line))
    close_main += len(re.findall(r'</main>', line))

print(f"divs: Open: {open_divs}, Close: {close_divs}")
print(f"main: Open: {open_main}, Close: {close_main}")
