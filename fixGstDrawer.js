const fs = require('fs');

const file = 'C:/studio/kravy-hotel-management/src/app/dashboard/reservations/ReservationDetailsDrawer.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldVars = `  const taxAmount = stay?.invoice?.taxAmount || 0;
  const roomChargesSubtotal = stay?.invoice?.subtotal || reservation.totalAmount || 0;
  
  const extraServicesTotal = stay?.roomCharges?.reduce((acc: number, c: any) => acc + c.amount, 0) || 0;`;

const newVars = `  const activeRooms = stay?.stayRooms?.length ? stay.stayRooms : (reservation.rooms || []);
  
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalTax = 0;
  let totalRoomGross = 0;
  
  activeRooms.forEach((r: any) => {
    const rate = r.appliedRate || r.baseRate || 0;
    const n = Math.max(1, r.nights || (r.checkInDate && r.checkOutDate ? dayjs(r.checkOutDate).diff(dayjs(r.checkInDate), 'day') : 1));
    const gross = r.grossAmount || (rate * n);
    
    totalRoomGross += gross;
    totalTaxable += (r.taxableAmount || 0);
    totalCgst += (r.cgstAmount || 0);
    totalSgst += (r.sgstAmount || 0);
    totalTax += (r.taxAmount || 0);
  });

  const extraServicesTotal = stay?.roomCharges?.reduce((acc: number, c: any) => acc + (c.amount * (c.quantity || 1)), 0) || 0;
  const extraServicesTax = stay?.roomCharges?.reduce((acc: number, c: any) => acc + (c.taxAmount || 0), 0) || 0;

  totalTax += extraServicesTax;

  const taxAmount = stay?.invoice?.taxAmount || totalTax || 0;
  const taxableAmount = stay?.invoice?.taxableAmount || totalTaxable || 0;
  const cgstAmount = stay?.invoice?.cgstAmount || totalCgst || 0;
  const sgstAmount = stay?.invoice?.sgstAmount || totalSgst || 0;
  const taxMode = activeRooms[0]?.taxMode || '';
  const taxRate = activeRooms[0]?.taxRate || 0;
  
  const roomChargesSubtotal = stay?.invoice?.subtotal 
      ? Math.max(0, stay.invoice.subtotal - extraServicesTotal)
      : totalRoomGross;`;

code = code.replace(oldVars, newVars);

const oldGstTable = `<div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">%</span>
                    <h3 className="text-[13px] font-bold text-gray-900">Tax / GST Details</h3>
                  </div>
                  {taxAmount > 0 ? (
                    <div className="p-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-4">
                        <CheckCircle2 size={12} /> GST Applicable
                      </div>
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-100 bg-white">
                            <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                            <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          <tr className="bg-white">
                            <td className="py-2 text-xs font-medium text-gray-600">Total GST</td>
                            <td className="py-2 text-xs font-bold text-gray-900 text-right">₹{(taxAmount/100).toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>`;

const newGstTable = `<div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">%</span>
                    <h3 className="text-[13px] font-bold text-gray-900">Tax / GST Details</h3>
                  </div>
                  {taxAmount > 0 ? (
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle2 size={12} /> GST Applicable
                        </div>
                        {taxRate > 0 && <span className="text-xs font-bold text-gray-600 border border-gray-200 px-2 py-0.5 rounded">Rate: {taxRate / 100}%</span>}
                        {taxMode && <span className="text-[10px] font-bold text-gray-500 border border-gray-200 bg-gray-50 px-2 py-0.5 rounded uppercase">{taxMode}</span>}
                      </div>
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-100 bg-white">
                            <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                            <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {taxableAmount > 0 && (
                            <tr className="bg-white">
                              <td className="py-2 text-xs font-medium text-gray-600">Taxable Amount</td>
                              <td className="py-2 text-xs font-bold text-gray-900 text-right">₹{(taxableAmount/100).toLocaleString()}</td>
                            </tr>
                          )}
                          {cgstAmount > 0 && (
                            <tr className="bg-white">
                              <td className="py-2 text-xs font-medium text-gray-600">CGST</td>
                              <td className="py-2 text-xs font-bold text-gray-900 text-right">₹{(cgstAmount/100).toLocaleString()}</td>
                            </tr>
                          )}
                          {sgstAmount > 0 && (
                            <tr className="bg-white">
                              <td className="py-2 text-xs font-medium text-gray-600">SGST</td>
                              <td className="py-2 text-xs font-bold text-gray-900 text-right">₹{(sgstAmount/100).toLocaleString()}</td>
                            </tr>
                          )}
                          <tr className="bg-white">
                            <td className="py-2 text-xs font-bold text-gray-900">Total GST</td>
                            <td className="py-2 text-xs font-black text-gray-900 text-right">₹{(taxAmount/100).toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>`;

code = code.replace(oldGstTable, newGstTable);

fs.writeFileSync(file, code);
console.log('Fixed GST drawer mappings successfully!');
