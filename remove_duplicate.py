import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# Remove the old FilterBadge
pattern = re.compile(r'function FilterBadge\(\{.*?\}\s*(?:\n.*)*?\n\}\n*', re.MULTILINE)
# We want to keep the FIRST occurrence (which is my new one), so we will find all matches and replace the second one.
matches = list(pattern.finditer(content))

if len(matches) > 1:
    # Delete the second match
    match_to_delete = matches[1]
    content = content[:match_to_delete.start()] + content[match_to_delete.end():]

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
