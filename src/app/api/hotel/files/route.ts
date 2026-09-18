import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/authContext';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const name = searchParams.get('name');

    if (!type || !name) {
      return NextResponse.json({ error: 'Missing type or name' }, { status: 400 });
    }

    if (!['id', 'photo'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Securely resolve path and prevent directory traversal
    const safeName = path.basename(name);
    const uploadDir = path.join(process.cwd(), 'uploads', 'private', type === 'id' ? 'id-documents' : 'guest-photos');
    const filepath = path.join(uploadDir, safeName);

    try {
      const fileBuffer = await fs.readFile(filepath);
      const ext = path.extname(safeName).toLowerCase();
      
      let contentType = 'application/octet-stream';
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.pdf') contentType = 'application/pdf';

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=86400', // Cache for 24 hours in the browser
        },
      });
    } catch (e) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('File Read Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
