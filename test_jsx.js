const fs = require('fs');
const babel = require('@babel/core');
try {
  babel.transformSync(fs.readFileSync('src/app/components/RoomDashboard.tsx', 'utf8'), {
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    filename: 'RoomDashboard.tsx'
  });
  print("Success");
} catch (e) {
  console.log(e.message);
}
