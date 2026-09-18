with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# I will find the start of the beige floor layout, and put a </div> right before it.
target_str = '<div className="bg-[#f3eee5] p-6 lg:p-10 font-sans pb-24 border-t-2 border-[#e2d8c3] mt-8">'

content = content.replace(target_str, '</div>\n      ' + target_str)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
