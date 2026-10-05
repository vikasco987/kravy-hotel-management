const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/reservations/page.tsx', 'utf8');
c = c.replace(
  /default:\s*return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"><\/span> Pending<\/span>;/g,
  `case 'RESERVED':
          return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Reserved</span>;
        default:
          return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-100"><span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> {status}</span>;`
);
fs.writeFileSync('src/app/dashboard/reservations/page.tsx', c);
