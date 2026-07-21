import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Loader2, Check, AlertCircle } from "lucide-react";

interface ImageUploaderProps {
  id: string;
  onUploadComplete: (url: string) => void;
  placeholder?: string;
  label?: string;
  multiple?: boolean;
  onMultipleUploadsComplete?: (urls: string[]) => void;
}

// Client-side image compressor to produce compact, fast-loading Base64 strings (typically ~50-150KB)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string); // Fallback to raw base64 if canvas fail
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress as JPEG at 0.7 quality to keep payload small and extremely fast to load/save
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(compressedDataUrl);
        } catch (e) {
          // Fallback to original Base64 if compression fails
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export function ImageUploader({ id, onUploadComplete, placeholder = "Upload an image file...", label, multiple, onMultipleUploadsComplete }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (multiple && onMultipleUploadsComplete) {
        uploadMultipleFiles(Array.from(e.dataTransfer.files));
      } else if (e.dataTransfer.files[0]) {
        uploadFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (multiple && onMultipleUploadsComplete) {
        uploadMultipleFiles(Array.from(e.target.files));
      } else if (e.target.files[0]) {
        uploadFile(e.target.files[0]);
      }
    }
  };

  const uploadMultipleFiles = async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      setError("Please select at least one image file.");
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      const urls: string[] = [];
      const step = 80 / imageFiles.length;
      for (let i = 0; i < imageFiles.length; i++) {
        const compressed = await compressImage(imageFiles[i]);
        urls.push(compressed);
        setProgress(Math.min(95, 10 + Math.round((i + 1) * step)));
      }
      setProgress(100);

      setTimeout(() => {
        setUploadedUrl(urls[0]); // Preview the first uploaded image
        onMultipleUploadsComplete?.(urls);
        setUploading(false);
      }, 300);

    } catch (err: any) {
      console.error("Compression error:", err);
      setError(`Failed to process images: ${err.message || "Unknown error"}`);
      setUploading(false);
    }
  };

  const uploadFile = async (file: File) => {
    // Basic file validation
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(20);

    try {
      // Simulate quick processing and complete compression instantly
      setProgress(50);
      const compressedBase64 = await compressImage(file);
      setProgress(90);
      
      // Delay slightly so the user feels the tactile feedback of the upload
      setTimeout(() => {
        setUploadedUrl(compressedBase64);
        onUploadComplete(compressedBase64);
        setUploading(false);
        setProgress(100);
      }, 300);

    } catch (err: any) {
      console.error("Compression error:", err);
      setError(`Failed to process image: ${err.message || "Unknown error"}`);
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-mono font-bold uppercase mb-1">{label}</label>}
      <div
        id={id}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`border-2 border-dashed border-black p-4 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[110px] bg-white relative ${
          dragActive ? "border-emerald-500 bg-emerald-50" : "hover:bg-neutral-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center space-y-2 text-center pointer-events-none">
            <Loader2 className="w-6 h-6 animate-spin text-black" />
            <span className="font-mono text-xs uppercase font-bold text-black">Optimizing Image...</span>
            <div className="w-32 bg-neutral-200 h-2 border border-black overflow-hidden">
              <div className="bg-black h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        ) : uploadedUrl ? (
          <div className="flex flex-col items-center space-y-1 text-center pointer-events-none">
            <Check className="w-6 h-6 text-emerald-600" />
            <span className="font-mono text-[10px] uppercase font-bold text-emerald-600">Image Loaded successfully!</span>
            <span className="font-mono text-[9px] text-neutral-400 max-w-[200px] truncate">Ready to submit</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-1.5 text-center pointer-events-none">
            <UploadCloud className="w-6 h-6 text-neutral-500" />
            <span className="font-mono text-[11px] uppercase font-bold text-black">
              {dragActive ? "Drop file to load" : "Drag & drop image or Click to browse"}
            </span>
            <span className="font-mono text-[9px] text-neutral-400">PNG, JPG, GIF with instant client-side optimization</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-1.5 text-red-600 bg-red-50 p-2 border border-red-200 text-[10px] font-mono uppercase">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
