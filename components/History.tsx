import React from 'react';
import DownloadIcon from './icons/DownloadIcon';

interface HistoryProps {
  history: string[];
  onImageSelect: (image: string) => void;
}

const History: React.FC<HistoryProps> = ({ history, onImageSelect }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-center mb-6 text-green-400">سجل الصور</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {history.map((imageSrc, index) => (
          <div key={index} className="relative group aspect-square bg-gray-900 rounded-lg overflow-hidden border-2 border-transparent hover:border-green-500 transition-all duration-300">
            <img 
              src={imageSrc} 
              alt={`Generated image ${index + 1}`} 
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onImageSelect(imageSrc)}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center p-2">
              <span className="text-white text-center text-sm font-semibold">عرض أو تعديل</span>
            </div>
            <a
              href={imageSrc}
              download={`generated_image_${index + 1}.png`}
              className="absolute bottom-2 right-2 bg-green-600/80 hover:bg-green-500 text-black p-2 rounded-full transition-all duration-200"
              aria-label="Download image"
              onClick={(e) => e.stopPropagation()}
            >
              <DownloadIcon />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;