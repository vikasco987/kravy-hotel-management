const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/checkout/page.tsx', 'utf-8');

content = content.replace(
    /<button className=\"bg-white border border-gray-200 hover:bg-gray-50 text-\[10px\] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1\">🍽 Food Service<\/button>[\s\S]*?<button className=\"bg-white border border-gray-200 hover:bg-gray-50 text-\[10px\] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1\">🧹 Extra Cleaning<\/button>/m,
    `{availableServices.map((s: any) => (
      <button key={s.id} onClick={() => handleAddCheckoutService(s.name, s.price, 1)} disabled={isAddingService} className="bg-white border border-gray-200 hover:bg-gray-50 text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1 disabled:opacity-50">
        <Plus size={10}/> {s.name} (₹{s.price/100})
      </button>
    ))}`
);

content = content.replace(
    /<td className=\"px-3 py-2 font-bold text-gray-800\">\[\{c\.type \|\| 'Custom'\}\] \{c\.description\}<\/td>/g,
    `<td className="px-3 py-2 font-bold text-gray-800">
      [{c.type || 'Custom'}] {c.description} 
      {c.stayRoomId && <span className="text-[9px] font-normal text-teal-600 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded ml-2">Added to Rm</span>}
    </td>`
);

content = content.replace(
    /<button className=\"bg-red-50 text-red-500 hover:bg-red-100 p-1 rounded\"><Trash2 size=\{10\}\/><\/button>/g,
    `<button onClick={() => handleAddCheckoutService(c.description, c.amount, 0, c.type)} disabled={isAddingService} className="bg-red-50 text-red-500 hover:bg-red-100 p-1 rounded disabled:opacity-50"><Trash2 size={10}/></button>`
);

fs.writeFileSync('src/app/dashboard/checkout/page.tsx', content, 'utf-8');
console.log('Done');
