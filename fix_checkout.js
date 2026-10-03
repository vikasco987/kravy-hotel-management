const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/checkout/page.tsx', 'utf-8');

// 1. Add fetchServices to useEffect on mount
if (!content.includes('const fetchServices = async ()')) {
  content = content.replace(
    'const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);',
    `const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const fetchServices = async () => {
    try {
      const res = await fetch('/api/hotel/services', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) setAvailableServices(data.filter((s: any) => s.isActive));
    } catch (err) {
      console.error(err);
    }
  };
  
  useEffect(() => {
    fetchServices();
  }, []);`
  );
}

// 2. Add type="button" and stopPropagation
content = content.replace(
  '<button onClick={() => setIsServicesModalOpen(true)} className="bg-white border border-gray-200 hover:bg-gray-50 text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1"><Plus size={10}/> Add Service</button>',
  '<button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsServicesModalOpen(true); }} className="bg-white border border-gray-200 hover:bg-gray-50 text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1"><Plus size={10}/> Add Service</button>'
);
content = content.replace(
  '<button className="bg-teal-700 hover:bg-[#091a42] text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1 ml-auto"><Plus size={10}/> Add Custom Service / Charge</button>',
  '<button type="button" className="bg-teal-700 hover:bg-[#091a42] text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1 ml-auto"><Plus size={10}/> Add Custom Service / Charge</button>'
);

// 3. Move the Modal JSX to be a sibling of the very top-level React element, or at least before the main return ends.
// Wait! Previously I saw:
// depth 1 {isServicesModalOpen && (
// That is FINE.

fs.writeFileSync('src/app/dashboard/checkout/page.tsx', content, 'utf-8');
console.log('Fixes applied.');
