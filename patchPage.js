const fs = require('fs');
const path = 'C:/studio/kravy-hotel-management/src/app/dashboard/reservations/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { useRouter } from 'next/navigation';",
  "import { useRouter } from 'next/navigation';\nimport { ReservationDetailsDrawer } from './ReservationDetailsDrawer';"
);

content = content.replace(
  "const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);",
  "const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);\n  const [detailsReservationId, setDetailsReservationId] = useState<string | null>(null);"
);

content = content.replace(
  /<button onClick=\{\(\) => router.push\(\`\/dashboard\/reservations\/\$\{res\.id\}\`\)\}/g,
  "<button onClick={() => setDetailsReservationId(res.id)}"
);

// Add the drawer at the end of <main>
content = content.replace(
  '</main>',
  '</main>\n\n      {detailsReservationId && (\n        <ReservationDetailsDrawer\n          reservationId={detailsReservationId}\n          onClose={() => setDetailsReservationId(null)}\n        />\n      )}'
);

fs.writeFileSync(path, content);
console.log('Updated page.tsx');
