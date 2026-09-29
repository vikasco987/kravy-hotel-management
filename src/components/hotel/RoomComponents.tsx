import React, { useState } from "react";
import { Check, MoreVertical } from "lucide-react";

export const STATUS_COLORS: Record<string, { bg: string, text: string, border: string, dot: string, label: string }> = {
  AVAILABLE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500', label: 'Available' },
  OCCUPIED: { bg: 'bg-indigo-50/70', text: 'text-indigo-700', border: 'border-indigo-100/50', dot: 'bg-indigo-500', label: 'Occupied' },
  DIRTY: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', dot: 'bg-rose-500', label: 'Dirty' },
  MAINTENANCE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500', label: 'Maintenance' },
  BLOCKED: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500', label: 'Blocked' },
  RESERVED: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', dot: 'bg-violet-500', label: 'Reserved' },
  CLEANING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100', dot: 'bg-yellow-500', label: 'Cleaning' },
  INSPECTED: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', dot: 'bg-teal-500', label: 'Inspected' },
};

export function FilterBadge({ statusKey, count, isActive, onClick }: { statusKey: string, count: number, isActive: boolean, onClick: () => void }) {
  if (statusKey === 'ALL') {
    return (
      <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${isActive ? 'bg-indigo-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-gray-400'}`}></div>
        ALL <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>{count}</span>
      </button>
    );
  }
  const config = STATUS_COLORS[statusKey] || STATUS_COLORS.AVAILABLE;
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${isActive ? `ring-2 ring-offset-1 ring-${config.dot.split('-')[1]}-300 shadow-sm` : 'border border-transparent hover:border-gray-200'} ${config.bg} ${config.text}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
      {config.label} <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/60">{count}</span>
    </button>
  );
}

export function FloorRow({ floor, floorIndex, selectedRooms = [], focusedRoomId, highlightedRoomId, onRoomClick, onEditFloor, onDeleteFloor }: any) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const availableCount = floor.rooms.filter((r: any) => r.status === 'AVAILABLE').length;
  
  const floorNum = floorIndex + 1;
  const badgeText = `F${floorNum}`;
  const floorName = `Floor ${floorNum.toString().padStart(2, '0')}`;

  const handleDeleteClick = () => {
    if (floor.rooms.length > 0) {
      alert("Cannot delete floor: There are rooms assigned to this floor. Please delete or move the rooms first.");
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (onDeleteFloor) {
      await onDeleteFloor(floor.id);
    } else {
      alert("Delete functionality not provided");
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div className="flex flex-col sm:flex-row bg-white rounded-[20px] p-4 items-center shadow-sm border border-gray-100 w-full mb-4 gap-4 sm:gap-6 relative">
      <div className="flex items-center w-full sm:w-[220px] shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 pb-4 sm:pb-0 sm:pr-6">
        <div className="flex flex-col items-center justify-center w-[52px] h-[52px] rounded-[14px] bg-blue-50/80 text-blue-600 border border-blue-100 mr-4 shrink-0">
          <span className="text-[15px] font-black leading-none">{badgeText}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mt-1">Floor</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-[15px] text-gray-900 truncate" title={floor.name}>{floorName}</span>
          <span className="text-[11px] font-medium text-gray-400 mt-1">{floor.rooms.length} rooms &middot; {availableCount} free</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-x-auto gap-3 py-1 scrollbar-hide w-full items-center">
        {floor.rooms.map((room: any) => {
          const isSelectedForBooking = selectedRooms.includes(room.id);
          const isFocused = focusedRoomId === room.id;
          const isHighlighted = highlightedRoomId === room.id;
          const config = STATUS_COLORS[room.status] || STATUS_COLORS.AVAILABLE;
          const roomLabel = room.roomNumber || room.number || 'N/A';
          
          return (
            <div 
              key={room.id}
              id={`room-${roomLabel}`}
              onClick={() => onRoomClick && onRoomClick(room.id)}
              title={`Room ${roomLabel}\nStatus: ${config.label}`}
              className={`relative px-4 w-[76px] h-[48px] shrink-0 flex flex-col items-center justify-center rounded-[14px] cursor-pointer transition-all duration-200 ${config.bg} ${config.text} ${isSelectedForBooking ? 'ring-2 ring-indigo-500 shadow-md scale-[1.02]' : 'border border-transparent hover:border-gray-200'} ${isFocused ? 'ring-2 ring-indigo-400 shadow-lg scale-105 z-10' : 'hover:scale-[1.02] hover:-translate-y-0.5'} ${isHighlighted ? 'ring-4 ring-indigo-400 ring-opacity-50 animate-pulse' : ''}`}
            >
              {isSelectedForBooking && (
                <div className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white rounded-full p-1 shadow-sm z-20">
                  <Check size={10} strokeWidth={4} />
                </div>
              )}
              <span className="font-extrabold text-[14px] tracking-tight">{roomLabel}</span>
              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${config.dot}`}></div>
            </div>
          );
        })}
      </div>
      <div className="relative shrink-0 flex items-center justify-center">
        <div 
          onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors text-gray-400"
        >
           <MoreVertical size={18} />
        </div>
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}></div>
            <div className="absolute right-0 top-10 w-36 bg-white border border-gray-100 shadow-lg rounded-xl overflow-hidden z-50 py-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); if (onEditFloor) onEditFloor(floor); else alert("Edit not implemented"); }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit Floor
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); handleDeleteClick(); }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Delete Floor
              </button>
            </div>
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">Delete Floor?</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium">Are you sure you want to delete {floorName}? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-sm shadow-rose-500/20">Delete Floor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
