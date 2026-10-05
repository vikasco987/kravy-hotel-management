const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/reservations/wizard/page.tsx', 'utf8');

c = c.replace(
  /className="w-full border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"/g,
  'className="w-full border-gray-300 text-gray-900 font-bold rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:font-medium placeholder:text-gray-400"'
);

c = c.replace(
  /className="w-full border-gray-300 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"/g,
  'className="w-full border-gray-300 text-gray-900 font-bold rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:font-medium placeholder:text-gray-400"'
);

fs.writeFileSync('src/app/dashboard/reservations/wizard/page.tsx', c);
