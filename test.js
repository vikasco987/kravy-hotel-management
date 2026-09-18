const fs = require('fs');
const content = fs.readFileSync('src/app/components/RoomDashboard.tsx', 'utf8');

// A very naive JSX tag counter for RoomDashboard return block
const start = content.indexOf('return (');
const end = content.indexOf('// Subcomponents');

let block = content.substring(start, end);
let openDivs = (block.match(/<div[^>]*>/g) || []).length;
let closeDivs = (block.match(/<\/div>/g) || []).length;

console.log('Open divs:', openDivs);
console.log('Close divs:', closeDivs);
