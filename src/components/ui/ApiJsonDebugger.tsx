"use client";

import { Code, Check, Copy, X } from "lucide-react";
import { useState } from "react";

export function ApiJsonDebugger({ apiRequests, isOpen, onClose, onClear }: any) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center">
              <Code size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">API Debug JSON</h3>
              <p className="text-xs font-bold text-slate-500">Actual network requests captured on this page</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const data = { requests: apiRequests };
                navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                setCopiedAll(true);
                setTimeout(() => setCopiedAll(false), 2000);
              }}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            >
              {copiedAll ? <Check size={14} /> : <Copy size={14} />}
              {copiedAll ? 'Copied' : 'Copy All JSON'}
            </button>
            <button 
              onClick={onClear}
              className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition"
            >
              Clear Logs
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition ml-2">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Total Requests: {apiRequests.length}
          </div>
          {apiRequests.map((req: any, index: number) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-100 text-blue-700">{req.method}</span>
                    <span className="text-sm font-bold text-gray-800 break-all">{req.url}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500">
                    <span className={`flex items-center gap-1 ${req.status === 200 || req.status === 201 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Status: {req.status}
                    </span>
                    <span>Time: {req.responseTimeMs} ms</span>
                    <span>{new Date(req.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(req.response, null, 2));
                    setCopiedIndex(index);
                    setTimeout(() => setCopiedIndex(null), 2000);
                  }}
                  className="shrink-0 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  {copiedIndex === index ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiedIndex === index ? 'Copied' : 'Copy JSON'}
                </button>
              </div>
              <div className="p-4 bg-[#1e1e1e] overflow-x-auto">
                <pre className="text-[11px] text-gray-300 font-mono leading-relaxed">
                  {JSON.stringify(req.response, null, 2)}
                </pre>
              </div>
            </div>
          ))}
          {apiRequests.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-bold">
              No requests captured yet. Change filters or page to see them.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
