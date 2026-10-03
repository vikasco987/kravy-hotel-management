const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/checkout/page.tsx', 'utf-8');

// Add states for Create Service if not present
if (!content.includes('const [isCreateServiceOpen')) {
  content = content.replace(
      '  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);',
      '  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);\n  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);\n  const [csName, setCsName] = useState("");\n  const [csPrice, setCsPrice] = useState("");\n  const [csDescription, setCsDescription] = useState("");\n  const [csIsActive, setCsIsActive] = useState(true);\n  const [csError, setCsError] = useState("");\n  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);'
  );
}

// Replace the Extra Services buttons row with Add Service button
// Need to find the exact string to replace. I will use a regex.
content = content.replace(
    /\{availableServices\.map\(\(s: any\) => \([\s\S]*?<\/button>\s*\)\)\}/,
    '<button onClick={() => setIsServicesModalOpen(true)} className="bg-white border border-gray-200 hover:bg-gray-50 text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1"><Plus size={10}/> Add Service</button>'
);

// Replace quantity column
content = content.replace(
    /<td className=\"px-3 py-2 text-center font-bold\">\{c\.quantity\}<\/td>/,
    '<td className="px-3 py-2 text-center font-bold"><div className="flex items-center justify-center gap-2">{c.type === \'EXTRA_SERVICE\' && <button onClick={() => handleAddCheckoutService(c.description, c.amount, c.quantity - 1, c.type)} disabled={isAddingService || c.quantity <= 1} className="bg-slate-100 hover:bg-slate-200 w-5 h-5 rounded flex items-center justify-center disabled:opacity-50">-</button>}<span>{c.quantity}</span>{c.type === \'EXTRA_SERVICE\' && <button onClick={() => handleAddCheckoutService(c.description, c.amount, c.quantity + 1, c.type)} disabled={isAddingService} className="bg-slate-100 hover:bg-slate-200 w-5 h-5 rounded flex items-center justify-center disabled:opacity-50">+</button>}</div></td>'
);

// Add the Modals to the end of the file before the final closing tag
if (!content.includes('Select Extra Service')) {
  const modalJSX = `
      {isServicesModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-100">
               <h3 className="text-[14px] font-bold text-slate-800">Select Extra Service</h3>
               <button onClick={() => setIsServicesModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1 transition-colors">
                  <X size={16} />
               </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
               {availableServices.length === 0 ? (
                  <div className="text-center text-[13px] text-slate-500 py-10 px-4">
                     <p className="font-semibold text-slate-700">No extra services available yet.</p>
                     <p className="mt-1 mb-5">Create your first service to add it to this check-out.</p>
                     <button 
                       onClick={openCreateService}
                       className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-teal-700 shadow-md transition-colors"
                     >
                       <Plus size={16} /> Create Service
                     </button>
                  </div>
               ) : (
                  <div className="space-y-2">
                     {availableServices.map((service: any) => {
                        return (
                           <div key={service.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-all group">
                              <div className="flex-1 cursor-pointer" onClick={() => {
                                    handleAddCheckoutService(service.name, service.price, 1);
                              }}>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-bold text-slate-800 group-hover:text-teal-800">{service.name}</span>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); openEditService(service); }}
                                      className="text-blue-500 hover:text-blue-700 text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                                    >
                                      Edit
                                    </button>
                                 </div>
                                 <div className="text-[11px] text-slate-500 font-medium">₹{(service.price / 100).toFixed(2)}</div>
                                 {service.description && (
                                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{service.description}</div>
                                 )}
                              </div>
                              <button 
                                disabled={isAddingService}
                                onClick={() => handleAddCheckoutService(service.name, service.price, 1)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ml-3 shrink-0 bg-teal-100 text-teal-700 hover:bg-teal-600 hover:text-white disabled:opacity-50"
                              >
                                 Add
                              </button>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
            {availableServices.length > 0 && (
               <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                  <button onClick={openCreateService} className="text-[12px] font-bold text-teal-600 hover:text-teal-800 flex items-center justify-center gap-1 w-full p-2 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors">
                     <Plus size={14} /> Create New Service
                  </button>
               </div>
            )}
          </div>
        </div>
      )}

      {isCreateServiceOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-[15px] font-bold text-slate-800">
                {editingServiceId ? 'Edit Service' : 'Create New Service'}
              </h2>
              <button onClick={() => { setIsCreateServiceOpen(false); setIsServicesModalOpen(true); }} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrEditService} className="p-5 space-y-4">
              {csError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold border border-red-100">
                  {csError}
                </div>
              )}
              
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Service Name *</label>
                <input 
                  required
                  value={csName}
                  onChange={e => setCsName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="e.g. Breakfast, Laundry"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Price (₹) *</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={csPrice}
                  onChange={e => setCsPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="e.g. 300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Description (Optional)</label>
                <textarea 
                  value={csDescription}
                  onChange={e => setCsDescription(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none h-20"
                  placeholder="Brief description about the service"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="csIsActive"
                    checked={csIsActive}
                    onChange={e => setCsIsActive(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <label htmlFor="csIsActive" className="text-[12px] font-bold text-slate-700 cursor-pointer">
                    Service is Active
                  </label>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => { setIsCreateServiceOpen(false); setIsServicesModalOpen(true); }} className="flex-1 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors">
                  {editingServiceId ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
`;
  content = content.replace(/\s*<\/div>\s*\)\s*;\s*}\s*export default function CheckoutPage\(\) \{\s*return \(\s*<Suspense[\s\S]*$/, modalJSX);
}

fs.writeFileSync('src/app/dashboard/checkout/page.tsx', content, 'utf-8');
console.log('Done');
