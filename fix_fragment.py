import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# I will replace `return (\n    <div className="min-h-screen bg-[#f3eee5] p-6 lg:p-10 font-sans pb-24">`
# with `return (\n    <>\n    <div className="min-h-screen bg-[#f3eee5] p-6 lg:p-10 font-sans pb-24">`

content = content.replace(
    'return (\n    <div className="min-h-screen bg-[#f3eee5] p-6 lg:p-10 font-sans pb-24">',
    'return (\n    <>\n    <div className="min-h-screen bg-[#f3eee5] p-6 lg:p-10 font-sans pb-24">'
)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
