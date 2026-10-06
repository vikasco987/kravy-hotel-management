const fs = require('fs');
const path = 'C:/studio/kravy-hotel-management/src/app/dashboard/checkout/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /if \(!roomId\) \{\s*setError\('No room ID provided'\);\s*setIsLoading\(false\);\s*return;\s*\}/,
  "if (!roomId) { return; }\n\n    setIsLoading(true);\n    setError('');"
);

fs.writeFileSync(path, content);
console.log("Updated useEffect");
