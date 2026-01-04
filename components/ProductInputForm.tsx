
import React, { useState } from 'react';
import { ProductInfo } from '../types';

interface ProductInputFormProps {
  onSubmit: (info: ProductInfo) => void;
  isLoading: boolean;
}

const ProductInputForm: React.FC<ProductInputFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<ProductInfo>({
    name: '',
    description: '',
    images: [],
    originalPrice: '',
    salePrice: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">상품 정보 입력</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">상품명</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-900 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            placeholder="예: 프리미엄 유기농 그린티 클렌저"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">상품 설명</label>
          <textarea
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-900 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all h-32"
            placeholder="주요 특징, 성분, 기대 효과 등을 자유롭게 입력하세요..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">정가</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-900 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="예: 45,000원"
              value={formData.originalPrice}
              onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">할인가</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-900 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="예: 29,900원"
              value={formData.salePrice}
              onChange={e => setFormData({ ...formData, salePrice: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">참조 이미지 (선택)</label>
          <div className="flex flex-wrap gap-4 mb-4">
            {formData.images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                <img src={img} alt="Product" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
              <i className="fas fa-plus text-gray-400 mb-1"></i>
              <span className="text-[10px] text-gray-500 font-medium">이미지 추가</span>
              <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        <button
          onClick={() => onSubmit(formData)}
          disabled={isLoading || !formData.name || !formData.description}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <i className="fas fa-circle-notch fa-spin"></i>
              상품 분석 중...
            </>
          ) : (
            <>
              분석 및 상세페이지 기획 시작
              <i className="fas fa-arrow-right ml-1"></i>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductInputForm;
