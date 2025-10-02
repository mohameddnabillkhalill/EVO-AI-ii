import React, { useState, useRef, useCallback } from 'react';
import UploadIcon from './icons/UploadIcon';
import CloseIcon from './icons/CloseIcon';

interface ImageUploaderProps {
  id: string;
  label: string;
  onFileSelect: (file: File | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, onFileSelect }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onFileSelect(file);
    }
  };

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl, onFileSelect]);
  
  return (
    <div className="w-full">
      <label htmlFor={id} className="cursor-pointer group">
        <div className="relative w-full aspect-square bg-gray-900 border-2 border-dashed border-gray-700 rounded-xl flex flex-col justify-center items-center text-gray-400 group-hover:border-green-500 group-hover:text-green-400 transition-all duration-300 overflow-hidden">
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button onClick={handleClear} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-red-600 transition-colors duration-200 z-10" aria-label="Remove image">
                  <CloseIcon />
              </button>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center">
                <span className="text-white text-lg font-bold">تغيير الصورة</span>
              </div>
            </>
          ) : (
            <>
              <UploadIcon />
              <span className="mt-4 text-xl font-semibold">{label}</span>
              <p className="text-sm">اسحب وأفلت أو انقر للرفع</p>
            </>
          )}
        </div>
      </label>
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUploader;