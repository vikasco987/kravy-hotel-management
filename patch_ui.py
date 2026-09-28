import re

with open('src/app/dashboard/rooms/page.tsx', 'r') as f:
    content = f.read()

# Fix interface
interface_old = "roomType: { name: string; basePrice: number; capacity: number };"
interface_new = "roomType: string;\n  price: number;\n  guestInfo?: any;"
content = content.replace(interface_old, interface_new)

# Fix right panel rendering
panel_old = """                <span className="text-xs font-black text-gray-900 mt-0.5">{selectedRoom.roomType.name}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center text-center">
                <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[8px] mb-2">₹</div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Price</span>
                <span className="text-xs font-black text-gray-900 mt-0.5">₹ {selectedRoom.roomType.basePrice} <span className="font-medium text-[9px] text-gray-500">/ night</span></span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center text-center">
                <UserCheck size={16} className="text-indigo-500 mb-2" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Capacity</span>
                <span className="text-xs font-black text-gray-900 mt-0.5">{selectedRoom.roomType.capacity} guests</span>"""
panel_new = """                <span className="text-xs font-black text-gray-900 mt-0.5">{selectedRoom.roomType}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center text-center">
                <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[8px] mb-2">₹</div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Price</span>
                <span className="text-xs font-black text-gray-900 mt-0.5">₹ {selectedRoom.price} <span className="font-medium text-[9px] text-gray-500">/ night</span></span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center text-center">
                <UserCheck size={16} className="text-indigo-500 mb-2" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Capacity</span>
                <span className="text-xs font-black text-gray-900 mt-0.5">2 guests</span>"""
content = content.replace(panel_old, panel_new)

# Fix Guest Info
guest_old = """              {selectedRoom.status === 'OCCUPIED' ? (
                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                    JD
                  </div>
                  <div>
                    <div className="text-sm font-black text-indigo-900">John Doe</div>
                    <div className="text-[11px] font-medium text-indigo-600 mt-0.5">+91 98765 43210</div>
                    <div className="text-[10px] font-bold text-indigo-400 mt-1 uppercase tracking-widest">ID: JD123456</div>
                  </div>
                </div>"""
guest_new = """              {selectedRoom.guestInfo ? (
                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                    {selectedRoom.guestInfo.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-black text-indigo-900">{selectedRoom.guestInfo.name}</div>
                    <div className="text-[11px] font-medium text-indigo-600 mt-0.5">{selectedRoom.guestInfo.phone || 'No phone'}</div>
                    <div className="text-[10px] font-bold text-indigo-400 mt-1 uppercase tracking-widest">ID: {selectedRoom.guestInfo.id ? selectedRoom.guestInfo.id.substring(selectedRoom.guestInfo.id.length - 6).toUpperCase() : 'UNKNOWN'}</div>
                  </div>
                </div>"""
content = content.replace(guest_old, guest_new)

# Fix Room Card styles and border
old_card = """className={`relative rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedRoom?.id === room.id ? 'border-indigo-500 shadow-md transform -translate-y-1' : getStatusColor(room.status).replace('text-', 'border-').replace('bg-', 'hover:bg-').replace('border-', 'border-opacity-50 border-')} bg-opacity-30`}"""

new_card = """className={`relative rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden ${selectedRoom?.id === room.id ? 'border-indigo-500 shadow-md transform -translate-y-1 ring-2 ring-indigo-500/20' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'} bg-white`}"""
content = content.replace(old_card, new_card)

# Fix Room Card inner content (solid colored header)
old_card_inner = """<div className={`h-1.5 w-full rounded-t-lg ${getStatusColor(room.status).split(' ')[1]}`}></div>
                             <div className={`p-4 flex flex-col items-center justify-center bg-white rounded-b-lg h-[90px]`}>
                               <span className={`text-xl font-black ${getStatusColor(room.status).split(' ')[0]}`}>
                                 {room.roomNumber}
                               </span>
                               <div className="flex items-center gap-1.5 mt-2">
                                 <div className={`w-2 h-2 rounded-full ${getStatusDot(room.status)}`}></div>
                                 <MoreVertical size={14} className="text-gray-300 absolute right-2 top-3 opacity-0 group-hover:opacity-100" />
                               </div>
                             </div>"""

new_card_inner = """<div className={`h-[40px] w-full flex items-center justify-center ${getStatusColor(room.status).split(' ')[1]}`}>
                               <span className={`text-lg font-black ${getStatusColor(room.status).split(' ')[0]}`}>
                                 {room.roomNumber}
                               </span>
                             </div>
                             <div className="p-4 flex flex-col items-center justify-center bg-white h-[60px]">
                               <div className="flex items-center gap-1.5">
                                 <div className={`w-2 h-2 rounded-full ${getStatusDot(room.status)}`}></div>
                                 <span className={`text-[10px] font-bold uppercase tracking-widest ${getStatusColor(room.status).split(' ')[0]}`}>{room.status}</span>
                               </div>
                             </div>"""
content = content.replace(old_card_inner, new_card_inner)

with open('src/app/dashboard/rooms/page.tsx', 'w') as f:
    f.write(content)
print("Applied fixes")
