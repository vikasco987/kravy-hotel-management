const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/checkout/page.tsx', 'utf-8');
let newBlock = fs.readFileSync('temp_dates.txt', 'utf-8');

const startIdx = content.indexOf('<div className="flex flex-col text-[11px] text-gray-500">');
// Find the closing div of the emerald pill
const emeraldPill = '<div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1">';
const emIdx = content.indexOf(emeraldPill, startIdx);
const endIdx = content.indexOf('</div>', emIdx) + '</div>'.length;

if (startIdx !== -1 && endIdx !== -1 && emIdx !== -1) {
    content = content.substring(0, startIdx) + newBlock.trim() + content.substring(endIdx);
    fs.writeFileSync('src/app/dashboard/checkout/page.tsx', content, 'utf-8');
    console.log("Success");
} else {
    console.log("Failed to find bounds");
}
