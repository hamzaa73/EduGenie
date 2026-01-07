import React from 'react';
import { Question, QuestionType } from '../types';
import { CheckCircle, XCircle, Eye, HelpCircle, Circle, Check, X, Info } from 'lucide-react';

interface Props {
  question: Question;
  index: number;
  lang: 'ar' | 'en';
  showAnswerByDefault?: boolean;
  userAnswer?: any;
  onSelect?: (answer: any) => void;
  isReviewMode?: boolean; 
}

export const QuestionCard: React.FC<Props> = ({ 
  question, 
  index, 
  lang, 
  showAnswerByDefault = false,
  userAnswer,
  onSelect,
  isReviewMode = false
}) => {
  const [showAnswerLocal, setShowAnswerLocal] = React.useState(showAnswerByDefault);
  const isRtl = lang === 'ar';
  
  React.useEffect(() => {
    setShowAnswerLocal(showAnswerByDefault);
  }, [showAnswerByDefault]);

  const t = {
    showAnswer: isRtl ? 'إظهار الشرح' : 'Show Explanation',
    hideAnswer: isRtl ? 'إخفاء الشرح' : 'Hide Explanation',
    explanation: isRtl ? 'توضيح الإجابة' : 'Explanation',
    true: isRtl ? 'صح' : 'True',
    false: isRtl ? 'خطأ' : 'False',
    yourAnswer: isRtl ? 'إجابتك' : 'Your Answer',
    correctAnswer: isRtl ? 'الإجابة الصحيحة' : 'Correct Answer',
  };

  const handleSelect = (val: any) => {
    if (!isReviewMode && onSelect) {
      onSelect(val);
    }
  };

  const renderMCQ = () => {
    return (
      <div className="grid grid-cols-1 gap-4 mb-6">
        {question.options?.map((option, idx) => {
          const isSelected = userAnswer === idx;
          const isCorrect = question.correctIndex === idx;
          
          let bgColor = 'bg-white hover:bg-slate-50 border-slate-200';
          let textColor = 'text-slate-700';
          let icon = <Circle className="text-slate-300" size={20} />;

          if (isReviewMode) {
            if (isCorrect) {
              bgColor = 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500';
              textColor = 'text-emerald-900';
              icon = <CheckCircle className="text-emerald-500" size={20} />;
            } else if (isSelected && !isCorrect) {
              bgColor = 'bg-red-50 border-red-500 ring-1 ring-red-500';
              textColor = 'text-red-900';
              icon = <XCircle className="text-red-500" size={20} />;
            }
          } else if (isSelected) {
            bgColor = 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-600 ring-inset';
            textColor = 'text-indigo-900';
            icon = <CheckCircle className="text-indigo-600" size={20} />;
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isReviewMode}
              className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all text-right font-bold group ${bgColor} ${isReviewMode ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
            >
              <div className="flex-shrink-0">{icon}</div>
              <span className={`text-lg leading-tight flex-1 ${textColor}`}>{option}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderTrueFalse = () => {
    const choices = [
      { label: t.true, value: true },
      { label: t.false, value: false }
    ];

    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        {choices.map((choice) => {
          const isSelected = userAnswer === choice.value;
          const isCorrect = question.correctAnswer === choice.value;
          
          let bgColor = 'bg-white hover:bg-slate-50 border-slate-200';
          let textColor = 'text-slate-700';
          let icon = null;

          if (isReviewMode) {
            if (isCorrect) {
              bgColor = 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500';
              textColor = 'text-emerald-900';
              icon = <Check size={20} className="text-emerald-600" />;
            } else if (isSelected && !isCorrect) {
              bgColor = 'bg-red-50 border-red-500 ring-1 ring-red-500';
              textColor = 'text-red-900';
              icon = <X size={20} className="text-red-600" />;
            }
          } else if (isSelected) {
            bgColor = 'bg-indigo-600 border-indigo-600';
            textColor = 'text-white';
          }

          return (
            <button
              key={choice.label}
              onClick={() => handleSelect(choice.value)}
              disabled={isReviewMode}
              className={`flex items-center justify-center gap-2 py-6 rounded-3xl border-2 font-black text-xl transition-all ${bgColor} ${textColor} ${isReviewMode ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
            >
              {icon}
              {choice.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-[40px] shadow-sm border border-slate-100 p-8 sm:p-10 animate-fade-in ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black">
            {index + 1}
          </div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
            {question.type === QuestionType.MCQ ? (isRtl ? 'اختيار من متعدد' : 'Multiple Choice') : (isRtl ? 'صح أم خطأ' : 'True / False')}
          </span>
        </div>
      </div>

      <h3 className="text-2xl font-black text-slate-800 mb-10 leading-snug">
        {question.question}
      </h3>

      {question.type === QuestionType.MCQ ? renderMCQ() : renderTrueFalse()}

      {(isReviewMode || showAnswerLocal) && question.explanation && (
        <div className="mt-8 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex gap-4 animate-fade-in">
          <Info className="text-indigo-600 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-black text-indigo-900 text-sm uppercase tracking-widest mb-1">{t.explanation}</h4>
            <p className="text-indigo-800 font-medium leading-relaxed">{question.explanation}</p>
          </div>
        </div>
      )}

      {!isReviewMode && (
        <button 
          onClick={() => setShowAnswerLocal(!showAnswerLocal)}
          className="mt-6 flex items-center gap-2 text-slate-400 font-black text-sm hover:text-indigo-600 transition-colors"
        >
          <Eye size={18} />
          {showAnswerLocal ? t.hideAnswer : t.showAnswer}
        </button>
      )}
    </div>
  );
};