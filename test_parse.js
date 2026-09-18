const fs = require('fs');
const babel = require('@babel/core');
const content = fs.readFileSync('src/app/components/RoomDashboard.tsx', 'utf8');

try {
  babel.transformSync(content, {
    presets: ['@babel/preset-typescript', '@babel/preset-react'],
    filename: 'RoomDashboard.tsx'
  });
  console.log('Successfully parsed JSX!');
} catch (e) {
  console.error(e.message);
}
