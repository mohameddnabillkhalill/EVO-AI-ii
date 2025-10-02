import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import { generateProductImage, modifyGeneratedImage } from './services/geminiService';
import { toBase64 } from './utils/fileUtils';
import DownloadIcon from './components/icons/DownloadIcon';
import SpinnerIcon from './components/icons/SpinnerIcon';
import History from './components/History';
import Modal from './components/Modal';

const ASPECT_RATIOS = ['1:1', '4:5', '5:4', '3:2', '2:3', '2:1', '1:2'];

const App: React.FC = () => {
  const [designImage, setDesignImage] = useState<File | null>(null);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modificationPrompt, setModificationPrompt] = useState<string>('');
  const [isModificationModalOpen, setIsModificationModalOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('imageHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to parse history from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem('imageHistory', JSON.stringify(history));
    } catch(e) {
        console.error("Failed to save history to localStorage", e);
    }
  }, [history]);

  const canGenerate = designImage && productImage && logoImage && !isLoading;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    setIsLoading(true);
    setLoadingMessage('جاري الإنشاء...');
    setError(null);
    setGeneratedImage(null);
    setModificationPrompt('');

    try {
      const [designBase64, productBase64, logoBase64] = await Promise.all([
        toBase64(designImage),
        toBase64(productImage),
        toBase64(logoImage),
      ]);
      
      const resultBase64 = await generateProductImage({
        design: { data: designBase64, mimeType: designImage.type },
        product: { data: productBase64, mimeType: productImage.type },
        logo: { data: logoBase64, mimeType: logoImage.type },
        aspectRatio,
      });

      if (resultBase64) {
        const imageUrl = `data:image/png;base64,${resultBase64}`;
        setGeneratedImage(imageUrl);
        setHistory(prev => [imageUrl, ...prev]);
        setIsModificationModalOpen(true);
      } else {
        throw new Error("لم يتمكن الذكاء الاصطناعي من إنشاء الصورة. حاول مرة أخرى بصور مختلفة.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
    } finally {
      setIsLoading(false);
    }
  }, [designImage, productImage, logoImage, aspectRatio, canGenerate]);

  const handleApplyModifications = useCallback(async () => {
    if (!modificationPrompt.trim() || !generatedImage || isLoading) return;

    setIsLoading(true);
    setLoadingMessage('جاري تطبيق التعديلات...');
    setError(null);

    try {
      const [header, base64Data] = generatedImage.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/png';
      
      const resultBase64 = await modifyGeneratedImage({
        baseImage: { data: base64Data, mimeType },
        prompt: modificationPrompt,
      });

      if (resultBase64) {
        const imageUrl = `data:image/png;base64,${resultBase64}`;
        setGeneratedImage(imageUrl);
        setHistory(prev => [imageUrl, ...prev.slice(1)]); // Replace last history item
        setModificationPrompt('');
        setIsModificationModalOpen(false);
      } else {
        throw new Error("لم يتمكن الذكاء الاصطناعي من تطبيق التعديلات. حاول مرة أخرى بصيغة مختلفة.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
    } finally {
      setIsLoading(false);
    }
  }, [generatedImage, modificationPrompt, isLoading]);
  
  const handleHistorySelect = (image: string) => {
    setGeneratedImage(image);
    setIsModificationModalOpen(true);
  }

  return (
    <div className="bg-black min-h-screen text-gray-200 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-500">
            EVO AI
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            أنشئ صور منتجات احترافية في ثوانٍ.
          </p>
        </header>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <ImageUploader id="design-image" label="التصميم" onFileSelect={setDesignImage} />
            <ImageUploader id="product-image" label="صورتك" onFileSelect={setProductImage} />
            <ImageUploader id="logo-image" label="لوجو" onFileSelect={setLogoImage} />
          </div>

          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 mb-8">
            <h3 className="text-lg font-semibold text-center mb-4 text-green-400">اختر أبعاد الصورة</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {ASPECT_RATIOS.map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 border-2
                    ${aspectRatio === ratio 
                      ? 'bg-green-500 border-green-400 text-black shadow-lg shadow-green-500/20' 
                      : 'bg-gray-800 border-gray-700 hover:border-green-500 hover:text-green-400'
                    }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center mb-8">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`relative inline-flex items-center justify-center px-12 py-4 text-lg font-bold text-white rounded-lg transition-all duration-300 ease-in-out overflow-hidden group
                ${canGenerate
                  ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30 focus:ring-4 focus:ring-green-500/50'
                  : 'bg-gray-700 cursor-not-allowed text-gray-400'
                }`}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <SpinnerIcon />
                </div>
              )}
              <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
                {loadingMessage ? loadingMessage : 'إنشاء الصورة'}
              </span>
            </button>
          </div>
          
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center mb-8">
              <p>{error}</p>
            </div>
          )}

          {generatedImage && !isModificationModalOpen && (
             <div className="bg-gray-900/50 p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-800">
                <h2 className="text-2xl font-bold text-center mb-6 text-green-400">الصورة النهائية</h2>
                <div className="flex justify-center items-center mb-6">
                    <img src={generatedImage} alt="Generated product" className="max-w-full h-auto max-h-[70vh] rounded-lg shadow-2xl" />
                </div>
                <div className="flex justify-center items-center gap-4">
                    <a
                    href={generatedImage}
                    download="generated_product_image.png"
                    className="inline-flex items-center gap-3 px-8 py-3 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 transition-colors duration-300 shadow-lg shadow-green-500/30"
                    >
                    <DownloadIcon />
                    تحميل
                    </a>
                    <button onClick={() => setIsModificationModalOpen(true)} className="px-8 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors duration-300">
                        تعديل الصورة
                    </button>
                </div>
            </div>
          )}
          
          <History history={history} onImageSelect={handleHistorySelect} />

          <Modal 
            isOpen={isModificationModalOpen} 
            onClose={() => setIsModificationModalOpen(false)}
            title="تعديلات إضافية"
          >
            <div className='text-center'>
                {generatedImage && <img src={generatedImage} alt="Preview for modification" className="max-w-full h-auto max-h-[50vh] rounded-lg shadow-lg mx-auto mb-4" />}
                <p className="text-center text-gray-400 mb-4 px-4">
                  اكتب التعديلات التي تريدها. مثلاً: "غير لون القميص إلى الأزرق".
                </p>
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-center px-4">
                  <input
                    type="text"
                    value={modificationPrompt}
                    onChange={(e) => setModificationPrompt(e.target.value)}
                    placeholder="اكتب تعديلاتك هنا..."
                    className="w-full sm:w-2/3 bg-gray-900 border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
                    aria-label="Additional modifications"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleApplyModifications}
                    disabled={!modificationPrompt.trim() || isLoading}
                    className={`relative inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white rounded-lg transition-all duration-300 ease-in-out w-full sm:w-auto
                      ${!modificationPrompt.trim() || isLoading
                        ? 'bg-gray-700 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30 focus:ring-4 focus:ring-green-500/50'
                      }`}
                  >
                    {isLoading && !!modificationPrompt.trim() && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <SpinnerIcon />
                      </div>
                    )}
                    <span className={isLoading && !!modificationPrompt.trim() ? 'opacity-0' : 'opacity-100'}>
                      تطبيق التعديلات
                    </span>
                  </button>
                </div>
            </div>
          </Modal>

        </main>
      </div>
    </div>
  );
};

export default App;