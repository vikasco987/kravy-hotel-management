with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

old_code = """        <div className="flex-1 space-y-6">
          {data.floors.map((floor) => (
            <FloorRow 
              key={floor.id} 
              floor={floor} 
              selectedRooms={selectedRooms} 
              handleToggleRoom={handleToggleRoom} 
            />
          ))}
        </div>"""

new_code = """        <div className="flex-1 space-y-4">
          {data.floors.map((floor) => {
            const visibleRooms = filter === 'ALL' ? floor.rooms : floor.rooms.filter((r: any) => r.status === filter);
            if (visibleRooms.length === 0) return null;
            return (
              <FloorRow 
                key={floor.id} 
                floor={{...floor, rooms: visibleRooms}} 
                selectedRooms={selectedRooms} 
                handleToggleRoom={handleToggleRoom} 
              />
            );
          })}
        </div>"""

content = content.replace(old_code, new_code)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
