import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# Replace <svg viewBox="0 0 24 24" with <svg width="24" height="24" viewBox="0 0 24 24"
# But only if width is not already there
content = re.sub(r'<svg(?![^>]*width) viewBox="0 0 24 24"', r'<svg width="24" height="24" viewBox="0 0 24 24"', content)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
