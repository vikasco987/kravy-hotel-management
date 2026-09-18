'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle, UploadCloud, File as FileIcon } from 'lucide-react';

interface MediaUploadModalProps {
  onCapture: (file: File, dataUrl: string) => void;
  onCancel: () => void;
  title?: string;
  defaultMode?: 'camera' | 'upload';
}

export default function MediaUploadModal({ onCapture, onCancel, title = "Upload Media", defaultMode = 'camera' }: MediaUploadModalProps) {
  const [mode, setMode] = useState<'camera' | 'upload'>(defaultMode);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode]);

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError("Camera permission denied. Please allow camera access in your browser.");
      } else if (err.name === 'NotFoundError') {
        setError("No camera found on this device.");
      } else {
        setError("Unable to access camera: " + err.message);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
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
        
        // Convert to file
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
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
    if (mode === 'camera') {
      startCamera();
    }
  };

  const savePhoto = () => {
    if (selectedFile && capturedImage) {
      onCapture(selectedFile, capturedImage);
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-2xl flex flex-col">
        
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            {mode === 'camera' ? <Camera size={20} /> : <UploadCloud size={20} />} {title}
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setMode('camera'); retakePhoto(); }} 
              className={`px-3 py-1 rounded text-sm font-bold ${mode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              Camera
            </button>
            <button 
              onClick={() => { setMode('upload'); retakePhoto(); }} 
              className={`px-3 py-1 rounded text-sm font-bold ${mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              File Upload
            </button>
            <button onClick={() => { stopCamera(); onCancel(); }} className="ml-4 text-gray-400 hover:text-white transition">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="relative bg-gray-50 flex-1 flex flex-col min-h-[300px] md:min-h-[400px]">
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
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <img 
                      src={capturedImage} 
                      alt="Captured" 
                      className="absolute inset-0 w-full h-full object-contain" 
                    />
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </>
              )}
            </div>
          ) : (
            <div 
              className={`flex-1 flex flex-col items-center justify-center p-8 transition-colors ${isDragging ? 'bg-blue-50 border-4 border-dashed border-blue-400' : 'bg-gray-50 border-4 border-dashed border-gray-300'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !capturedImage && fileInputRef.current?.click()}
            >
              {!capturedImage ? (
                <div className="flex flex-col items-center text-center cursor-pointer w-full h-full justify-center">
                  <UploadCloud size={64} className={`${isDragging ? 'text-blue-500' : 'text-gray-400'} mb-4`} />
                  <h4 className="text-xl font-bold text-gray-700 mb-2">Drag & Drop your file here</h4>
                  <p className="text-gray-500 mb-6">or click to browse from your device</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold">
                    Select File
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,application/pdf" 
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  />
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  {selectedFile?.type.includes('pdf') ? (
                    <div className="flex flex-col items-center text-white">
                      <FileIcon size={64} className="mb-4" />
                      <span className="font-bold">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <img src={capturedImage} alt="Selected" className="absolute inset-0 w-full h-full object-contain" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border-t border-gray-200 p-4 flex justify-center gap-4 shrink-0">
          {mode === 'camera' && !capturedImage && !error && (
            <button 
              onClick={capturePhoto}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label="Capture"
            >
              <Camera size={32} />
            </button>
          )}

          {capturedImage && (
            <>
              <button 
                onClick={retakePhoto}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-bold flex items-center gap-2 border border-gray-300 transition"
              >
                <RefreshCw size={20} /> {mode === 'camera' ? 'Retake' : 'Choose Different File'}
              </button>
              <button 
                onClick={savePhoto}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
              >
                <Check size={20} /> {mode === 'camera' ? 'Save Photo' : 'Upload File'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
