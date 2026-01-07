
import React from 'react';

interface Props {
  lang: 'ar' | 'en';
  onToggle: (lang: 'ar' | 'en') => void;
}

export const LanguageToggle: React.FC<Props> = ({ lang, onToggle }) => {
  return (
    <div className="flex bg-slate-200 p-1 rounded-lg w-fit">
      <button
        onClick={() => onToggle('ar')}
        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
          lang === 'ar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
        }`}
      >
        العربية
      </button>
      <button
        onClick={() => onToggle('en')}
        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
          lang === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
        }`}
      >
        English
      </button>
    </div>
  );
};
