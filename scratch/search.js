const fs = require('fs');
const path = require('path');

function searchFiles(dir, query) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchFiles(fullPath, query);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.toLowerCase().includes(query.toLowerCase())) {
                console.log('FOUND IN:', fullPath);
                const lines = content.split('\n');
                lines.forEach((line, idx) => {
                    if (line.toLowerCase().includes(query.toLowerCase())) {
                        console.log(`Line ${idx + 1}: ${line.trim()}`);
                    }
                });
            }
        }
    }
}

searchFiles(path.join(__dirname, '../src'), 'Loading Checkout');
console.log('Search complete.');
