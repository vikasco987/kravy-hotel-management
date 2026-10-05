const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/reservations/page.tsx', 'utf8');

c = c.replace(
  /<td className="px-6 py-4">\s*<div className="flex flex-col">\s*<span className="text-sm font-bold text-gray-800">\{res\.rooms\.length > 0 \? res\.rooms\[0\]\.split\('\('\)\[0\]\.trim\(\) : 'Unassigned'\}<\/span>\s*\{res\.rooms\.length > 0 && <span className="text-\[11px\] text-gray-500 font-medium">\(\{res\.rooms\[0\]\.split\('\('\)\[1\] \|\| 'Standard\)'\}<\/span>\}\s*<\/div>\s*<\/td>/g,
  `<td className="px-6 py-4">
    <div className="flex flex-col">
      {res.rooms.length > 0 ? (
         <>
           <span className="text-sm font-bold text-gray-800">{res.rooms.length > 1 ? \`\${res.rooms[0].split('(')[0].trim()} +\${res.rooms.length - 1}\` : res.rooms[0].split('(')[0].trim()}</span>
           <span className="text-[11px] text-gray-500 font-medium">{res.rooms.length > 1 ? 'Multi-room' : \`(\${res.rooms[0].split('(')[1] || 'Standard)'}\`}</span>
         </>
      ) : (
         <span className="text-sm font-bold text-gray-800">Unassigned</span>
      )}
    </div>
  </td>`
);

c = c.replace(
  /<td className="px-6 py-4 text-sm font-bold text-gray-800">\s*₹ \{res\.totalAmount \? \(res\.totalAmount\/100\)\.toLocaleString\(\) : '0'\}\s*<\/td>/g,
  `<td className="px-6 py-4 text-sm font-bold text-gray-800">
    {res.guests}
  </td>
  <td className="px-6 py-4 text-sm font-bold text-gray-800">
    ₹ {res.totalAmount ? (res.totalAmount/100).toLocaleString() : '0'}
  </td>`
);

c = c.replace(
  /<td className="px-6 py-4 text-center relative">/g,
  `<td className="px-6 py-4">
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">{res.source || 'Direct'}</span>
  </td>
  <td className="px-6 py-4">
    <div className="flex flex-col">
      <span className="text-xs font-bold text-gray-800">{res.createdAt ? dayjs(res.createdAt).format('DD MMM YYYY') : '-'}</span>
      <span className="text-[10px] text-gray-500">{res.createdAt ? dayjs(res.createdAt).format('hh:mm A') : '-'}</span>
    </div>
  </td>
  <td className="px-6 py-4 text-center relative">`
);

c = c.replace(
  /\{actionMenuOpenId === res\.id && \([\s\S]*?<\/div>\s*\)\}/g,
  `{actionMenuOpenId === res.id && (
    <div className="absolute right-8 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden text-left">
      <button onClick={() => router.push(\`/dashboard/reservations/\${res.id}\`)} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">View Details</button>
      {(res.status === "RESERVED" || res.status === "CONFIRMED") && (
         <>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Edit Reservation</button>
           <button onClick={() => router.push(\`/dashboard/checkin?resId=\${res.id}\`)} className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50">Check-in</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Add Payment</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Change Room</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Add Extra Service</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Cancel Reservation</button>
         </>
      )}
      {res.status === "CHECKED_IN" && (
         <>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Add Payment</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Add Extra Service</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Change Room</button>
           <button onClick={() => router.push(\`/dashboard/checkout\`)} className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50">Check-out</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Print Invoice</button>
         </>
      )}
      {res.status === "CHECKED_OUT" && (
         <>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Print Invoice</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Payment/History</button>
         </>
      )}
      {(res.status !== "CHECKED_IN" && res.status !== "CHECKED_OUT") && (
         <button onClick={() => setDeleteModalRes(res)} className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1">Delete Reservation</button>
      )}
    </div>
  )}`
);

fs.writeFileSync('src/app/dashboard/reservations/page.tsx', c);
console.log('Update successful');
