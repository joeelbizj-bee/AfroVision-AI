
import React, { useState, useCallback, useEffect } from 'react';
import { GenerationModel, TransformationResult } from './types';
import { DEFAULT_PROMPT } from './constants';
import { transformImage, fileToBase64 } from './services/gemini';
import ImageUploader from './components/ImageUploader';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [model, setModel] = useState<GenerationModel>(GenerationModel.FLASH);
  const [history, setHistory] = useState<TransformationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Handle image selection
  const handleImageSelect = useCallback((file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError(null);
  }, []);

  // Check if API key is selected (for Pro model/Veo models logic)
  const checkApiKey = async (): Promise<boolean> => {
    // Only mandatory for PRO/Veo models in some environments, 
    // but following instructions to use window.aistudio methods.
    if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        if (typeof (window as any).aistudio?.openSelectKey === 'function') {
          await (window as any).aistudio.openSelectKey();
          return true; // Assume success after opening dialog
        }
      }
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError("Please upload a reference photo first.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Ensure API key is ready
      await checkApiKey();

      const base64 = await fileToBase64(selectedFile);
      const resultImageUrl = await transformImage(base64, prompt, model);

      const newResult: TransformationResult = {
        id: crypto.randomUUID(),
        originalImage: previewUrl || '',
        transformedImage: resultImageUrl,
        prompt: prompt,
        timestamp: Date.now(),
      };

      setHistory(prev => [newResult, ...prev]);
    } catch (err: any) {
      if (err.message === "API_KEY_INVALID") {
        setError("Invalid API Key. Please select a valid key.");
        if (typeof (window as any).aistudio?.openSelectKey === 'function') {
           (window as any).aistudio.openSelectKey();
        }
      } else {
        setError(err.message || "Something went wrong during generation.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `afro-modern-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              AfroVision AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-indigo-400 hidden sm:block"
            >
              Billing Info
            </a>
            <button 
              onClick={() => (window as any).aistudio?.openSelectKey?.()}
              className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors"
            >
              API Settings
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">1</span>
                Reference Image
              </h2>
              <ImageUploader 
                onImageSelect={handleImageSelect} 
                previewUrl={previewUrl} 
                disabled={isGenerating} 
              />
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">2</span>
                Transformation Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Style Instructions</label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all resize-none"
                    placeholder="Describe the fashion, identity, and setting..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">AI Model</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setModel(GenerationModel.FLASH)}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${model === GenerationModel.FLASH ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    >
                      Balanced (Flash)
                    </button>
                    <button
                      onClick={() => setModel(GenerationModel.PRO)}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${model === GenerationModel.PRO ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    >
                      High Realism (Pro)
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-rose-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedFile}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95
                    ${isGenerating || !selectedFile 
                      ? 'bg-slate-800 cursor-not-allowed text-slate-500' 
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-500/20'}
                  `}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generative Magic...
                    </>
                  ) : (
                    <>
                      Transform Identity
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.897.95l.003.103a1 1 0 01.95 1.103c.176 1.832 1.668 3.324 3.5 3.5a1 1 0 011.1 1.053l-.003.104a1 1 0 01.95 1.1c-.13 1.426-.333 2.508-.475 3.204a13.12 13.12 0 01-.4 1.487 1 1 0 01-.84.697l-.146.01a1 1 0 01-.89-.556A11.132 11.132 0 0013.882 11h-1.764a1 1 0 01-.98-.82l-.02-.18V6.66a2 2 0 00-2-2h-3a2 2 0 00-2 2v3.34l-.02.18a1 1 0 01-.98.82H1.118a11.132 11.132 0 00-2.118 2.344 1 1 0 01-.89.556l-.146-.01a1 1 0 01-.84-.697 13.12 13.12 0 01-.4-1.487c-.142-.696-.345-1.778-.475-3.204a1 1 0 01.95-1.1l-.003-.104a1 1 0 011.1-1.053c1.832-.176 3.324-1.668 3.5-3.5a1 1 0 011.103-.95l.103-.003a1 1 0 01.95.897V4.2a2 2 0 012 2v2a2 2 0 01-2 2h-1a1 1 0 000 2h1a4 4 0 004-4v-2a4 4 0 00-4-4v-1.153z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-8">
            {history.length > 0 ? (
              <div className="space-y-12">
                {history.map((item, idx) => (
                  <div key={item.id} className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Comparison display */}
                        <div className="relative aspect-square md:border-r border-slate-800">
                           <img src={item.originalImage} className="w-full h-full object-cover" alt="Original" />
                           <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-slate-400">Original</div>
                        </div>
                        <div className="relative aspect-square">
                           <img src={item.transformedImage} className="w-full h-full object-cover" alt="Transformed" />
                           <div className="absolute top-4 left-4 bg-indigo-600/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white">Reimagined</div>
                           <button 
                            onClick={() => downloadImage(item.transformedImage, item.id)}
                            className="absolute bottom-4 right-4 p-2 bg-slate-900/90 hover:bg-slate-800 rounded-full text-white shadow-xl transition-all"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                             </svg>
                           </button>
                        </div>
                      </div>
                      <div className="p-6 bg-slate-950/50">
                        <p className="text-xs text-slate-500 font-mono italic">
                          " {item.prompt} "
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[2rem] text-slate-600 p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-400">No transformations yet</h3>
                <p className="max-w-xs text-sm mt-2">Upload your photo and hit the transform button to see the magic happen.</p>
              </div>
            )}
          </div>

        </div>
      </main>

      <footer className="py-8 border-t border-slate-800 mt-auto bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">© 2024 AfroVision AI. Powered by Google Gemini.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
