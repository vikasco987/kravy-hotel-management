'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, RefreshCw } from 'lucide-react';

interface ChangeRoomModalProps {
  currentRoomId: string;
  onClose: () => void;
  onSelect: (newRoomId: string) => void;
}

export default function ChangeRoomModal({ currentRoomId, onClose, onSelect }: ChangeRoomModalProps) {
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/hotel/dashboard', { cache: 'no-store' });
        const data = await res.json();
        
        // Extract all available rooms from floors
        const rooms = data.floors?.flatMap((f: any) => f.rooms) || [];
        const available = rooms.filter((r: any) => r.status === 'AVAILABLE' && r.id !== currentRoomId);
        
        setAvailableRooms(available);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, [currentRoomId]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md flex flex-col">
        <div className="bg-[#0e2a6d] text-white p-3 flex justify-between items-center shrink-0">
          <h3 className="font-bold flex items-center gap-2 text-sm">
            <RefreshCw size={16} /> Change Room
          </h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-auto">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading available rooms...</div>
          ) : availableRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-medium">No other available rooms found.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {availableRooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => onSelect(room.id)}
                  className="border border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center gap-2"
                >
                  <span className="text-lg font-black text-gray-900">{room.number}</span>
                  <span className="text-xs text-gray-500">{room.type || 'Standard'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 border-t border-gray-200 p-3 flex justify-end">
          <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-bold">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
