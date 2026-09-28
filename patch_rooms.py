import re

with open('src/app/dashboard/rooms/page.tsx', 'r') as f:
    content = f.read()

# Add states
states_hook = """  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [newFloorNumber, setNewFloorNumber] = useState("");
  const [newFloorName, setNewFloorName] = useState("");"""
content = content.replace("  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);", states_hook)

# Connect main Add Room button
main_btn = """<button className="ml-auto flex items-center gap-1.5 text-indigo-600 font-bold text-xs hover:bg-indigo-50 px-4 py-2 rounded-full transition whitespace-nowrap">"""
new_main_btn = """<button onClick={() => setIsAddRoomOpen(true)} className="ml-auto flex items-center gap-1.5 text-indigo-600 font-bold text-xs hover:bg-indigo-50 px-4 py-2 rounded-full transition whitespace-nowrap">"""
content = content.replace(main_btn, new_main_btn)

# Connect Floor + button
floor_btn = """<button className="w-8 h-8 rounded-full border border-gray-200 text-indigo-600 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-200 transition bg-white shadow-sm">"""
new_floor_btn = """<button onClick={() => setIsAddRoomOpen(true)} className="w-8 h-8 rounded-full border border-gray-200 text-indigo-600 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-200 transition bg-white shadow-sm">"""
content = content.replace(floor_btn, new_floor_btn)

# Connect Add Floor button
add_floor_btn = """<button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition">"""
new_add_floor_btn = """<button onClick={() => setIsAddFloorOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition">"""
content = content.replace(add_floor_btn, new_add_floor_btn)

# Add Modals at the bottom
modals = """

      {/* Add Floor Modal */}
      {isAddFloorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">Add New Floor</h2>
                 <button onClick={() => setIsAddFloorOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Floor Number</label>
                  <input type="number" value={newFloorNumber} onChange={e => setNewFloorNumber(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-slate-900" placeholder="e.g., 1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Floor Name / Description</label>
                  <input type="text" value={newFloorName} onChange={e => setNewFloorName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-slate-900" placeholder="e.g., Ground Floor" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsAddFloorOpen(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="button" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20">Save Floor</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Add Room Modal (Simplified placeholder for demo) */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">Add New Room</h2>
                 <button onClick={() => setIsAddRoomOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="text-center py-8">
                 <p className="text-gray-500 font-medium text-sm">Room creation form will be integrated here.</p>
              </div>
              <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setIsAddRoomOpen(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">Close</button>
              </div>
           </div>
        </div>
      )}
"""
content = content.replace("    </div>\n  );\n}", modals + "\n    </div>\n  );\n}")

with open('src/app/dashboard/rooms/page.tsx', 'w') as f:
    f.write(content)
print("Patched rooms page")
