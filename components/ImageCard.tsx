
import React, { useState, useEffect, useRef } from 'react';
import { PageStructure, AnalysisResult } from '../types';
import { regenerateVisualPrompt } from '../geminiService';

interface ImageCardProps {
  page: PageStructure;
  analysis: AnalysisResult;
  productImages: string[];
  onDelete: (id: number) => void;
  index: number; 
  onQuotaExceeded?: () => void;
}

// Helper component for auto-resizing textarea
const AutoResizeTextarea = ({ className, value, onChange, onKeyDown, placeholder, ...props }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to correctly calculate scrollHeight (allows shrinking)
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className={`${className} overflow-hidden`}
      rows={1}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      {...props}
    />
  );
};

const ImageCard: React.FC<ImageCardProps> = ({ page, analysis, productImages, onDelete, index, onQuotaExceeded }) => {
  const [promptText, setPromptText] = useState(page.visualPrompt);
  // Initialize with the existing Korean prompt if available
  const [koreanPrompt, setKoreanPrompt] = useState<string>(page.visualPromptKorean || '');
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleRegeneratePrompt = async (msg?: string) => {
    setIsLoading(true);
    try {
      // Use the first product image as the reference for consistency
      const refImage = productImages && productImages.length > 0 ? productImages[0] : undefined;
      const result = await regenerateVisualPrompt(page, analysis, msg, refImage);
      // The service now returns Korean prompt in the 'english' field for compatibility
      setPromptText(result.english);
      setKoreanPrompt(result.korean);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || err?.toString() || '';
      
      const isQuotaError = 
        msg.includes('429') || 
        msg.includes('quota') || 
        msg.includes('RESOURCE_EXHAUSTED') ||
        err?.status === 429;

      if (isQuotaError || msg === 'REQUIRE_API_KEY') {
        onQuotaExceeded?.();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChatSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    handleRegeneratePrompt(chatInput);
    setChatInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Ctrl+Enter or Shift+Enter to insert a line break (default behavior)
    // Only prevent default and submit if it's strictly Enter key without modifiers
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  const getStyleBadge = () => {
    switch(page.visualStyle) {
      case 'illustration': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '일러스트' };
      case 'infographic': return { bg: 'bg-blue-100', text: 'text-blue-700', label: '인포그래픽' };
      default: return { bg: 'bg-green-100', text: 'text-green-700', label: '실사' };
    }
  };
  const badge = getStyleBadge();

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xl group transition-all duration-500 hover:shadow-2xl print:shadow-none print:border print:border-gray-200 print:rounded-lg print:break-inside-avoid print:mb-4">
      <div className="flex flex-col md:flex-row print:flex-row h-full">
        {/* Left: Prompt Display Area */}
        <div className="relative md:flex-[3] bg-gray-900 aspect-[3/2.4] flex flex-col p-6 overflow-hidden print:bg-white print:border-r print:border-gray-100">
           
           {/* Page Badge */}
           <div className="flex items-center gap-2 mb-4">
            <span className="bg-white/10 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">섹션 {page.id}</span>
            <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-[10px] font-bold tracking-tight border border-white/20`}>{badge.label}</span>
          </div>

           {/* Prompt Text Display (Korean) */}
           <div className="flex-1 relative bg-black/30 rounded-xl border border-white/10 p-4 overflow-hidden flex flex-col mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gemini 3 Pro Image Prompt (Korean)</span>
                <button 
                  onClick={handleCopy}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                >
                  {copied ? <><i className="fas fa-check"></i> 복사됨</> : <><i className="fas fa-copy"></i> 프롬프트 복사</>}
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3">
                    <i className="fas fa-circle-notch fa-spin text-2xl text-indigo-500"></i>
                    <span className="text-gray-400 text-xs animate-pulse">한글 프롬프트 최적화 및 텍스트 렌더링 설정 중...</span>
                  </div>
                ) : (
                  <p className="text-gray-300 text-xs leading-relaxed font-mono whitespace-pre-wrap">
                    {promptText}
                  </p>
                )}
              </div>
           </div>

           {/* Korean Translation Display (Hidden if redundant, but kept if different) 
               Since visualPrompt is now Korean, this might be redundant if they are identical.
               However, keeping it allows for a secondary description if the model generates one.
           */}
           {koreanPrompt && promptText !== koreanPrompt && (
             <div className="h-1/3 relative bg-gray-800/50 rounded-xl border border-white/5 p-4 overflow-hidden flex flex-col">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">상세 설명</span>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                    {koreanPrompt}
                  </p>
                </div>
             </div>
           )}
           
           <div className="mt-3 text-[10px] text-gray-500 text-center">
             * 위 프롬프트를 복사하여 <strong>Gemini 3 Pro Image</strong> 모델(한글 텍스트 지원)에서 이미지를 생성하세요.
           </div>
        </div>

        {/* Right: Content & Tools Area (Dark Mode) */}
        <div className="w-full md:flex-[2] print:w-0 print:hidden p-6 flex flex-col bg-gray-800 border-l border-gray-700 relative">
          
          <div className="flex items-center justify-between mb-4 relative z-10">
             <div className="flex-1">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{page.purpose}</h3>
                <h2 className="text-lg font-bold text-white leading-tight truncate pr-2">{page.title}</h2>
             </div>
             <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Stop bubbling
                    if(window.confirm('이 섹션을 정말 삭제하시겠습니까? (삭제 후 복구 불가)')) {
                      onDelete(page.id);
                    }
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-700 text-gray-400 border border-gray-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all cursor-pointer z-20"
                  title="섹션 삭제"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
             </div>
          </div>

          {/* Planning Points Display */}
          <div className="flex-1 space-y-4 mb-6 overflow-y-auto animate-in slide-in-from-left-5 duration-300">
            <div className="bg-gray-700/50 p-4 rounded-xl shadow-sm border border-gray-600">
              <p className="text-[10px] font-black text-indigo-400 mb-2 uppercase tracking-tighter">기획 포인트</p>
              <div className="space-y-2">
                <ul className="mt-2 space-y-1">
                  {page.contentPoints.map((point, idx) => (
                    <li key={idx} className="text-[11px] text-gray-300 flex items-start gap-2">
                      <span className="text-indigo-500">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
             <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
               <p className="text-[10px] font-bold text-gray-500 mb-1">메인 카피 (렌더링 대상)</p>
               <p className="text-sm text-gray-200 font-bold">{page.headline}</p>
             </div>
          </div>

          <form onSubmit={handleChatSubmit} className="relative mt-auto">
            <AutoResizeTextarea
              placeholder="프롬프트 수정 요청 (Ctrl+Enter 줄바꿈)"
              className="w-full pl-4 pr-12 py-3 rounded-2xl bg-gray-700 border border-gray-600 text-white text-xs md:text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm placeholder-gray-500 resize-none block"
              value={chatInput}
              onChange={(e: any) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
              type="submit"
              disabled={isLoading || !chatInput}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white w-8 h-8 rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:bg-gray-600 transition-all"
            >
              <i className="fas fa-paper-plane text-xs"></i>
            </button>
          </form>
          
          <button 
            type="button"
            onClick={() => handleRegeneratePrompt()}
            disabled={isLoading}
            className="mt-3 text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest flex items-center justify-center gap-1 transition-colors"
          >
            <i className="fas fa-sync-alt"></i> 프롬프트 최적화/재생성
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
