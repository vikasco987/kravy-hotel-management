const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/checkout/page.tsx', 'utf-8');
content = content.replace(
  /<div className=\"flex gap-2 mb-2\">[\s\S]*?<\/div>/,
  `<div className="flex gap-2 mb-2">
                     <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsServicesModalOpen(true); }} className="bg-teal-700 hover:bg-[#091a42] text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1 ml-auto"><Plus size={10}/> Add Service</button>
                  </div>`
);
fs.writeFileSync('src/app/dashboard/checkout/page.tsx', content, 'utf-8');
console.log('Fixed buttons');
