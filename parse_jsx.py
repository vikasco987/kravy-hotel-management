import xml.etree.ElementTree as ET

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

start = content.find("return (\n    <>")
end = content.find("    </>\n  );") + len("    </>")

jsx_content = content[start+9:end]

# we need to remove {} blocks for simple xml parsing, but it's hard.
# let's just count open and close tags via regex

import re
opens = re.findall(r'<[a-zA-Z][a-zA-Z0-9]*\b[^>]*?(?<!/)>', jsx_content)
closes = re.findall(r'</[a-zA-Z][a-zA-Z0-9]*>', jsx_content)

from collections import Counter
open_counts = Counter([re.match(r'<([a-zA-Z0-9]+)', t).group(1) for t in opens])
close_counts = Counter([re.match(r'</([a-zA-Z0-9]+)', t).group(1) for t in closes])

for tag in set(open_counts.keys()).union(close_counts.keys()):
    if open_counts[tag] != close_counts[tag]:
        print(f"Tag {tag}: open {open_counts[tag]}, close {close_counts[tag]}")

