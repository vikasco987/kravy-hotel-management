import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/authContext';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  console.log("=== API: File Upload Requested ===");
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user) {
      console.log("Upload Error: Unauthorized");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'id' or 'photo'
    
    console.log(`Upload Request details: Type = ${type}, File Name = ${file?.name}, File Size = ${file?.size} bytes`);

    if (!file) {
      console.log("Upload Error: No file uploaded");
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!['id', 'photo'].includes(type)) {
      console.log("Upload Error: Invalid upload type");
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Starting Cloudinary upload for ${type}...`);

    // Upload to cloudinary
    const fileReference = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: type === 'id' ? 'kravy-hotel/id-documents' : 'kravy-hotel/guest-photos' },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            reject(error);
          } else {
            console.log(`Cloudinary Upload Success: ${result!.secure_url}`);
            resolve(result!.secure_url);
          }
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ success: true, fileReference });
  } catch (error) {
    console.error('General Upload Error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
