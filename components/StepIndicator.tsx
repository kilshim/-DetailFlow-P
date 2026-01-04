
import React from 'react';
import { Step } from '../types';

interface StepIndicatorProps {
  currentStep: Step;
  onStepClick: (step: Step) => void;
  furthestStep: Step;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepClick, furthestStep }) => {
  const steps: { key: Step; label: string; icon: string }[] = [
    { key: 'input', label: '상품 정보 입력', icon: 'fa-pen-to-square' },
    { key: 'analysis', label: '분석 결과 확인', icon: 'fa-chart-pie' },
    { key: 'generation', label: '상세페이지 생성', icon: 'fa-wand-magic-sparkles' }
  ];

  const getStepIndex = (s: Step) => steps.findIndex(i => i.key === s);
  const currentIndex = getStepIndex(currentStep);
  const maxIndex = getStepIndex(furthestStep);

  return (
    <div className="flex flex-col w-full space-y-2">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;
        const isClickable = idx <= maxIndex;

        return (
          <button
            key={step.key}
            onClick={() => isClickable && onStepClick(step.key)}
            disabled={!isClickable}
            className={`
              relative flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group
              ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : ''}
              ${!isActive && isClickable ? 'hover:bg-indigo-50 text-gray-600 hover:text-indigo-600' : ''}
              ${!isClickable ? 'opacity-40 cursor-not-allowed text-gray-400' : ''}
            `}
          >
            {/* Connection Line (Visual only) */}
            {idx < steps.length - 1 && (
              <div className={`absolute left-[22px] top-10 bottom-[-8px] w-0.5 z-0 ${idx < maxIndex ? 'bg-indigo-100' : 'bg-gray-100'}`} />
            )}

            <div className={`
              relative z-10 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all
              ${isActive ? 'bg-white/20 text-white' : ''}
              ${!isActive && isCompleted ? 'bg-indigo-100 text-indigo-600' : ''}
              ${!isActive && !isCompleted ? 'bg-gray-100 text-gray-400' : ''}
            `}>
              {isCompleted ? <i className="fas fa-check"></i> : <span>{idx + 1}</span>}
            </div>
            
            <div className="flex-1">
              <span className={`text-sm font-bold block ${isActive ? 'text-white' : ''}`}>
                {step.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default StepIndicator;
