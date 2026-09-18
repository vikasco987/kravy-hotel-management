import Tesseract from 'tesseract.js';

export interface OCRResult {
  name?: string;
  idNumber?: string;
  dob?: string;
  rawText: string;
}

export async function extractIdDetails(imageFileOrUrl: string | File): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(imageFileOrUrl, 'eng', {
      logger: m => console.log('OCR Progress:', m),
    });

    const text = result.data.text;
    
    // Very basic heuristics for Indian IDs (Aadhaar / PAN / DL).
    // Note: OCR accuracy varies heavily based on lighting and image quality.
    
    let name = '';
    let idNumber = '';
    let dob = '';

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // DOB Heuristic (e.g., DOB: 14/05/1990 or Year of Birth: 1990)
      if (line.match(/(DOB|Year of Birth|YOB|Date of Birth)[\s:]*([0-9\/-]+)/i)) {
        const match = line.match(/(DOB|Year of Birth|YOB|Date of Birth)[\s:]*([0-9\/-]+)/i);
        if (match && match[2]) dob = match[2];
      }

      // Aadhaar Heuristic (4-4-4 format)
      if (line.match(/[0-9]{4}\s[0-9]{4}\s[0-9]{4}/)) {
        const match = line.match(/[0-9]{4}\s[0-9]{4}\s[0-9]{4}/);
        if (match) idNumber = match[0];
      }
      
      // PAN Heuristic
      if (line.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/)) {
         const match = line.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
         if (match) idNumber = match[0];
      }
    }

    return {
      name, // Often too complex to reliably parse from OCR alone without bounding box logic
      idNumber,
      dob,
      rawText: text
    };
  } catch (err) {
    console.error('OCR Extraction Failed:', err);
    throw new Error('Failed to extract text from image');
  }
}
