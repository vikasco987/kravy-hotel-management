import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

start = content.find('return (')
end = content.find('// Subcomponents')

block = content[start:end]

# naive counter
open_divs = len(re.findall(r'<div[^>]*>', block))
close_divs = len(re.findall(r'</div>', block))
open_frags = len(re.findall(r'<>', block))
close_frags = len(re.findall(r'</>', block))

print(f"Open divs: {open_divs}")
print(f"Close divs: {close_divs}")
print(f"Open frags: {open_frags}")
print(f"Close frags: {close_frags}")

