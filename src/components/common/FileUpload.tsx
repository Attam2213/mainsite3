import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

interface FileUploadProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  label = "Upload File", 
  value, 
  onChange, 
  accept = "image/*",
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onChange(data.url);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      
      {!value ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed border-gray-300 rounded-lg p-4 
            flex flex-col items-center justify-center cursor-pointer 
            hover:border-indigo-500 hover:bg-indigo-50 transition-colors
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
          ) : (
            <Upload className="h-6 w-6 text-gray-400 mb-2" />
          )}
          <span className="text-xs text-gray-500 font-medium">
            {uploading ? 'Uploading...' : 'Click to upload'}
          </span>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept={accept} 
            onChange={handleFileChange} 
          />
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 group bg-gray-50">
          <div className="aspect-w-16 aspect-h-9 h-32 w-full flex items-center justify-center overflow-hidden">
             {/* If it's an image, show preview, otherwise show generic icon */}
             <img 
               src={value} 
               alt="Preview" 
               className="object-contain max-h-full max-w-full"
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
               }} 
             />
             {/* Fallback for non-images or broken links could be handled better, but simpler for now */}
          </div>
          
          <div className="absolute top-1 right-1 flex space-x-1">
             <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/90 text-gray-700 p-1.5 rounded-full shadow-sm hover:bg-white transition-colors"
              title="Change image"
            >
              <Upload className="h-3 w-3" />
            </button>
            <button
              onClick={handleClear}
              className="bg-red-500/90 text-white p-1.5 rounded-full shadow-sm hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept={accept} 
            onChange={handleFileChange} 
          />
        </div>
      )}
    </div>
  );
};
