
import React, { useState } from 'react';
import { ProductInfo, AnalysisResult, PageStructure, Step } from './types';
import StepIndicator from './components/StepIndicator';
import ProductInputForm from './components/ProductInputForm';
import AnalysisResultView from './components/AnalysisResultView';
import ImageCard from './components/ImageCard';
import SettingsModal from './components/SettingsModal';
import { analyzeProduct, generatePageStructures } from './geminiService';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('input');
  // Track the furthest step reached to allow navigation back and forth
  const [furthestStep, setFurthestStep] = useState<Step>('input');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [pageStructures, setPageStructures] = useState<PageStructure[]>([]);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | undefined>(undefined);
  // Key to force re-render components on reset
  const [resetKey, setResetKey] = useState(0);

  const updateStep = (step: Step) => {
    setCurrentStep(step);
    const stepOrder: Step[] = ['input', 'analysis', 'generation'];
    const currentIdx = stepOrder.indexOf(step);
    const furthestIdx = stepOrder.indexOf(furthestStep);
    
    if (currentIdx > furthestIdx) {
      setFurthestStep(step);
    }
  };

  const showQuotaError = () => {
    const hasKey = sessionStorage.getItem('gemini_api_key');
    if (hasKey) {
      setSettingsMessage("등록된 키의 API 사용 한도가 초과되었습니다.\n(주의: Gemini Advanced 채팅 구독과 API 유료 사용량은 별개입니다. Google Cloud에 결제 계정이 연결되어 있는지 확인해주세요.)");
    } else {
      setSettingsMessage("API 키가 등록되지 않았습니다. 서비스를 이용하려면 설정에서 API 키를 등록해주세요.");
    }
    setIsSettingsOpen(true);
  };

  const handleApiError = (error: any) => {
    console.error(error);
    const msg = error?.message || error?.toString() || '';
    
    // Check for missing key error
    if (msg === 'REQUIRE_API_KEY' || msg.includes('API key not valid')) {
      setSettingsMessage("서비스 이용을 위해 Gemini API 키 등록이 필요합니다.\n우측 하단 설정 버튼을 눌러 키를 입력해주세요.");
      setIsSettingsOpen(true);
      return;
    }

    // Check for common quota/rate limit error signatures
    const isQuotaError = 
      msg.includes('429') || 
      msg.includes('quota') || 
      msg.includes('RESOURCE_EXHAUSTED') ||
      error?.status === 429;

    if (isQuotaError) {
      showQuotaError();
    } else {
      alert(`오류가 발생했습니다: ${msg.substring(0, 100)}...`);
    }
  };

  const handleProductSubmit = async (info: ProductInfo) => {
    setProductInfo(info);
    setIsLoading(true);
    setSettingsMessage(undefined);
    try {
      const result = await analyzeProduct(info);
      setAnalysisResult(result);
      updateStep('analysis');
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisNext = async (updatedAnalysis: AnalysisResult) => {
    setAnalysisResult(updatedAnalysis);
    if (!productInfo) return;
    
    setIsLoading(true);
    setSettingsMessage(undefined);
    try {
      const structures = await generatePageStructures(updatedAnalysis, productInfo);
      setPageStructures(structures);
      updateStep('generation');
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePage = (id: number) => {
    setPageStructures(prev => prev.filter(p => p.id !== id));
  };

  const handleQuotaExceeded = () => {
    // Called by ImageCard when it hits a 429 OR missing key
    // Prevent spamming the modal if it's already showing the relevant message
    if (!isSettingsOpen) {
      showQuotaError();
    }
  };

  const handleKeySaved = () => {
    // Clear the error message when key is saved
    setSettingsMessage(undefined);
  };

  const savePdf = async () => {
    if (typeof window === 'undefined' || !(window as any).html2canvas || !(window as any).jspdf) {
      alert("라이브러리 로드 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const html2canvas = (window as any).html2canvas;
    const { jsPDF } = (window as any).jspdf;
    
    const selector = '.analysis-export-section';
    const fileNameSuffix = '_brand_analysis';
    
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return;

    setIsExporting(true);

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.zIndex = '-9999';
    container.style.backgroundColor = '#ffffff';
    document.body.appendChild(container);

    try {
      const pdfWidth = 800;
      let doc: any = null;

      for (let i = 0; i < elements.length; i++) {
        const originalEl = elements[i] as HTMLElement;
        const clonedEl = originalEl.cloneNode(true) as HTMLElement;

        clonedEl.style.width = '800px';
        clonedEl.style.minWidth = '800px';
        clonedEl.style.maxWidth = '800px';
        clonedEl.style.height = 'auto';
        clonedEl.style.margin = '0';
        clonedEl.style.boxSizing = 'border-box';
        clonedEl.style.overflow = 'visible';
        clonedEl.style.backgroundColor = '#ffffff';
        clonedEl.style.transform = 'none';
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.border = 'none';
        clonedEl.style.padding = '40px'; 
        clonedEl.style.borderRadius = '0';

        const originalTextareas = originalEl.querySelectorAll('textarea');
        const clonedTextareas = clonedEl.querySelectorAll('textarea');

        for (let j = 0; j < originalTextareas.length; j++) {
            const orig = originalTextareas[j] as HTMLTextAreaElement;
            const clone = clonedTextareas[j] as HTMLTextAreaElement;
            
            const div = document.createElement('div');
            const style = window.getComputedStyle(orig);

            div.style.fontFamily = style.fontFamily;
            div.style.fontSize = style.fontSize;
            div.style.fontWeight = style.fontWeight;
            div.style.lineHeight = style.lineHeight;
            div.style.color = style.color;
            div.style.textAlign = style.textAlign;
            div.style.letterSpacing = style.letterSpacing;
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordBreak = 'break-word';
            div.style.padding = style.padding;
            div.style.border = style.border;
            div.style.borderRadius = style.borderRadius;
            div.style.backgroundColor = style.backgroundColor;
            div.style.width = '100%';
            div.style.height = 'auto';
            div.style.minHeight = '1.5em';
            div.style.overflow = 'visible';
            div.textContent = orig.value;
            clone.replaceWith(div);
        }

        container.innerHTML = '';
        container.appendChild(clonedEl);

        const canvas = await html2canvas(clonedEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1920,
          width: 800,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfPageHeight = (canvas.height / canvas.width) * pdfWidth;

        if (doc === null) {
          doc = new jsPDF({
            orientation: pdfPageHeight > pdfWidth ? 'p' : 'l',
            unit: 'px',
            format: [pdfWidth, pdfPageHeight]
          });
          doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfPageHeight);
        } else {
          doc.addPage([pdfWidth, pdfPageHeight]);
          doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfPageHeight);
        }
      }
      
      if (doc) {
        doc.save(`${productInfo?.name || 'product'}${fileNameSuffix}.pdf`);
      }
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("PDF 저장 중 오류가 발생했습니다.");
    } finally {
      if (container.parentNode) {
        document.body.removeChild(container);
      }
      setIsExporting(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-gray-50 print:bg-white">
      
      {/* Sidebar - Fixed Left */}
      <aside className="w-72 bg-white border-r border-gray-200 fixed h-full flex flex-col z-50 print:hidden hidden md:flex">
        {/* Brand */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-lg shadow-indigo-200 text-lg">D</div>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">DetailFlow</h1>
              <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">AI Generation</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Progress</h3>
            <StepIndicator 
              currentStep={currentStep} 
              onStepClick={setCurrentStep} 
              furthestStep={furthestStep} 
            />
          </div>

          {/* User Guide Section */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">사용 가이드</h3>
            <div className="space-y-3 px-2">
              <div className="flex gap-3 text-sm text-gray-600">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">1</span>
                <p className="leading-snug">상품 정보를 입력하고 분석 결과를 확인하세요.</p>
              </div>
              <div className="flex gap-3 text-sm text-gray-600">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">2</span>
                <p className="leading-snug">상세페이지 기획안이 생성되면, 각 카드의 프롬프트를 확인하세요.</p>
              </div>
              <div className="flex gap-3 text-sm text-gray-600">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">3</span>
                <p className="leading-snug font-medium text-indigo-900">
                  프롬프트를 복사하여 <br/>
                  <span className="underline decoration-indigo-300 decoration-2">Gemini 3 Pro Image</span><br/>
                  모델에서 생성하세요.<br/>
                  <span className="text-xs text-indigo-500 mt-1 block">* 텍스트가 깨지지 않고 선명하게 생성됩니다.</span>
                </p>
              </div>
              <div className="flex gap-3 text-sm text-gray-600">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">4</span>
                <p className="leading-snug">
                  프롬프트 수정 입력란에서<br/>
                  <span className="font-bold text-gray-800">Ctrl + Enter</span>하면 <br/>
                  줄바꿈이 됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
          <button 
            onClick={() => {
              setSettingsMessage(undefined);
              setIsSettingsOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-sm font-bold"
          >
            <i className="fas fa-cog"></i>
            설정
          </button>

          <div className="pt-2 text-center">
            <a href="https://xn--design-hl6wo12cquiba7767a.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-400 hover:text-indigo-500 font-medium transition-colors">
              떨림과울림Design.com
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 min-h-screen">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="md:hidden bg-white/80 backdrop-blur-md p-4 sticky top-0 z-40 border-b border-gray-200 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black">D</div>
                <h1 className="text-lg font-black text-gray-900">DetailFlow</h1>
             </div>
             <button onClick={() => setIsSettingsOpen(true)} className="text-gray-500 text-sm">
                <i className="fas fa-cog"></i>
             </button>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8 md:p-12 print:p-0 print:max-w-none">
          {currentStep === 'input' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="mb-8 md:hidden">
                 <h2 className="text-2xl font-bold text-gray-900">상품 정보 입력</h2>
                 <p className="text-gray-500 text-sm mt-1">상세페이지 기획을 위한 기초 데이터를 입력해주세요.</p>
               </div>
               <ProductInputForm key={resetKey} onSubmit={handleProductSubmit} isLoading={isLoading} />
            </div>
          )}

          {currentStep === 'analysis' && analysisResult && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AnalysisResultView 
                initialResult={analysisResult} 
                onBack={() => setCurrentStep('input')} 
                onNext={handleAnalysisNext}
                onSavePdf={savePdf}
                isLoading={isLoading}
              />
            </div>
          )}

          {currentStep === 'generation' && analysisResult && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 print:space-y-0">
              
              {/* Cards Grid */}
              <div className="grid grid-cols-1 gap-12 max-w-5xl mx-auto print:block print:max-w-full print:gap-0 pb-20">
                {pageStructures.map((page, index) => (
                  <div key={page.id} className="print:mb-8 print:break-inside-avoid">
                    <ImageCard 
                      page={page} 
                      analysis={analysisResult} 
                      productImages={productInfo?.images || []}
                      onDelete={handleDeletePage}
                      index={index}
                      onQuotaExceeded={handleQuotaExceeded}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Settings Modal */}
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          message={settingsMessage}
          onKeySaved={handleKeySaved}
        />
      </main>
    </div>
  );
};

export default App;
