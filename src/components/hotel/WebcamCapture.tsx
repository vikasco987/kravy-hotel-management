'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (file: File, dataUrl: string) => void;
  onCancel: () => void;
  title?: string;
}

export default function WebcamCapture({ onCapture, onCancel, title = "Capture Photo" }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

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
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const savePhoto = () => {
    if (capturedImage) {
      // Convert Base64 back to File
      const byteString = atob(capturedImage.split(',')[1]);
      const mimeString = capturedImage.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: mimeString });
      
      onCapture(file, capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-2xl flex flex-col">
        
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Camera size={20} /> {title}
          </h3>
          <button onClick={() => { stopCamera(); onCancel(); }} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="relative bg-black flex-1 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
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

        <div className="bg-gray-100 p-4 flex justify-center gap-4 shrink-0">
          {!capturedImage && !error && (
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
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition"
              >
                <RefreshCw size={20} /> Retake
              </button>
              <button 
                onClick={savePhoto}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
              >
                <Check size={20} /> Save Photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
