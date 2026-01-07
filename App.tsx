
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, Question, Difficulty, QuestionType, QuizConfig, SavedBank } from './types';
import { generateQuestionsFromText, extractTextFromImage } from './services/geminiService';
import { extractTextFromPdf } from './services/pdfService';
import { LanguageToggle } from './components/LanguageToggle';
import { QuestionCard } from './components/QuestionCard';
import { 
  Upload, FileText, Image as ImageIcon, Settings, 
  Sparkles, CheckCircle, ChevronLeft, ChevronRight, 
  Download, History, PlayCircle, Loader2, ArrowLeft,
  Trash2, Clock, Calendar, FileType, Trophy, RotateCcw,
  BarChart3, BrainCircuit, XCircle
} from 'lucide-react';

const STORAGE_KEY = 'edugenie_history_v1';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'UPLOAD',
    extractedText: '',
    questions: [],
    currentQuizIndex: 0,
    userAnswers: {},
    showAnswer: false,
    language: 'ar',
    history: [],
  });

  const [config, setConfig] = useState<QuizConfig>({
    numMcq: 5,
    numTf: 3,
    difficulty: Difficulty.MEDIUM,
    language: 'ar',
  });

  const [isExtracting, setIsExtracting] = useState(false);

  // Ensure loading screen is gone when App renders
  useEffect(() => {
    const loader = document.getElementById('app-loading');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => loader.remove(), 500);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, history: parsed }));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    if (state.history.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
    }
  }, [state.history]);

  const isRtl = state.language === 'ar';

  const t = useMemo(() => ({
    title: isRtl ? 'إديو جيني - رفيقك الذكي للدراسة' : 'EduGenie - AI Study Mate',
    subtitle: isRtl ? 'حوّل موادك الدراسية إلى اختبارات ذكية في ثوانٍ' : 'Transform study material into smart quizzes in seconds',
    upload: isRtl ? 'رفع ملف (PDF/صور)' : 'Upload File (PDF/Images)',
    pasteText: isRtl ? 'أو الصق النص هنا مباشرة' : 'Or paste text directly here',
    generate: isRtl ? 'توليد الأسئلة' : 'Generate Questions',
    settings: isRtl ? 'إعدادات الاختبار' : 'Quiz Settings',
    mcqCount: isRtl ? 'عدد أسئلة الاختيار' : 'No. of MCQs',
    tfCount: isRtl ? 'عدد أسئلة صح/خطأ' : 'No. of T/F',
    difficulty: isRtl ? 'مستوى الصعوبة' : 'Difficulty Level',
    easy: isRtl ? 'سهل' : 'Easy',
    medium: isRtl ? 'متوسط' : 'Medium',
    hard: isRtl ? 'صعب' : 'Hard',
    processing: isRtl ? 'جاري التحليل وتوليد الأسئلة...' : 'Analyzing and generating questions...',
    extracting: isRtl ? 'جاري استخراج النص بدقة...' : 'Extracting text with precision...',
    results: isRtl ? 'بنك الأسئلة المولدة' : 'Generated Question Bank',
    startQuiz: isRtl ? 'بدء الاختبار' : 'Start Quiz',
    export: isRtl ? 'تصدير' : 'Export',
    back: isRtl ? 'رجوع' : 'Back',
    next: isRtl ? 'التالي' : 'Next',
    prev: isRtl ? 'السابق' : 'Previous',
    finish: isRtl ? 'إنهاء الاختبار' : 'Finish Quiz',
    score: isRtl ? 'نتيجتك النهائية' : 'Your Final Score',
    quizFinished: isRtl ? 'اكتمل الاختبار!' : 'Quiz Completed!',
    correctAnswers: isRtl ? 'إجابات صحيحة' : 'Correct Answers',
    wrongAnswers: isRtl ? 'إجابات خاطئة' : 'Mistakes',
    review: isRtl ? 'مراجعة وتصحيح الأخطاء' : 'Review & Corrections',
    retake: isRtl ? 'إعادة الاختبار' : 'Retake Quiz',
    history: isRtl ? 'سجل الاختبارات' : 'Quiz History',
    noHistory: isRtl ? 'لا يوجد سجل حالياً' : 'No history found',
    load: isRtl ? 'فتح' : 'Open',
  }), [isRtl]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPdf(file);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        text = await new Promise((resolve, reject) => {
          reader.onload = async () => {
            try {
              const res = await extractTextFromImage(reader.result as string, state.language);
              resolve(res);
            } catch (err) { reject(err); }
          };
          reader.readAsDataURL(file);
        });
      } else {
        text = await file.text();
      }
      
      setState(prev => ({ ...prev, extractedText: text, step: 'PREVIEW' }));
    } catch (error) {
      alert(isRtl ? 'فشل استخراج النص' : 'Failed to extract text.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerate = async () => {
    if (!state.extractedText) return;
    setState(prev => ({ ...prev, step: 'GENERATING' }));
    try {
      const questions = await generateQuestionsFromText(state.extractedText, { ...config, language: state.language });
      
      const newBank: SavedBank = {
        id: `bank-${Date.now()}`,
        timestamp: Date.now(),
        title: state.extractedText.slice(0, 50).replace(/\n/g, ' ') + '...',
        questions,
        config: { ...config }
      };

      setState(prev => ({ 
        ...prev, 
        questions, 
        step: 'RESULTS',
        userAnswers: {}, // Reset answers for new generation
        history: [newBank, ...prev.history]
      }));
    } catch (error) {
      alert(isRtl ? 'خطأ في توليد الأسئلة' : 'Error generating questions.');
      setState(prev => ({ ...prev, step: 'PREVIEW' }));
    }
  };

  const calculateResults = () => {
    let correct = 0;
    let wrong = 0;
    state.questions.forEach(q => {
      const userAns = state.userAnswers[q.id];
      if (q.type === QuestionType.MCQ) {
        if (userAns === q.correctIndex) correct++;
        else wrong++;
      } else {
        if (userAns === q.correctAnswer) correct++;
        else wrong++;
      }
    });
    return { correct, wrong, total: state.questions.length };
  };

  const handleSelectAnswer = (qId: string, value: any) => {
    setState(prev => ({
      ...prev,
      userAnswers: { ...prev.userAnswers, [qId]: value }
    }));
  };

  const startQuiz = () => {
    setState(prev => ({
      ...prev,
      step: 'QUIZ',
      currentQuizIndex: 0,
      userAnswers: {},
    }));
  };

  const renderUpload = () => (
    <div className={`max-w-4xl mx-auto py-12 px-4 animate-fade-in ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-3xl text-white shadow-2xl mb-8">
          <BrainCircuit size={40} />
        </div>
        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">{t.title}</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">{t.subtitle}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white rounded-[48px] shadow-sm border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer relative group">
          {isExtracting ? (
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin text-indigo-600 mb-6" size={48} />
              <p className="text-base font-black text-slate-700 animate-pulse">{t.extracting}</p>
            </div>
          ) : (
            <>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileUpload} accept=".pdf,.txt,image/*" />
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <FileType size={44} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">{t.upload}</h3>
              <p className="text-sm text-slate-400 text-center font-bold">PDF, Images, TXT</p>
            </>
          )}
        </div>

        <div className="bg-white rounded-[48px] shadow-sm border border-slate-200 p-10 flex flex-col">
          <div className="flex items-center gap-2 text-slate-800 font-black mb-6">
            <FileText size={24} className="text-indigo-600" />
            <span>{t.pasteText}</span>
          </div>
          <textarea
            className={`flex-1 min-h-[180px] p-6 bg-slate-50 border border-slate-100 rounded-3xl resize-none focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all text-sm leading-relaxed font-medium text-slate-900 ${isRtl ? 'text-right' : 'text-left'}`}
            placeholder="..."
            value={state.extractedText}
            onChange={(e) => setState(prev => ({ ...prev, extractedText: e.target.value }))}
          />
          {state.extractedText.length > 20 && (
            <button
              onClick={() => setState(prev => ({ ...prev, step: 'PREVIEW' }))}
              className="mt-6 py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 text-lg"
            >
              <Sparkles size={22} />
              {t.generate}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const currentQ = state.questions[state.currentQuizIndex];
    const total = state.questions.length;
    const progress = ((state.currentQuizIndex + 1) / total) * 100;
    const hasAnswered = state.userAnswers[currentQ.id] !== undefined;

    return (
      <div className={`max-w-3xl mx-auto py-8 px-4 animate-fade-in ${isRtl ? 'rtl' : 'ltr'}`}>
        <div className="mb-10 bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
          <div className="flex justify-between items-center mb-5">
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{isRtl ? 'السؤال' : 'Question'} {state.currentQuizIndex + 1} / {total}</span>
            <div className="flex items-center gap-2">
              <div className="w-12 h-1 bg-indigo-100 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-sm font-black text-indigo-600">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>

        <QuestionCard 
          question={currentQ} 
          index={state.currentQuizIndex} 
          lang={state.language} 
          userAnswer={state.userAnswers[currentQ.id]}
          onSelect={(val) => handleSelectAnswer(currentQ.id, val)}
          showAnswerByDefault={false}
          isReviewMode={false}
        />

        <div className="flex justify-between mt-12 gap-5">
          <button
            disabled={state.currentQuizIndex === 0}
            onClick={() => setState(prev => ({ ...prev, currentQuizIndex: prev.currentQuizIndex - 1 }))}
            className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
          >
            <ChevronRight className={isRtl ? '' : 'rotate-180'} size={24} />
            {t.prev}
          </button>

          {state.currentQuizIndex === total - 1 ? (
            <button
              disabled={!hasAnswered}
              onClick={() => setState(prev => ({ ...prev, step: 'QUIZ_SUMMARY' }))}
              className="flex-[2] flex items-center justify-center gap-3 px-10 py-5 bg-emerald-600 text-white rounded-3xl font-black hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 disabled:opacity-50"
            >
              <CheckCircle size={24} />
              {t.finish}
            </button>
          ) : (
            <button
              disabled={!hasAnswered}
              onClick={() => setState(prev => ({ ...prev, currentQuizIndex: prev.currentQuizIndex + 1 }))}
              className="flex-[2] flex items-center justify-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 disabled:opacity-50"
            >
              {t.next}
              <ChevronLeft className={isRtl ? '' : 'rotate-180'} size={24} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderQuizSummary = () => {
    const { correct, wrong, total } = calculateResults();
    const percentage = Math.round((correct / total) * 100);
    
    return (
      <div className={`max-w-2xl mx-auto py-16 px-4 animate-fade-in text-center ${isRtl ? 'rtl' : 'ltr'}`}>
        <div className="bg-white rounded-[64px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-12 sm:p-16 border border-slate-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-indigo-500 to-emerald-500" />
          
          <div className="inline-flex items-center justify-center w-32 h-32 bg-indigo-50 text-indigo-600 rounded-[40px] mb-10 rotate-3 shadow-inner">
            <Trophy size={64} className="-rotate-3" />
          </div>

          <h2 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">{t.quizFinished}</h2>
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs mb-16">{t.score}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
            <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 flex flex-col items-center">
               <span className="text-6xl font-black text-indigo-600 mb-3">{percentage}%</span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'معدل النجاح' : 'Success Rate'}</span>
            </div>
            <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 flex flex-col items-center">
               <div className="flex items-center gap-4 mb-3">
                  <div className="flex flex-col items-center">
                     <span className="text-4xl font-black text-emerald-600">{correct}</span>
                     <CheckCircle size={16} className="text-emerald-500" />
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="flex flex-col items-center">
                     <span className="text-4xl font-black text-red-500">{wrong}</span>
                     <XCircle size={16} className="text-red-400" />
                  </div>
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.correctAnswers} / {t.wrongAnswers}</span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
             <button 
               onClick={() => setState(prev => ({ ...prev, step: 'RESULTS' }))}
               className="w-full py-6 bg-indigo-600 text-white rounded-[28px] font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 flex items-center justify-center gap-4 group"
             >
                <BarChart3 size={24} className="group-hover:scale-110 transition-transform" />
                {t.review}
             </button>
             <button 
               onClick={startQuiz}
               className="w-full py-6 bg-white border-2 border-slate-100 text-slate-700 rounded-[28px] font-black text-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-4"
             >
                <RotateCcw size={24} />
                {t.retake}
             </button>
             <button 
               onClick={() => setState(prev => ({ ...prev, step: 'UPLOAD' }))}
               className="mt-6 text-slate-400 font-black text-sm hover:text-indigo-600 transition-colors uppercase tracking-widest"
             >
                {isRtl ? 'إنشاء اختبار جديد' : 'Generate New Test'}
             </button>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const isFromQuiz = Object.keys(state.userAnswers).length > 0;
    
    return (
      <div className={`max-w-4xl mx-auto py-12 px-4 animate-fade-in ${isRtl ? 'rtl' : 'ltr'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-end mb-12 gap-8">
          <div>
            <button 
              onClick={() => setState(prev => ({ ...prev, step: isFromQuiz ? 'QUIZ_SUMMARY' : 'UPLOAD' }))}
              className="flex items-center gap-2 text-slate-400 font-black mb-6 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={20} className={isRtl ? '' : 'rotate-180'} />
              {t.back}
            </button>
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">{isFromQuiz ? t.review : t.results}</h2>
            <p className="text-slate-400 font-bold">{state.questions.length} {isRtl ? 'سؤال متوفر' : 'Questions Available'}</p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
             {!isFromQuiz ? (
               <button onClick={startQuiz} className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-3xl hover:bg-indigo-700 transition-all text-lg font-black shadow-2xl shadow-indigo-200">
                 <PlayCircle size={24} />
                 {t.startQuiz}
               </button>
             ) : (
               <button onClick={startQuiz} className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-white border-2 border-slate-100 text-slate-700 rounded-3xl hover:bg-slate-50 transition-all text-lg font-black">
                 <RotateCcw size={24} />
                 {t.retake}
               </button>
             )}
          </div>
        </div>

        <div className="space-y-8 pb-20">
          {state.questions.map((q, idx) => (
            <QuestionCard 
              key={q.id} 
              question={q} 
              index={idx} 
              lang={state.language} 
              userAnswer={state.userAnswers[q.id]}
              isReviewMode={isFromQuiz}
              showAnswerByDefault={isFromQuiz}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className={`max-w-4xl mx-auto py-12 px-4 animate-fade-in ${isRtl ? 'rtl' : 'ltr'}`}>
      <button 
        onClick={() => setState(prev => ({ ...prev, step: 'UPLOAD' }))}
        className="flex items-center gap-2 text-slate-400 font-black mb-12 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={20} className={isRtl ? '' : 'rotate-180'} />
        {t.back}
      </button>

      <div className="flex items-center justify-between mb-12">
        <h2 className="text-4xl font-black text-slate-900 flex items-center gap-5 tracking-tighter">
          <History size={48} className="text-indigo-600" />
          {t.history}
        </h2>
      </div>

      {state.history.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[64px] border border-slate-100 shadow-sm">
          <History size={80} className="mx-auto text-slate-100 mb-8" />
          <p className="text-slate-400 font-black text-2xl tracking-tight">{t.noHistory}</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {state.history.map(item => (
            <div 
              key={item.id}
              onClick={() => {
                setState(prev => ({
                  ...prev,
                  questions: item.questions,
                  step: 'RESULTS',
                  userAnswers: {},
                }));
                setConfig(item.config);
              }}
              className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                  <PlayCircle size={40} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900 mb-3 line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                  <div className="flex items-center gap-6 text-sm text-slate-400 font-black tracking-wide">
                    <span className="flex items-center gap-2"><Calendar size={16} /> {new Date(item.timestamp).toLocaleDateString()}</span>
                    <span className="flex items-center gap-2"><FileText size={16} /> {item.questions.length} {isRtl ? 'سؤال' : 'Questions'}</span>
                  </div>
                </div>
              </div>
              <div className="px-8 py-4 bg-slate-50 text-indigo-600 rounded-[24px] font-black text-base group-hover:bg-indigo-50 transition-colors">{t.load}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-32 bg-[#F8FAFC]">
      <header className="bg-white/90 backdrop-blur-2xl border-b border-slate-100 sticky top-0 z-50 shadow-sm h-24 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setState(prev => ({ ...prev, step: 'UPLOAD' }))}>
            <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform">
              <Sparkles size={32} />
            </div>
            <span className="font-black text-3xl tracking-tighter text-indigo-950 hidden sm:block">EduGenie</span>
          </div>
          
          <div className="flex items-center gap-5">
            <LanguageToggle 
              lang={state.language} 
              onToggle={(lang) => {
                setState(prev => ({ ...prev, language: lang }));
                setConfig(prev => ({ ...prev, language: lang }));
                document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
                document.documentElement.lang = lang;
              }} 
            />
            <button 
              onClick={() => setState(prev => ({ ...prev, step: 'HISTORY' }))} 
              className={`w-14 h-14 rounded-[20px] flex items-center justify-center transition-all shadow-sm border ${
                state.step === 'HISTORY' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100 hover:text-indigo-600 hover:border-indigo-100'
              }`}
            >
              <History size={28} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {state.step === 'UPLOAD' && renderUpload()}
        {state.step === 'HISTORY' && renderHistory()}
        {state.step === 'PREVIEW' && (
          <div className={`max-w-4xl mx-auto py-12 px-4 animate-fade-in ${isRtl ? 'rtl' : 'ltr'}`}>
             <button onClick={() => setState(prev => ({ ...prev, step: 'UPLOAD' }))} className="flex items-center gap-2 text-slate-400 font-black mb-10 hover:text-indigo-600 transition-colors">
               <ArrowLeft size={20} className={isRtl ? '' : 'rotate-180'} />
               {t.back}
             </button>
             <div className="bg-white rounded-[64px] shadow-2xl border border-slate-50 p-12 sm:p-16">
               <div className="grid sm:grid-cols-3 gap-8 mb-12">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.mcqCount}</label>
                    <input type="number" value={config.numMcq} onChange={e => setConfig({...config, numMcq: parseInt(e.target.value)||0})} className="w-full p-6 bg-slate-50 rounded-3xl font-black text-lg border-none outline-none ring-4 ring-transparent focus:ring-indigo-100 transition-all text-slate-900"/>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tfCount}</label>
                    <input type="number" value={config.numTf} onChange={e => setConfig({...config, numTf: parseInt(e.target.value)||0})} className="w-full p-6 bg-slate-50 rounded-3xl font-black text-lg border-none outline-none ring-4 ring-transparent focus:ring-indigo-100 transition-all text-slate-900"/>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.difficulty}</label>
                    <select value={config.difficulty} onChange={e => setConfig({...config, difficulty: e.target.value as Difficulty})} className="w-full p-6 bg-slate-50 rounded-3xl font-black text-lg border-none outline-none cursor-pointer text-slate-900">
                       <option value={Difficulty.EASY}>{t.easy}</option>
                       <option value={Difficulty.MEDIUM}>{t.medium}</option>
                       <option value={Difficulty.HARD}>{t.hard}</option>
                    </select>
                  </div>
               </div>
               <div className="p-8 bg-slate-50 rounded-[48px] text-base text-slate-900 max-h-80 overflow-y-auto mb-12 whitespace-pre-wrap font-medium leading-relaxed border border-slate-100">
                 {state.extractedText}
               </div>
               <button onClick={handleGenerate} className="w-full py-6 bg-indigo-600 text-white rounded-[28px] font-black text-2xl shadow-[0_24px_48px_-12px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
                 <Sparkles size={28} />
                 {t.generate}
               </button>
             </div>
          </div>
        )}
        {state.step === 'GENERATING' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in text-center px-4">
             <div className="relative mb-12">
               <Loader2 size={80} className="text-indigo-600 animate-spin" />
               <Sparkles size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
             </div>
             <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">{t.processing}</h2>
             <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">AI is building your study session...</p>
          </div>
        )}
        {state.step === 'RESULTS' && renderResults()}
        {state.step === 'QUIZ' && renderQuiz()}
        {state.step === 'QUIZ_SUMMARY' && renderQuizSummary()}
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-3xl border border-slate-200/50 px-10 py-5 rounded-[40px] sm:hidden flex gap-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] z-50">
        <button onClick={() => setState(prev => ({ ...prev, step: 'UPLOAD' }))} className={`transition-all ${state.step === 'UPLOAD' ? 'text-indigo-600 scale-125' : 'text-slate-300'}`}>
          <Upload size={28} />
        </button>
        <button onClick={() => setState(prev => ({ ...prev, step: 'HISTORY' }))} className={`transition-all ${state.step === 'HISTORY' ? 'text-indigo-600 scale-125' : 'text-slate-300'}`}>
          <History size={28} />
        </button>
        <button onClick={() => state.questions.length > 0 && startQuiz()} className={`transition-all ${state.step === 'QUIZ' || state.step === 'QUIZ_SUMMARY' ? 'text-indigo-600 scale-125' : state.questions.length > 0 ? 'text-slate-500' : 'text-slate-200'}`}>
          <PlayCircle size={28} />
        </button>
      </nav>
    </div>
  );
};

export default App;
