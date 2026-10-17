export async function uploadToCloudinary(file: File) {
  if (!file) {
    throw new Error("No file provided for upload.");
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary is not configured. Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET environment variable."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    let errorDetail = "";
    try {
      const errData = await res.json();
      if (errData?.error?.message) {
        errorDetail = `: ${errData.error.message}`;
      }
    } catch {
      errorDetail = ` (${res.status} ${res.statusText})`;
    }
    throw new Error(`Cloudinary upload failed${errorDetail}`);
  }

  const data = await res.json();
  if (!data?.secure_url) {
    throw new Error("Cloudinary response did not return a secure URL.");
  }

  return data.secure_url as string;
}
