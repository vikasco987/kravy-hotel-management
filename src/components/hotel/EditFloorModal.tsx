import React, { useState, useEffect } from 'react';

interface EditFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  floor: { id: string; name: string } | null;
  onSuccess: () => void;
}

export function EditFloorModal({ isOpen, onClose, floor, onSuccess }: EditFloorModalProps) {
  const [newFloorName, setNewFloorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (floor && isOpen) {
      setNewFloorName(floor.name);
    }
  }, [floor, isOpen]);

  if (!isOpen || !floor) return null;

  const handleEditFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/hotel/floors/${floor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFloorName })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to update floor');
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Network error while updating floor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <form onSubmit={handleEditFloor} className="p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-900">Edit Floor</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Floor Name</label>
              <input
                type="text"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                placeholder="e.g., Ground Floor"
                className="w-full border rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-300 outline-none"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
