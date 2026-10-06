const fs = require('fs');
const path = 'C:/studio/kravy-hotel-management/src/app/dashboard/book/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// I'll search for '  };\r\n\r\n  return (\r\n    <div className="bg-[#f0f4f8]' or '  };\n\n  return (\n    <div className="bg-[#f0f4f8]'
const target1 = '  };\r\n\r\n  return (\r\n    <div className="bg-[#f0f4f8]';
const target2 = '  };\n\n  return (\n    <div className="bg-[#f0f4f8]';
let target = content.includes(target1) ? target1 : (content.includes(target2) ? target2 : null);

if (target) {
    const isCrLf = target === target1;
    const replacement = `  };${isCrLf ? '\r\n\r\n' : '\n\n'}  const showSelection = !resIdParam && !roomsParam && !isFetching;${isCrLf ? '\r\n\r\n' : '\n\n'}  if (showSelection) {${isCrLf ? '\r\n' : '\n'}     return <AvailableRoomSelection initialRooms={rooms} onComplete={(ids) => { setRooms(ids); router.push('/dashboard/book?rooms=' + ids.join(',')); }} />;${isCrLf ? '\r\n' : '\n'}  }${isCrLf ? '\r\n\r\n' : '\n\n'}  return (${isCrLf ? '\r\n' : '\n'}    <div className="bg-[#f0f4f8]`;
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Successfully injected showSelection branch');
} else {
    console.log('Target not found!');
}
