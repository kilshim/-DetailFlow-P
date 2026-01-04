
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, ProductCategory } from '../types';

interface AnalysisResultViewProps {
  initialResult: AnalysisResult;
  onBack: () => void;
  onNext: (updated: AnalysisResult) => void;
  onSavePdf: () => void;
  isLoading: boolean;
}

// Helper component for auto-resizing textarea
const AutoResizeTextarea = ({ className, value, onChange, rows = 1, placeholder, ...props }: any) => {
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
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  );
};

const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ initialResult, onBack, onNext, onSavePdf, isLoading }) => {
  const [result, setResult] = useState<AnalysisResult>(initialResult);

  const handleListChange = (key: keyof Pick<AnalysisResult, 'targets' | 'motivations' | 'marketProblems' | 'usps'>, index: number, value: string) => {
    const newList = [...result[key]];
    newList[index] = value;
    setResult({ ...result, [key]: newList });
  };

  const addListItem = (key: keyof Pick<AnalysisResult, 'targets' | 'motivations' | 'marketProblems' | 'usps'>) => {
    setResult({ ...result, [key]: [...result[key], ''] });
  };

  const removeListItem = (key: keyof Pick<AnalysisResult, 'targets' | 'motivations' | 'marketProblems' | 'usps'>, index: number) => {
    setResult({ ...result, [key]: result[key].filter((_, i) => i !== index) });
  };

  const handleBrandColorChange = (index: number, value: string) => {
    const newColors = [...result.brandIdentity.colors];
    newColors[index] = value;
    setResult({
      ...result,
      brandIdentity: { ...result.brandIdentity, colors: newColors }
    });
  };

  const addBrandColor = () => {
    setResult({
      ...result,
      brandIdentity: { ...result.brandIdentity, colors: [...result.brandIdentity.colors, '#000000'] }
    });
  };

  const removeBrandColor = (index: number) => {
    setResult({
      ...result,
      brandIdentity: {
        ...result.brandIdentity,
        colors: result.brandIdentity.colors.filter((_, i) => i !== index)
      }
    });
  };

  // 텍스트에 포함된 HEX 코드를 추출하는 헬퍼 함수
  const extractColorForCss = (colorStr: string) => {
    const hexMatch = colorStr.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/);
    if (hexMatch) return hexMatch[0];
    return colorStr;
  };

  const getCategoryBadge = (category: ProductCategory) => {
    const styles: Record<ProductCategory, string> = {
      Fashion: 'bg-pink-100 text-pink-700 border-pink-200',
      Beauty: 'bg-purple-100 text-purple-700 border-purple-200',
      Living: 'bg-green-100 text-green-700 border-green-200',
      Digital: 'bg-blue-100 text-blue-700 border-blue-200',
      Health: 'bg-red-100 text-red-700 border-red-200',
      Food: 'bg-orange-100 text-orange-700 border-orange-200',
      General: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    
    const icons: Record<ProductCategory, string> = {
      Fashion: 'fa-shirt',
      Beauty: 'fa-wand-magic-sparkles',
      Living: 'fa-couch',
      Digital: 'fa-laptop',
      Health: 'fa-heart-pulse',
      Food: 'fa-utensils',
      General: 'fa-box-open'
    };

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${styles[category]} font-bold text-sm shadow-sm mb-4`}>
        <i className={`fas ${icons[category]}`}></i>
        <span>{category} 카테고리 감지됨</span>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4">
      <div className="text-center mb-10 analysis-export-section p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
        {result.category && getCategoryBadge(result.category)}
        <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">AI 브랜드 분석 리포트</h2>
        <p className="text-gray-600 text-base max-w-xl mx-auto leading-relaxed">
          상품 정보를 <strong>{result.category || 'General'}</strong> 관점에서 다각도로 분석했습니다.<br/>
          내용을 검토하고 수정하면, 맞춤형 상세페이지가 생성됩니다.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* Summary Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-lg shadow-indigo-100/50 border border-indigo-50 relative overflow-hidden group hover:shadow-xl transition-shadow duration-300 analysis-export-section">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 relative z-10">
            <span className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg shadow-sm">
              <i className="fas fa-align-left"></i>
            </span>
            전략 요약
          </h3>
          <div className="relative z-10">
              <AutoResizeTextarea
              className="w-full p-5 bg-gray-50 rounded-2xl border-0 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-gray-800 leading-relaxed text-base resize-none placeholder-gray-400 transition-all"
              rows={5}
              value={result.summary}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResult({ ...result, summary: e.target.value })}
            />
            <i className="fas fa-quote-right absolute top-6 right-6 text-8xl text-indigo-50/50 -z-10 pointer-events-none"></i>
          </div>
        </div>

        {/* Targets Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-lg shadow-indigo-100/50 border border-indigo-50 hover:shadow-xl transition-shadow duration-300 analysis-export-section">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center text-lg shadow-sm">
              <i className="fas fa-users"></i>
            </span>
            타겟 고객
          </h3>
          <div className="space-y-4">
            {result.targets.map((item, idx) => (
              <div key={idx} className="group flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-pink-200 hover:bg-pink-50/30 transition-all focus-within:ring-2 focus-within:ring-pink-200 focus-within:bg-white">
                <span className="text-pink-500 font-bold text-base px-1 mt-1">0{idx + 1}</span>
                <AutoResizeTextarea
                  className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 text-base p-0 resize-none leading-relaxed"
                  rows={1}
                  value={item}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleListChange('targets', idx, e.target.value)}
                />
                <button onClick={() => removeListItem('targets', idx)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-pink-100 hover:text-pink-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 mt-1">
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>
            ))}
            <button onClick={() => addListItem('targets')} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold text-sm hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-plus"></i> 타겟 추가
            </button>
          </div>
        </div>

          {/* Motivations Card */}
          <div className="bg-white p-8 rounded-[2rem] shadow-lg shadow-indigo-100/50 border border-indigo-50 hover:shadow-xl transition-shadow duration-300 analysis-export-section">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg shadow-sm">
              <i className="fas fa-heart"></i>
            </span>
            구매 동기
          </h3>
          <div className="space-y-4">
            {result.motivations.map((item, idx) => (
              <div key={idx} className="group flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all focus-within:ring-2 focus-within:ring-orange-200 focus-within:bg-white">
                <div className="w-2 h-2 rounded-full bg-orange-400 ml-1 mt-2.5 flex-shrink-0"></div>
                <AutoResizeTextarea
                  className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 text-base p-0 resize-none leading-relaxed"
                  rows={1}
                  value={item}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleListChange('motivations', idx, e.target.value)}
                />
                <button onClick={() => removeListItem('motivations', idx)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-orange-100 hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 mt-1">
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>
            ))}
              <button onClick={() => addListItem('motivations')} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold text-sm hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-plus"></i> 동기 추가
            </button>
          </div>
        </div>

        {/* Market Problems Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-lg shadow-indigo-100/50 border border-indigo-50 hover:shadow-xl transition-shadow duration-300 analysis-export-section">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center text-lg shadow-sm">
              <i className="fas fa-exclamation-circle"></i>
            </span>
            기존 시장의 문제점
          </h3>
          <div className="space-y-4">
            {result.marketProblems.map((item, idx) => (
              <div key={idx} className="group flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-300 transition-all focus-within:ring-2 focus-within:ring-gray-200 focus-within:bg-white">
                <span className="text-gray-400 font-bold text-sm mt-1.5"><i className="fas fa-arrow-right"></i></span>
                <AutoResizeTextarea
                  className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 text-base p-0 resize-none leading-relaxed"
                  rows={1}
                  value={item}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleListChange('marketProblems', idx, e.target.value)}
                />
                <button onClick={() => removeListItem('marketProblems', idx)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-gray-200 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 mt-1">
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>
            ))}
            <button onClick={() => addListItem('marketProblems')} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold text-sm hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-plus"></i> 문제점 추가
            </button>
          </div>
        </div>

        {/* USPs Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-lg shadow-indigo-100/50 border border-indigo-50 hover:shadow-xl transition-shadow duration-300 analysis-export-section">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg shadow-sm">
              <i className="fas fa-star"></i>
            </span>
            핵심 차별점 (USP)
          </h3>
          <div className="space-y-4">
            {result.usps.map((item, idx) => (
              <div key={idx} className="group flex items-start gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition-all focus-within:ring-2 focus-within:ring-blue-200 focus-within:bg-white">
                <span className="text-blue-500 text-sm mt-1.5"><i className="fas fa-check-circle"></i></span>
                <AutoResizeTextarea
                  className="flex-1 bg-transparent border-none focus:ring-0 text-blue-900 font-bold text-base p-0 resize-none leading-relaxed"
                  rows={1}
                  value={item}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleListChange('usps', idx, e.target.value)}
                />
                <button onClick={() => removeListItem('usps', idx)} className="w-8 h-8 rounded-full flex items-center justify-center text-blue-300 hover:bg-blue-200 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 mt-1">
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>
            ))}
              <button onClick={() => addListItem('usps')} className="w-full py-4 rounded-2xl border-2 border-dashed border-blue-200 text-blue-400 font-bold text-sm hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-plus"></i> USP 추가
            </button>
          </div>
        </div>

        {/* Brand Identity Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-lg shadow-indigo-100/50 border border-indigo-50 relative overflow-hidden group hover:shadow-xl transition-shadow duration-300 analysis-export-section">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3 relative z-10">
            <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg shadow-sm">
              <i className="fas fa-fingerprint"></i>
            </span>
            브랜드 아이덴티티
          </h3>

          <div className="space-y-6 relative z-10">
            {/* Tone */}
            <div className="group/item">
              <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Tone & Mood</label>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 focus-within:ring-2 focus-within:ring-purple-100 focus-within:bg-white transition-all">
                <AutoResizeTextarea
                  className="w-full bg-transparent border-none focus:ring-0 text-gray-900 font-bold text-base p-0 placeholder-gray-300 resize-none leading-relaxed"
                  rows={1}
                  value={result.brandIdentity.tone}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResult({ ...result, brandIdentity: { ...result.brandIdentity, tone: e.target.value } })}
                />
              </div>
            </div>

            {/* Core Message */}
            <div className="group/item">
              <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Core Message</label>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 focus-within:ring-2 focus-within:ring-purple-100 focus-within:bg-white transition-all">
                <AutoResizeTextarea
                   className="w-full bg-transparent border-none focus:ring-0 text-gray-900 font-bold text-base p-0 placeholder-gray-300 resize-none leading-relaxed"
                   rows={1}
                   value={result.brandIdentity.coreMessage}
                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResult({ ...result, brandIdentity: { ...result.brandIdentity, coreMessage: e.target.value } })}
                />
              </div>
            </div>

            {/* Brand Colors */}
            <div className="bg-purple-50/40 rounded-[1.5rem] p-6 border border-purple-100">
              <label className="block text-sm font-bold text-purple-600 mb-4 uppercase tracking-wider flex items-center gap-2">
                <i className="fas fa-palette"></i> 브랜드 컬러
              </label>
              <div className="space-y-3">
                {(result.brandIdentity.colors || []).map((color, idx) => (
                  <div key={idx} className="flex items-start gap-4 group/color">
                    <div className="relative w-12 h-12 flex-shrink-0 mt-1">
                      <input 
                        type="color" 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        value={extractColorForCss(color).match(/^#[0-9A-F]{6}$/i) ? extractColorForCss(color) : '#000000'}
                        onChange={(e) => handleBrandColorChange(idx, e.target.value)}
                      />
                      <div 
                        className="w-full h-full rounded-full border-4 border-white shadow-md ring-1 ring-gray-200 transition-transform group-hover/color:scale-110"
                        style={{ backgroundColor: extractColorForCss(color) }}
                        title="클릭하여 색상 변경"
                      />
                    </div>
                    <AutoResizeTextarea
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-base font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all resize-none leading-relaxed"
                      value={color}
                      placeholder="#HEX or Name"
                      rows={1}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleBrandColorChange(idx, e.target.value)}
                    />
                    <button 
                      onClick={() => removeBrandColor(idx)}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-100 mt-1"
                    >
                      <i className="fas fa-times text-base"></i>
                    </button>
                  </div>
                ))}
                <button 
                  onClick={addBrandColor}
                  className="w-full py-4 rounded-xl border-2 border-dashed border-purple-200 text-purple-400 font-bold text-sm hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <i className="fas fa-plus"></i> 컬러 추가
                </button>
              </div>
            </div>

            {/* Avoid Expressions */}
            <div className="group/item">
              <label className="block text-sm font-bold text-red-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i> 지양할 표현
              </label>
              <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 hover:border-red-200 transition-all focus-within:ring-2 focus-within:ring-red-100 focus-within:bg-white">
                <AutoResizeTextarea
                  className="w-full bg-transparent border-none focus:ring-0 text-gray-800 font-medium text-base p-0 placeholder-red-200 resize-none leading-relaxed"
                  rows={1}
                  value={result.brandIdentity.avoidExpressions}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResult({ ...result, brandIdentity: { ...result.brandIdentity, avoidExpressions: e.target.value } })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button Area - Added PDF Save Button */}
        <div className="flex justify-center pt-4 gap-4">
           <button 
            onClick={onSavePdf}
            className="bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 px-6 py-5 rounded-2xl font-bold shadow-sm transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 text-lg whitespace-nowrap"
            title="현재 분석 리포트를 PDF로 저장합니다"
           >
              <i className="fas fa-file-pdf"></i>
              PDF로 저장
           </button>

           <button 
            onClick={() => onNext(result)}
            disabled={isLoading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-8 py-5 rounded-2xl font-bold shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 text-lg"
          >
            {isLoading ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i>
                기획 생성 중...
              </>
            ) : (
              <>
                상세페이지 기획 생성
                <i className="fas fa-wand-magic-sparkles"></i>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultView;
