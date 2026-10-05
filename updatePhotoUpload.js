const fs = require('fs');
const path = 'C:/studio/kravy-hotel-management/src/app/dashboard/book/RoomSetupModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetRegex = /<button onClick=\{\(\) => setActiveUpload\('photo'\)\} className=\{`relative flex-1 min-w-\[90px\] max-w-\[130px\] flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors overflow-hidden \$\{photoUrl \? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100'\}`\}>[\s\S]*?<\/button>/m;

const newContent = `                  {photoUrl && (
                      <div className="relative h-full w-24 shrink-0 rounded-xl overflow-hidden border border-blue-200 shadow-sm group">
                         <img src={photoUrl} alt="Photo" className="absolute inset-0 h-full w-full object-cover" />
                         <div className="absolute top-2 right-2 bg-white rounded-full p-0.5 shadow-md z-10">
                            <CheckCircle2 size={18} className="text-blue-600" />
                         </div>
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <button onClick={(e) => { e.stopPropagation(); setPhotoUrl(null); }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 z-20">
                            <Trash2 size={16} />
                         </button>
                      </div>
                  )}

                  {!photoUrl && (
                      <button onClick={() => setActiveUpload('photo')} className="relative flex-1 min-w-[90px] max-w-[130px] flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors overflow-hidden">
                         <Camera size={24} />
                         <span className="text-[11px] font-bold">Take Photo</span>
                      </button>
                  )}`;

if(targetRegex.test(content)) {
   content = content.replace(targetRegex, newContent);
   fs.writeFileSync(path, content);
   console.log('Replaced successfully');
} else {
   console.log('Target not found');
}
