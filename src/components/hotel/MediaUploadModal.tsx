'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle, UploadCloud, File as FileIcon, Plus } from 'lucide-react';

export interface UploadedDocument {
  file?: File;
  dataUrl?: string;
  idNumber?: string;
}

interface MediaUploadModalProps {
  onCapture: (documents: UploadedDocument[]) => void;
  onCancel: () => void;
  title?: string;
  defaultMode?: 'camera' | 'upload';
  showIdNumberField?: boolean;
  initialDocuments?: UploadedDocument[];
  allowMultiple?: boolean;
}

export default function MediaUploadModal({ 
  onCapture, 
  onCancel, 
  title = "Upload Media", 
  defaultMode = 'camera', 
  showIdNumberField = false,
  initialDocuments = [],
  allowMultiple = false
}: MediaUploadModalProps) {
  const [mode, setMode] = useState<'camera' | 'upload'>(defaultMode);
  
  // State for the CURRENT document being added
  const [idNumber, setIdNumber] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // State for the LIST of documents
  const [documents, setDocuments] = useState<UploadedDocument[]>(initialDocuments);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (mode === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, capturedImage]);

  const startCamera = async () => {
    setError(null);
    try {
      if (stream) stopCamera();
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Camera access denied or not available.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const byteString = atob(dataUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: mimeString });
        setSelectedFile(file);
        
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setSelectedFile(null);
    setIdNumber("");
    if (mode === 'camera') {
      startCamera();
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const addDocumentToList = () => {
    // Only allow adding if there is a file OR an ID number
    if (selectedFile || idNumber.trim()) {
      const newDoc: UploadedDocument = {
        file: selectedFile || undefined,
        dataUrl: capturedImage || undefined,
        idNumber: idNumber.trim() || undefined
      };
      
      if (allowMultiple) {
        setDocuments(prev => [...prev, newDoc]);
        // Reset current selection for the next one
        retakePhoto();
      } else {
        // If not multiple, just overwrite and finish immediately
        onCapture([newDoc]);
      }
    }
  };
  
  const removeDocumentFromList = (index: number) => {
     setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const saveAll = () => {
    // If they have something typed but not added, optionally add it, or just ignore.
    // Let's just return the documents array.
    onCapture(documents);
  };
  
  // Can add to list if there is a file selected OR if they typed an ID number.
  const canAddToList = !!selectedFile || idNumber.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-2xl flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            {mode === 'camera' ? <Camera size={20} /> : <UploadCloud size={20} />} {title}
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={() => { setMode('camera'); retakePhoto(); }} className={`px-3 py-1 rounded text-sm font-bold ${mode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              Camera
            </button>
            <button onClick={() => { setMode('upload'); retakePhoto(); }} className={`px-3 py-1 rounded text-sm font-bold ${mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              File Upload
            </button>
            <button onClick={() => { stopCamera(); onCancel(); }} className="ml-4 text-gray-400 hover:text-white transition">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="relative bg-gray-50 flex-1 flex flex-col min-h-[250px] md:min-h-[350px]">
          {mode === 'camera' ? (
            <div className="flex-1 bg-black flex items-center justify-center relative">
              {error ? (
                <div className="text-red-400 flex flex-col items-center gap-3 p-6 text-center">
                  <AlertCircle size={48} />
                  <p className="font-medium">{error}</p>
                  <button onClick={startCamera} className="mt-4 px-4 py-2 bg-white text-black font-bold rounded">
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {!capturedImage ? (
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-contain" />
                  ) : (
                    <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-contain" />
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </>
              )}
            </div>
          ) : (
            <div 
              className={`flex-1 flex flex-col items-center justify-center p-4 transition-colors ${isDragging ? 'bg-blue-50 border-4 border-dashed border-blue-400' : 'bg-gray-50 border-4 border-dashed border-gray-300'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !capturedImage && fileInputRef.current?.click()}
            >
              {!capturedImage ? (
                <div className="flex flex-col items-center text-center cursor-pointer w-full h-full justify-center">
                  <UploadCloud size={64} className={`${isDragging ? 'text-blue-500' : 'text-gray-400'} mb-4`} />
                  <h4 className="text-lg font-bold text-gray-700 mb-2">Drag & Drop your file here</h4>
                  <p className="text-gray-500 mb-6 text-sm">or click to browse from your device</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm">
                    Select File
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} />
                </div>
              ) : (
                <div className="relative w-full h-full flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden shadow-inner">
                  {selectedFile?.type.includes('pdf') ? (
                    <div className="flex flex-col items-center text-white">
                      <FileIcon size={64} className="mb-4" />
                      <span className="font-bold text-sm">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <img src={capturedImage} alt="Selected" className="absolute inset-0 w-full h-full object-contain" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Panel for Current Document */}
        {showIdNumberField && (
          <div className="bg-white px-6 pt-4 shrink-0">
             <label className="block text-sm font-bold text-gray-700 mb-1">ID Number (Optional)</label>
             <div className="flex gap-2">
                 <input 
                    type="text" 
                    value={idNumber} 
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. Aadhar / PAN / Passport Number"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                 />
                 {allowMultiple && (
                     <button 
                       disabled={!canAddToList}
                       onClick={addDocumentToList}
                       className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition"
                     >
                       <Plus size={18} /> Add to List
                     </button>
                 )}
             </div>
             {allowMultiple && (
                 <p className="text-xs text-gray-500 mt-2">
                   You can add just an ID number without uploading a file, or upload a file without an ID number.
                 </p>
             )}
          </div>
        )}

        {/* Capture/Retake Actions (Single Mode or Current Doc in Multi Mode) */}
        <div className="bg-white border-b border-gray-200 p-4 flex justify-center gap-4 shrink-0">
          {mode === 'camera' && !capturedImage && !error && (
            <button onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105 active:scale-95" aria-label="Capture">
              <Camera size={32} />
            </button>
          )}

          {capturedImage && (
            <>
              <button onClick={retakePhoto} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 border border-gray-300 transition">
                <RefreshCw size={16} /> {mode === 'camera' ? 'Retake' : 'Choose Different File'}
              </button>
              
              {!allowMultiple && (
                 <button onClick={addDocumentToList} disabled={!canAddToList} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105">
                   <Check size={16} /> {mode === 'camera' ? 'Save Photo' : 'Upload File'}
                 </button>
              )}
            </>
          )}
        </div>

        {/* Multi-Document Preview Grid & Final Save */}
        {allowMultiple && (
          <div className="bg-gray-100 p-4 shrink-0 max-h-[30vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-3">
                 <h4 className="font-bold text-gray-800 text-sm">Added Documents ({documents.length})</h4>
                 <button 
                    onClick={saveAll}
                    disabled={documents.length === 0}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md transition"
                 >
                    <Check size={16} /> Save All & Close
                 </button>
             </div>
             
             {documents.length === 0 ? (
                 <div className="text-center text-sm text-gray-500 py-4 bg-white rounded-lg border border-dashed border-gray-300">
                    No documents added yet. Add an ID number or capture an image above.
                 </div>
             ) : (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {documents.map((doc, idx) => (
                       <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col relative group">
                          <button onClick={() => removeDocumentFromList(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow">
                             <X size={12} />
                          </button>
                          
                          <div className="h-20 bg-gray-200 flex items-center justify-center">
                             {doc.dataUrl ? (
                                <img src={doc.dataUrl} className="w-full h-full object-cover" alt="preview" />
                             ) : (
                                <FileIcon size={24} className="text-gray-400" />
                             )}
                          </div>
                          
                          <div className="p-2 bg-gray-50 border-t border-gray-200 flex-1 flex items-center justify-center">
                             <span className="text-xs font-bold text-gray-700 text-center truncate">
                                {doc.idNumber || "No ID Number"}
                             </span>
                          </div>
                       </div>
                    ))}
                 </div>
             )}
          </div>
        )}

      </div>
    </div>
  );
}
