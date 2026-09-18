import React from 'react';
import { X, Check } from 'lucide-react';

export default function ColumnSettingsModal({
  settings,
  onChange,
  onClose
}: {
  settings: any;
  onChange: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="bg-[#0070f3] text-white px-4 py-3 flex items-center justify-between">
          <h2 className="font-bold text-sm">Column Settings</h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded"><X size={16}/></button>
        </div>
        <div className="p-4 space-y-3">
          {Object.keys(settings).map(key => (
            <label key={key} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded border">
              <input 
                type="checkbox" 
                checked={settings[key]} 
                onChange={() => onChange(key)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-bold text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()} Column
              </span>
            </label>
          ))}
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button onClick={onClose} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm">
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}
