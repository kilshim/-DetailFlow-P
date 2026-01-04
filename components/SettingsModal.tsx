
import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string; // Optional message to display (e.g. error alerts)
  onKeySaved?: () => void; // Callback when key is saved
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, message, onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    if (isOpen) {
      const storedKey = sessionStorage.getItem('gemini_api_key');
      if (storedKey) setApiKey(storedKey);
      else setApiKey(''); // Ensure clear state if no key
      setSaveStatus('idle');
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    if (saveStatus === 'saved') {
      setSaveStatus('idle');
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      sessionStorage.removeItem('gemini_api_key');
    } else {
      sessionStorage.setItem('gemini_api_key', apiKey.trim());
    }
    setSaveStatus('saved');
    onKeySaved?.();
  };

  const handleDelete = () => {
    // Directly remove without confirmation to ensure execution
    sessionStorage.removeItem('gemini_api_key');
    setApiKey('');
    setSaveStatus('idle');
    onKeySaved?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4 transform transition-all scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">설정</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-6">
          
          {/* Warning Message Alert */}
          {message && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 animate-pulse">
              <i className="fas fa-exclamation-triangle text-red-500 mt-0.5 shrink-0"></i>
              <p className="text-sm text-red-600 font-bold leading-snug whitespace-pre-wrap">{message}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Gemini API Key</label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all pr-10"
                placeholder="AI Studio에서 발급받은 키 입력"
                value={apiKey}
                onChange={handleInputChange}
              />
              <button 
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              * 키는 브라우저 세션에만 저장되며 서버로 전송되지 않습니다.<br/>
              * <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google AI Studio</a>에서 키를 발급받으세요.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === 'saved'}
              className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                ${saveStatus === 'saved' 
                  ? 'bg-gray-400 text-white cursor-default shadow-none' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                }`}
            >
              {saveStatus === 'saved' ? (
                <>
                  <i className="fas fa-check"></i> 저장됨
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> 저장하기
                </>
              )}
            </button>

            {apiKey && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full bg-white border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-trash-alt"></i> 키 삭제
              </button>
            )}
          </div>
          
          <div className="text-center pt-2">
            <p className="text-[10px] text-gray-300">DetailFlow AI v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
