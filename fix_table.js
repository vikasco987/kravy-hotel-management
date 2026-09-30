const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/checkout/page.tsx', 'utf-8');

const start_str = '                           {data.linkedRooms.map((r: any, idx: number) => (';
const end_str = '                           ))}';
const start_idx = content.indexOf(start_str);
const end_idx = content.indexOf(end_str, start_idx);

const new_block = \                           {(() => {
                              let rowCounter = 0;
                              return data.linkedRooms.map((r: any) => {
                                 let guestsList: any[] = [];
                                 try {
                                    if (r.guestsData && typeof r.guestsData === 'string') {
                                       guestsList = JSON.parse(r.guestsData);
                                    } else if (r.guestsData && Array.isArray(r.guestsData)) {
                                       guestsList = r.guestsData;
                                    }
                                 } catch (e) {
                                    console.error("Failed to parse guestsData", e);
                                 }

                                 if (guestsList.length === 0) {
                                    guestsList = [{
                                       name: data.leadGuest?.name,
                                       phone: data.leadGuest?.phone,
                                       isLead: true
                                    }];
                                 }

                                 return guestsList.map((guest: any, gIdx: number) => {
                                    rowCounter++;
                                    const isLead = guest.isLead || gIdx === 0;
                                    
                                    let photoIdText = "None";
                                    const hasPhoto = !!guest.photoUrl;
                                    const hasId = !!(guest.idUrl || (guest.idUrls && guest.idUrls.length > 0) || (guest.idDocuments && guest.idDocuments.length > 0) || guest.idNumber);

                                    if (hasPhoto && hasId) {
                                       photoIdText = "?? Photo & ID";
                                    } else if (hasPhoto) {
                                       photoIdText = "?? 1 Photo";
                                    } else if (hasId) {
                                       photoIdText = "?? ID Proof";
                                    }

                                    return (
                                       <tr key={\\\\-\\\\} className="hover:bg-gray-50">
                                          <td className="px-3 py-2">{\rowCounter}</td>
                                          <td className="px-3 py-2 font-bold text-teal-700 flex items-center gap-1"><BedDouble size={10}/> {r.roomNumber}</td>
                                          <td className="px-3 py-2 font-black text-gray-900">{guest.name || 'Unnamed Guest'}</td>
                                          <td className="px-3 py-2 text-gray-600">{guest.phone || 'N/A'}</td>
                                          <td className="px-3 py-2 font-bold text-gray-700">{photoIdText}</td>
                                          <td className={\\\px-3 py-2 font-bold \\\\}>{isLead ? 'Guest 1 (Lead)' : \\\Guest \\\\}</td>
                                       </tr>
                                    );
                                 });
                              });
                           })()}\;

if (start_idx !== -1 && end_idx !== -1) {
    content = content.substring(0, start_idx) + new_block + content.substring(end_idx + end_str.length);
    fs.writeFileSync('src/app/dashboard/checkout/page.tsx', content, 'utf-8');
    console.log("Success");
} else {
    console.log("Failed to find boundaries");
}
