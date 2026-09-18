with open('replace_dashboard.py', 'r') as f:
    lines = f.readlines()

# Lines 10 to 133 are the dash-page top cards section (0-indexed 9 to 133)
top_cards_jsx = "".join(lines[9:133])

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# Replace the min-h-screen class so it doesn't take the full screen
content = content.replace(
    '<div className="min-h-screen bg-[#f3eee5] p-6 lg:p-10 font-sans pb-24">',
    top_cards_jsx + '\n      <div className="bg-[#f3eee5] p-6 lg:p-10 font-sans pb-24 border-t-2 border-[#e2d8c3] mt-8">'
)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
