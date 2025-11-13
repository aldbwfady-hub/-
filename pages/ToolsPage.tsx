

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tool, GeneratedQuestion, QuestionType, QuestionDifficulty, ShortAnswerEvaluation, MindMapNode, IQTestTopic, IQTestDifficulty as IQD, IQQuestion } from '../types';
import { summarizeText, generateQuestions, generateMindMapData, generateSpeech, extractTextFromImage, generateExamples, evaluateShortAnswer, generateIQTest, getIQTestFeedback } from '../services/geminiService';
import { SummarizeIcon, QuestionerIcon, MindMapIcon, TtsIcon, BrainIcon, BackIcon, ArrowRightIcon, FileUploadIcon, CameraIcon, SparklesIcon, PencilIcon, ClipboardIcon, CheckmarkIcon, MaleIcon, FemaleIcon, PlayIcon, PauseIcon, DownloadIcon } from '../components/icons/Icons';

// --- Individual Tool Components ---

type SummarySize = 'short' | 'medium' | 'long';
type SummaryLevel = 'simple' | 'school' | 'detailed';


const SummarizerTool: React.FC = () => {
    const [view, setView] = useState<'form' | 'result'>('form');
    const [text, setText] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [summarySize, setSummarySize] = useState<SummarySize>('medium');
    const [summaryLevel, setSummaryLevel] = useState<SummaryLevel>('school');
    const [summary, setSummary] = useState('');
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
    const [generatedExamples, setGeneratedExamples] = useState('');
    const [isGeneratingExtras, setIsGeneratingExtras] = useState<'questions' | 'examples' | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [showAnswers, setShowAnswers] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve({ data: reader.result.split(',')[1], mimeType: file.type });
                } else {
                    reject(new Error('Failed to read file.'));
                }
            };
            reader.onerror = (error) => reject(error);
        });

    const resetForm = useCallback(() => {
        setText('');
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
    }, [imagePreview]);

    const handleImageInput = useCallback(async (file: File | null) => {
        if (!file) return;
        resetForm();
        setImagePreview(URL.createObjectURL(file));
        setIsLoading(true);
        setLoadingMessage('جاري استخراج النص من الصورة...');
        try {
            const { data, mimeType } = await fileToBase64(file);
            const extracted = await extractTextFromImage(data, mimeType);
            if (extracted.includes("خطأ") || extracted.includes("لم يتم العثور")) {
                setError(extracted);
                resetForm();
            } else {
                setText(extracted);
            }
        } catch (e) {
            setError('فشل في معالجة الصورة.');
            resetForm();
        } finally {
            setIsLoading(false);
        }
    }, [resetForm]);
    
    const handleSummarize = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        setError('');
        setSummary('');
        setGeneratedQuestions([]);
        setGeneratedExamples('');
        setShowAnswers(false);
        
        const messages = ["جاري تحليل المحتوى...", "صياغة الأفكار الرئيسية...", "تجهيز الملخص..."];
        let msgIndex = 0;
        const interval = setInterval(() => { setLoadingMessage(messages[msgIndex++ % messages.length]); }, 2000);
        
        const result = await summarizeText(text, summarySize, summaryLevel);
        clearInterval(interval);
        
        if (result.includes("خطأ")) {
             setError(result);
        } else {
            setSummary(result);
            setView('result');
        }
        setIsLoading(false);
    };

    const handleGenerateExtras = async (type: 'questions' | 'examples') => {
        setIsGeneratingExtras(type);
        if (type === 'questions') {
            const result = await generateQuestions(summary, 'mcq', 'medium', 5);
            try {
                const parsed = JSON.parse(result);
                if (parsed.error) setError(parsed.error);
                else setGeneratedQuestions(parsed.questions || []);
            } catch (e) { setError('فشل في تحليل استجابة الخادم.'); }
        } else {
            const result = await generateExamples(summary);
            if (result.includes("خطأ")) setError(result);
            else setGeneratedExamples(result);
        }
        setIsGeneratingExtras(null);
    };
    
    const handleRestart = () => {
        setView('form');
        resetForm();
    };
    
    const handleCopy = () => {
        if (!summary) return;
        navigator.clipboard.writeText(summary);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const StepCard: React.FC<{number: number, title: string, children: React.ReactNode}> = ({number, title, children}) => (
        <div className="group relative bg-surface p-6 rounded-2xl border border-weak transition-all duration-300 hover:border-primary-400/50 hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-black/20 hover:-translate-y-2">
            <div className="absolute -top-6 right-6 w-12 h-12 flex items-center justify-center bg-primary-500 text-white font-bold text-xl rounded-full transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-6 group-hover:bg-primary-600 shadow-lg shadow-primary-500/30">
                {number}
            </div>
            <div className="pt-4">
                <h3 className="text-lg font-bold mb-3">{title}</h3>
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
    
    const SegmentedControl: React.FC<{options: {value: string, label: string}[], selected: string, onSelect: (value: any) => void}> = ({ options, selected, onSelect }) => (
        <div className="w-full bg-[rgba(var(--color-text-rgb),0.05)] rounded-lg p-1.5 grid grid-cols-3 gap-1">
            {options.map(opt => (
                <button key={opt.value} onClick={() => onSelect(opt.value)} className={`w-full text-center p-2 rounded-md transition-all font-semibold text-sm ${selected === opt.value ? 'bg-surface shadow-sm text-primary-600 dark:text-primary-300' : 'text-secondary hover:bg-[rgba(var(--color-surface-rgb),0.5)]'}`}>
                    {opt.label}
                </button>
            ))}
        </div>
    );
    
    const sizeOptions = [{value: 'short', label: 'قصير'}, {value: 'medium', label: 'متوسط'}, {value: 'long', label: 'مفصل'}];
    const levelOptions = [{value: 'simple', label: 'مبسط'}, {value: 'school', label: 'مدرسي'}, {value: 'detailed', label: 'أكاديمي'}];

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center text-center h-full p-6">
             <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-4 font-semibold text-secondary transition-all">{loadingMessage}</p>
        </div>
    );

    if (view === 'result') return (
        <div className="space-y-6 animate-fade-in">
             <button onClick={handleRestart} className="flex items-center gap-2 mb-2 text-secondary hover:text-primary-500 dark:hover:text-primary-400 font-semibold transition-colors self-start">
                <ArrowRightIcon />
                <span>البدء من جديد</span>
            </button>
            <div className="bg-surface p-5 rounded-xl border border-weak space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-lg">الملخص</h4>
                    <button onClick={handleCopy} className={`text-sm font-semibold flex items-center gap-1.5 py-1 px-2.5 rounded-full transition-all ${copySuccess ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300' : 'bg-[rgba(var(--color-text-rgb),0.1)] text-secondary hover:opacity-80'}`}>
                        {copySuccess ? <CheckmarkIcon/> : <ClipboardIcon/>}
                        <span>{copySuccess ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
            </div>
            
            <div className="space-y-4">
                <h4 className="font-semibold text-center text-secondary">التعلم النشط</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => handleGenerateExtras('questions')} disabled={!!isGeneratingExtras} className="flex items-center justify-center gap-2 bg-[rgba(var(--color-text-rgb),0.05)] py-3 font-bold rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.1)] disabled:opacity-50 transition-all">
                        {isGeneratingExtras === 'questions' ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <QuestionerIcon />}
                        <span>إنشاء أسئلة</span>
                    </button>
                    <button onClick={() => handleGenerateExtras('examples')} disabled={!!isGeneratingExtras} className="flex items-center justify-center gap-2 bg-[rgba(var(--color-text-rgb),0.05)] py-3 font-bold rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.1)] disabled:opacity-50 transition-all">
                        {isGeneratingExtras === 'examples' ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon />}
                        <span>إنشاء أمثلة</span>
                    </button>
                </div>
            </div>

            {generatedQuestions.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold">اختبر فهمك:</h4>
                        <button onClick={() => setShowAnswers(s => !s)} className="text-sm font-semibold text-primary-600 dark:text-primary-300">{showAnswers ? 'إخفاء الإجابات' : 'إظهار الإجابات'}</button>
                    </div>
                    {generatedQuestions.map((q, i) => (
                        <div key={i} className="p-4 bg-surface rounded-md border border-weak">
                            <p className="font-semibold">{i + 1}. {q.question}</p>
                            <ul className="list-inside mt-2 space-y-2">
                                {q.options?.map((opt, j) => (
                                    <li key={j} className={`text-sm rounded p-2 transition-colors ${showAnswers && (opt === q.correctAnswer ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold' : 'opacity-60')}`}>
                                        - {opt}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
             {generatedExamples && (
                <div className="p-4 bg-surface rounded-md border border-weak space-y-3">
                    <h4 className="font-bold mb-2">أمثلة توضيحية:</h4>
                    <p className="whitespace-pre-wrap leading-relaxed">{generatedExamples}</p>
                </div>
            )}

        </div>
    );
    
    return (
        <div className="space-y-6">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={e => handleImageInput(e.target.files?.[0])} className="hidden" />
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={e => handleImageInput(e.target.files?.[0])} className="hidden" />
            
            <StepCard number={1} title="أدخل المحتوى">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="الصق النص هنا، أو استخدم الأزرار أدناه..."
                    className="w-full h-40 p-3 bg-[rgba(var(--color-text-rgb),0.03)] border-2 border-weak rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                />
                {imagePreview && (
                    <div className="relative w-28 h-28 mt-2 p-1.5 bg-surface-backdrop rounded-lg border border-weak">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded"/>
                        <button onClick={resetForm} type="button" className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full text-sm font-bold">✕</button>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-3 mt-3">
                     <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-[rgba(var(--color-text-rgb),0.05)] py-3 font-bold rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.1)] transition-all"><FileUploadIcon/> <span>رفع صورة</span></button>
                     <button onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-[rgba(var(--color-text-rgb),0.05)] py-3 font-bold rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.1)] transition-all"><CameraIcon/> <span>استخدام الكاميرا</span></button>
                </div>
            </StepCard>

            <StepCard number={2} title="خصّص الملخص">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-secondary mb-2">حجم التلخيص</h4>
                        <SegmentedControl options={sizeOptions} selected={summarySize} onSelect={setSummarySize} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-secondary mb-2">مستوى التلخيص</h4>
                        <SegmentedControl options={levelOptions} selected={summaryLevel} onSelect={setSummaryLevel} />
                    </div>
                </div>
            </StepCard>

            <button onClick={handleSummarize} disabled={!text.trim()} className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 text-lg font-bold rounded-xl hover:bg-primary-500 disabled:bg-gray-400 transition-all duration-200 transform active:scale-95 shadow-lg shadow-primary-500/20">
                <SparklesIcon />
                <span>ابدأ التلخيص</span>
            </button>
            {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
        </div>
    );
};


const QuestionGeneratorTool: React.FC = () => {
    // --- State Management ---
    const [view, setView] = useState<'form' | 'generating' | 'test' | 'results'>('form');
    const [text, setText] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    
    // Customization State
    const [questionType, setQuestionType] = useState<QuestionType>('mcq');
    const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium');
    const [numQuestions, setNumQuestions] = useState(5);

    // Test & Results State
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<number, string | boolean>>({});
    const [evaluations, setEvaluations] = useState<Record<number, ShortAnswerEvaluation>>({});
    const [isEvaluating, setIsEvaluating] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // --- Helper Components ---
    const StepCard: React.FC<{number: number, title: string, children: React.ReactNode, className?: string}> = ({number, title, children, className}) => (
        <div className={`group relative bg-surface p-6 rounded-2xl border border-weak transition-all duration-300 hover:border-primary-400/50 hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-black/20 hover:-translate-y-2 ${className}`}>
            <div className="absolute -top-6 right-6 w-12 h-12 flex items-center justify-center bg-primary-500 text-white font-bold text-xl rounded-full transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-6 group-hover:bg-primary-600 shadow-lg shadow-primary-500/30">
                {number}
            </div>
            <div className="pt-4">
                <h3 className="text-lg font-bold mb-3">{title}</h3>
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
    
    const SegmentedControl: React.FC<{options: {value: string, label: string}[], selected: string, onSelect: (value: any) => void}> = ({ options, selected, onSelect }) => (
        <div className={`w-full bg-[rgba(var(--color-text-rgb),0.05)] rounded-lg p-1.5 grid grid-cols-${options.length} gap-1`}>
            {options.map(opt => (
                <button key={opt.value} onClick={() => onSelect(opt.value)} className={`w-full text-center p-2 rounded-md transition-all font-semibold text-sm ${selected === opt.value ? 'bg-surface shadow-sm text-primary-600 dark:text-primary-300' : 'text-secondary hover:bg-[rgba(var(--color-surface-rgb),0.5)]'}`}>
                    {opt.label}
                </button>
            ))}
        </div>
    );
    
    // --- Logic and Handlers ---
    const resetForm = useCallback(() => {
        setText('');
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
    }, [imagePreview]);

    const handleImageInput = useCallback(async (file: File | null) => {
        if (!file) return;
        setImagePreview(URL.createObjectURL(file));
        setIsLoading(true);
        setLoadingMessage('جاري استخراج النص من الصورة...');
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const extracted = await extractTextFromImage(base64, file.type);
                if (extracted.includes("خطأ") || extracted.includes("لم يتم العثور")) {
                    setError(extracted);
                } else {
                    setText(prev => `${prev}\n\n--- نص من صورة ---\n${extracted}`.trim());
                }
                setIsLoading(false);
            };
        } catch (e) {
            setError('فشل في معالجة الصورة.');
            setIsLoading(false);
        }
    }, []);

    const handleGenerate = async () => {
        if (!text.trim()) {
            setError('الرجاء إدخال نص لإنشاء الأسئلة.');
            return;
        }
        setError('');
        setView('generating');
        const messages = ["نفهم الموضوع الذي أدخلته...", "نصمم أسئلة تتناسب مع المستوى...", "نجهز لك الاختبار الآن..."];
        let msgIndex = 0;
        setLoadingMessage(messages[0]);
        const interval = setInterval(() => setLoadingMessage(messages[++msgIndex % messages.length]), 2500);
        
        const result = await generateQuestions(text, questionType, difficulty, numQuestions);
        clearInterval(interval);
        
        try {
            const parsed = JSON.parse(result);
            if (parsed.error) {
                setError(parsed.error);
                setView('form');
            } else {
                setGeneratedQuestions(parsed.questions || []);
                setUserAnswers({});
                setEvaluations({});
                setView('test');
            }
        } catch (e) {
            setError('فشل في تحليل استجابة الخادم. قد يكون النص غير كافٍ.');
            setView('form');
        }
    };
    
    const handleAnswerChange = (index: number, answer: string | boolean) => {
        setUserAnswers(prev => ({ ...prev, [index]: answer }));
    };

    const handleSubmitTest = async () => {
        setIsEvaluating(true);
        const shortAnswerPromises: Promise<void>[] = [];
        const newEvaluations: Record<number, ShortAnswerEvaluation> = {};

        generatedQuestions.forEach((q, index) => {
            if (q.type === 'short') {
                const userAnswer = userAnswers[index] as string || "";
                if (userAnswer.trim()) {
                    const promise = evaluateShortAnswer(userAnswer, q.idealAnswer || "")
                        .then(res => {
                            try {
                                newEvaluations[index] = JSON.parse(res);
                            } catch {
                                newEvaluations[index] = { score: 0, feedback: "خطأ في التقييم" };
                            }
                        });
                    shortAnswerPromises.push(promise);
                }
            }
        });
        
        await Promise.all(shortAnswerPromises);
        setEvaluations(newEvaluations);
        setIsEvaluating(false);
        setView('results');
    };
    
    const handleRestart = () => {
        setView('form');
        setTimeout(() => {
            resetForm();
            setError('');
            setGeneratedQuestions([]);
            setUserAnswers({});
            setEvaluations({});
        }, 300); // Allow for transition
    };

    // --- Render Views ---
    if (view === 'generating' || isEvaluating) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-full p-6 animate-fade-in">
                 <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="mt-4 text-lg font-semibold text-secondary transition-all">
                    {isEvaluating ? 'جاري تقييم إجاباتك...' : loadingMessage}
                 </p>
            </div>
        );
    }
    
    if (view === 'test') {
        return (
            <div className="space-y-4 animate-fade-in">
                {generatedQuestions.map((q, index) => (
                    <div key={index} className="p-4 bg-surface rounded-lg border border-weak">
                        <p className="font-semibold mb-3">{index + 1}. {q.question}</p>
                        {q.type === 'mcq' && q.options && (
                            <div className="space-y-2">
                                {q.options.map(opt => (
                                    <label key={opt} className="flex items-center gap-3 p-3 rounded-md bg-[rgba(var(--color-bg-rgb),0.5)] cursor-pointer has-[:checked]:bg-primary-500/10 has-[:checked]:ring-2 has-[:checked]:ring-primary-500">
                                        <input type="radio" name={`q-${index}`} value={opt} onChange={e => handleAnswerChange(index, e.target.value)} className="w-4 h-4 text-primary-600 bg-transparent border-weak focus:ring-primary-500" />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {q.type === 'tf' && (
                             <div className="flex gap-3">
                                <label className="flex-1 flex items-center justify-center gap-3 p-3 rounded-md bg-[rgba(var(--color-bg-rgb),0.5)] cursor-pointer has-[:checked]:bg-primary-500/10 has-[:checked]:ring-2 has-[:checked]:ring-primary-500">
                                    <input type="radio" name={`q-${index}`} value="true" onChange={() => handleAnswerChange(index, true)} className="w-4 h-4 text-primary-600 bg-transparent border-weak focus:ring-primary-500" />
                                    <span>صح</span>
                                </label>
                                <label className="flex-1 flex items-center justify-center gap-3 p-3 rounded-md bg-[rgba(var(--color-bg-rgb),0.5)] cursor-pointer has-[:checked]:bg-primary-500/10 has-[:checked]:ring-2 has-[:checked]:ring-primary-500">
                                    <input type="radio" name={`q-${index}`} value="false" onChange={() => handleAnswerChange(index, false)} className="w-4 h-4 text-primary-600 bg-transparent border-weak focus:ring-primary-500" />
                                    <span>خطأ</span>
                                </label>
                            </div>
                        )}
                         {q.type === 'short' && (
                            <textarea
                                placeholder="اكتب إجابتك هنا..."
                                onChange={e => handleAnswerChange(index, e.target.value)}
                                className="w-full p-3 bg-[rgba(var(--color-bg-rgb),0.5)] border border-weak rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        )}
                    </div>
                ))}
                <button onClick={handleSubmitTest} className="w-full bg-primary-600 text-white py-3 font-bold rounded-lg hover:bg-primary-500 transition-colors">
                    إظهار الحل والتقييم
                </button>
            </div>
        )
    }

    if (view === 'results') {
        let correctCount = 0;
        generatedQuestions.forEach((q, i) => {
            if (q.type !== 'short' && userAnswers[i] === q.correctAnswer) {
                correctCount++;
            }
        });

        return (
            <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-surface rounded-lg text-center">
                    <h3 className="text-xl font-bold">النتائج</h3>
                    <p className="mt-1">
                        أجبت بشكل صحيح على <span className="font-bold text-primary-500">{correctCount}</span> من أصل <span className="font-bold">{generatedQuestions.filter(q => q.type !== 'short').length}</span> سؤال موضوعي.
                    </p>
                </div>
                {generatedQuestions.map((q, index) => {
                    const userAnswer = userAnswers[index];
                    const isCorrect = q.type !== 'short' && userAnswer === q.correctAnswer;
                    const evaluation = evaluations[index];

                    return (
                        <div key={index} className="p-4 bg-surface rounded-lg border border-weak">
                            <p className="font-semibold mb-3">{index + 1}. {q.question}</p>
                             {q.type === 'mcq' && q.options?.map(opt => {
                                const isUserAnswer = userAnswer === opt;
                                const isCorrectAnswer = q.correctAnswer === opt;
                                let bgClass = 'bg-[rgba(var(--color-bg-rgb),0.5)]';
                                if (isCorrectAnswer) bgClass = 'bg-green-100 dark:bg-green-900/50';
                                if (isUserAnswer && !isCorrectAnswer) bgClass = 'bg-red-100 dark:bg-red-900/50';
                                return <div key={opt} className={`p-2 rounded mt-1 ${bgClass}`}>{opt}</div>
                            })}
                             {q.type === 'tf' && (
                                 <p className={`p-2 rounded font-semibold ${isCorrect ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}>
                                    إجابتك: {userAnswer ? "صح" : "خطأ"} - الإجابة الصحيحة: {q.correctAnswer ? "صح" : "خطأ"}
                                 </p>
                            )}
                            {q.type === 'short' && (
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="font-semibold text-sm text-secondary">إجابتك:</h4>
                                        <p className="p-2 bg-[rgba(var(--color-bg-rgb),0.5)] rounded">{userAnswer as string || "لم تجب"}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-green-600 dark:text-green-300">الإجابة النموذجية:</h4>
                                        <p className="p-2 bg-green-100 dark:bg-green-900/50 rounded">{q.idealAnswer}</p>
                                    </div>
                                    {evaluation && (
                                        <div>
                                            <h4 className="font-semibold text-sm text-secondary">التقييم الذكي:</h4>
                                            <div className="p-3 bg-[rgba(var(--color-bg-rgb),0.5)] rounded space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-lg text-primary-600 dark:text-primary-300">{evaluation.score}/10</span>
                                                    <div className="w-full bg-[rgba(var(--color-text-rgb),0.1)] rounded-full h-4">
                                                        <div className="bg-primary-500 h-4 rounded-full" style={{ width: `${evaluation.score * 10}%` }}></div>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-secondary italic">"{evaluation.feedback}"</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                <button onClick={handleRestart} className="w-full bg-primary-600 text-white py-3 font-bold rounded-lg hover:bg-primary-500 transition-colors">
                    إنشاء اختبار جديد
                </button>
            </div>
        )
    }

    const questionTypeOptions = [{value: 'mcq', label: 'اختيار من متعدد'}, {value: 'tf', label: 'صح / خطأ'}, {value: 'short', label: 'إجابة قصيرة'}];
    const difficultyOptions = [{value: 'easy', label: 'سهل'}, {value: 'medium', label: 'متوسط'}, {value: 'hard', label: 'صعب'}];

    return (
         <div className="space-y-6">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={e => handleImageInput(e.target.files?.[0])} className="hidden" />
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={e => handleImageInput(e.target.files?.[0])} className="hidden" />

             <StepCard number={1} title="أدخل المحتوى الدراسي">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="الصق النص هنا، أو ارفق صورة..."
                    className="w-full h-40 p-3 bg-[rgba(var(--color-text-rgb),0.03)] border-2 border-weak rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                />
                 {imagePreview && (
                    <div className="relative w-28 h-28 mt-2 p-1.5 bg-surface-backdrop rounded-lg border border-weak">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded"/>
                        <button onClick={() => {setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; if (cameraInputRef.current) cameraInputRef.current.value = "";}} type="button" className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full text-sm font-bold">✕</button>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-3 mt-3">
                     <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex items-center justify-center gap-2 bg-[rgba(var(--color-text-rgb),0.05)] py-3 font-bold rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.1)] transition-all disabled:opacity-50"><FileUploadIcon/> <span>رفع صورة</span></button>
                     <button onClick={() => cameraInputRef.current?.click()} disabled={isLoading} className="flex items-center justify-center gap-2 bg-[rgba(var(--color-text-rgb),0.05)] py-3 font-bold rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.1)] transition-all disabled:opacity-50"><CameraIcon/> <span>الكاميرا</span></button>
                </div>
            </StepCard>

            <StepCard number={2} title="خصّص الاختبار">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-secondary mb-2">نوع الأسئلة</h4>
                        <SegmentedControl options={questionTypeOptions} selected={questionType} onSelect={setQuestionType} />
                    </div>
                     <div>
                        <h4 className="font-semibold text-secondary mb-2">مستوى الصعوبة</h4>
                        <SegmentedControl options={difficultyOptions} selected={difficulty} onSelect={setDifficulty} />
                    </div>
                     <div>
                        <h4 className="font-semibold text-secondary mb-2">عدد الأسئلة</h4>
                        <div className="flex items-center justify-between bg-[rgba(var(--color-text-rgb),0.05)] rounded-lg p-2">
                             <button onClick={() => setNumQuestions(n => Math.max(1, n - 1))} className="w-10 h-10 font-bold text-2xl bg-surface rounded-md shadow-sm">-</button>
                             <span className="text-xl font-bold">{numQuestions}</span>
                             <button onClick={() => setNumQuestions(n => Math.min(10, n + 1))} className="w-10 h-10 font-bold text-2xl bg-surface rounded-md shadow-sm">+</button>
                        </div>
                    </div>
                </div>
            </StepCard>

            <button onClick={handleGenerate} disabled={!text.trim() || isLoading} className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 text-lg font-bold rounded-xl hover:bg-primary-500 disabled:bg-gray-400 transition-all duration-200 transform active:scale-95 shadow-lg shadow-primary-500/20">
                <SparklesIcon />
                <span>إنشاء الأسئلة</span>
            </button>
            {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
        </div>
    );
};

const MindMapGeneratorTool: React.FC = () => {
    // --- State Management ---
    const [view, setView] = useState<'form' | 'loading' | 'result'>('form');
    const [text, setText] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');

    // Customization State
    const [layout, setLayout] = useState<'tree' | 'central'>('tree');
    type Density = 'brief' | 'medium' | 'detailed';
    const [density, setDensity] = useState<Density>('medium');
    const [colorScheme, setColorScheme] = useState<'bright' | 'formal' | 'calm'>('bright');

    // Result State
    const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // --- Helper Components ---
    const StepCard: React.FC<{number: number, title: string, children: React.ReactNode, className?: string}> = ({number, title, children, className}) => (
        <div className={`group relative bg-surface p-6 rounded-2xl border border-weak transition-all duration-300 hover:border-primary-400/50 hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-black/20 hover:-translate-y-2 ${className}`}>
            <div className="absolute -top-6 right-6 w-12 h-12 flex items-center justify-center bg-primary-500 text-white font-bold text-xl rounded-full transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-6 group-hover:bg-primary-600 shadow-lg shadow-primary-500/30">
                {number}
            </div>
            <div className="pt-4">
                <h3 className="text-lg font-bold mb-3">{title}</h3>
                <div>
                    {children}
                </div>
            </div>
        </div>
    );

    const SegmentedControl: React.FC<{options: {value: string, label: string}[], selected: string, onSelect: (value: any) => void}> = ({ options, selected, onSelect }) => (
        <div className={`w-full bg-[rgba(var(--color-text-rgb),0.05)] rounded-lg p-1.5 grid grid-cols-${options.length} gap-1`}>
            {options.map(opt => (
                <button key={opt.value} onClick={() => onSelect(opt.value)} className={`w-full text-center p-2 rounded-md transition-all font-semibold text-sm ${selected === opt.value ? 'bg-surface shadow-sm text-primary-600 dark:text-primary-300' : 'text-secondary hover:bg-[rgba(var(--color-surface-rgb),0.5)]'}`}>
                    {opt.label}
                </button>
            ))}
        </div>
    );

    // --- Logic & Handlers ---
    const resetForm = useCallback(() => {
        setText('');
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
    }, [imagePreview]);

    const handleImageInput = useCallback(async (file: File | null) => {
        if (!file) return;
        setImagePreview(URL.createObjectURL(file));
        setIsLoading(true);
        setLoadingMessage('جاري استخراج النص من الصورة...');
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const extracted = await extractTextFromImage(base64, file.type);
                if (extracted.includes("خطأ") || extracted.includes("لم يتم العثور")) {
                    setError(extracted);
                } else {
                    setText(prev => `${prev}\n${extracted}`.trim());
                }
                setIsLoading(false);
            };
        } catch (e) {
            setError('فشل في معالجة الصورة.');
            setIsLoading(false);
        }
    }, []);

    const handleGenerate = async () => {
        if (!text.trim()) return;
        setError('');
        setView('loading');
        const messages = ["نحلل العلاقات بين الأفكار...", "نرسم الفروع الرئيسية للخريطة...", "نضيف اللمسات الأخيرة..."];
        let msgIndex = 0;
        setLoadingMessage(messages[0]);
        const interval = setInterval(() => setLoadingMessage(messages[++msgIndex % messages.length]), 2500);

        const result = await generateMindMapData(text, density);
        clearInterval(interval);
        
        try {
            const parsed = JSON.parse(result);
            if (parsed.error) {
                setError(parsed.error);
                setView('form');
            } else {
                setMindMapData(parsed);
                setView('result');
            }
        } catch (e) {
            setError('فشل في تحليل استجابة الخادم. حاول مجدداً بنص مختلف.');
            setView('form');
        }
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'mind-map.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handleRestart = () => {
        setView('form');
        setTimeout(() => {
            resetForm();
            setError('');
            setMindMapData(null);
        }, 300);
    };

    // --- Canvas Drawing Logic ---
    useEffect(() => {
        if (view !== 'result' || !mindMapData || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const isDarkMode = document.documentElement.classList.contains('dark');
        ctx.fillStyle = isDarkMode ? 'rgb(26, 33, 33)' : '#F7F5F2';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const palettes = {
            bright: { bg: ['#42a5f5', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc'], text: '#FFFFFF' },
            formal: { bg: ['#546e7a', '#78909c', '#90a4ae', '#b0bec5', '#cfd8dc'], text: '#FFFFFF' },
            calm: { bg: ['#a5d6a7', '#c5e1a5', '#e6ee9c', '#fff59d', '#ffe082'], text: '#424242' },
        };
        const colors = palettes[colorScheme];

        const PADDING = 20, FONT_SIZE = 14;
        ctx.font = `500 ${FONT_SIZE}px 'IBM Plex Sans Arabic'`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const measureNode = (node: MindMapNode) => {
            const words = node.topic.split(' ');
            const lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = ctx.measureText(currentLine + " " + word).width;
                if (width < 120) {
                    currentLine += " " + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            
            node.width = 150;
            node.height = Math.max(40, lines.length * FONT_SIZE * 1.3 + PADDING);
            return lines;
        };

        const drawNode = (node: MindMapNode, lines: string[]) => {
            if (node.x === undefined || node.y === undefined || node.width === undefined || node.height === undefined) return;
            ctx.fillStyle = node.color || colors.bg[0];
            ctx.beginPath();
            ctx.roundRect(node.x - node.width / 2, node.y - node.height / 2, node.width, node.height, 10);
            ctx.fill();
            
            ctx.fillStyle = colors.text;
            lines.forEach((line, i) => {
                ctx.fillText(line, node.x!, node.y! - (lines.length - 1) * FONT_SIZE * 0.65 + i * FONT_SIZE * 1.3);
            });
        };
        
        const drawConnector = (parent: MindMapNode, child: MindMapNode) => {
            if (parent.x === undefined || parent.y === undefined || child.x === undefined || child.y === undefined) return;
            ctx.strokeStyle = isDarkMode ? 'rgba(232, 230, 227, 0.4)' : 'rgba(32, 54, 54, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(parent.x, parent.y);
            if (layout === 'tree') {
                ctx.bezierCurveTo(parent.x, parent.y + 40, child.x, child.y - 40, child.x, child.y);
            } else {
                 ctx.lineTo(child.x, child.y);
            }
            ctx.stroke();
        };

        const positionAndDraw = (node: MindMapNode, parent?: MindMapNode) => {
            if(parent) drawConnector(parent, node);
            const lines = measureNode(node);
            drawNode(node, lines);
            if (node.children) {
                node.children.forEach(child => positionAndDraw(child, node));
            }
        };

        const layoutTree = (node: MindMapNode, x: number, y: number, level: number) => {
            node.x = x;
            node.y = y;
            node.color = colors.bg[level % colors.bg.length];
            measureNode(node);

            if (!node.children || node.children.length === 0) {
                return node.width!;
            }
            
            const childrenSubtreeWidths = node.children.map(child => layoutTree(child, 0, y + (node.height! * 0.7) + 60, level + 1));
            const totalChildrenWidth = childrenSubtreeWidths.reduce((a, b) => a + b, 0) + Math.max(0, node.children.length - 1) * 30;

            let currentX = x - totalChildrenWidth / 2;
            node.children.forEach((child, i) => {
                const childSubtreeWidth = childrenSubtreeWidths[i];
                const newX = currentX + childSubtreeWidth / 2;
                const shiftX = newX - (child.x || 0);
                
                const shiftSubtree = (n: MindMapNode, dx: number) => {
                    n.x = (n.x || 0) + dx;
                    if(n.children) n.children.forEach(c => shiftSubtree(c, dx));
                }
                shiftSubtree(child, shiftX);
                currentX += childSubtreeWidth + 30;
            });

            return Math.max(node.width!, totalChildrenWidth);
        };
        
        const layoutCentral = (root: MindMapNode, centerX: number, centerY: number) => {
            const assignCoords = (node: MindMapNode, level: number, angle: number, radius: number) => {
                node.x = centerX + radius * Math.cos(angle);
                node.y = centerY + radius * Math.sin(angle);
                node.color = colors.bg[level % colors.bg.length];
                
                if (node.children) {
                    const angleSpread = node.children.length > 1 ? Math.PI * 1.5 : 0;
                    const angleStep = node.children.length > 1 ? angleSpread / (node.children.length) : 0;
                    
                    node.children.forEach((child, i) => {
                        const childAngle = angle - (angleSpread/2) + angleStep * (i + 0.5) + (Math.random() - 0.5) * 0.1;
                        assignCoords(child, level + 1, childAngle, radius + 130 + level * 20);
                    });
                }
            };
            assignCoords(root, 0, 0, 0);
        };
        
        if (layout === 'tree') {
            layoutTree(mindMapData, rect.width / 2, PADDING + 30, 0);
        } else {
            layoutCentral(mindMapData, rect.width / 2, rect.height / 2);
        }

        positionAndDraw(mindMapData);

    }, [view, mindMapData, layout, colorScheme]);
    
    const layoutOptions = [{value: 'tree', label: 'شجري'}, {value: 'central', label: 'مركزي'}];
    const densityOptions = [{value: 'brief', label: 'موجزة'}, {value: 'medium', label: 'متوسطة'}, {value: 'detailed', label: 'مفصلة'}];
    const colorOptions = [{value: 'bright', label: 'مشرقة'}, {value: 'formal', label: 'رسمية'}, {value: 'calm', label: 'هادئة'}];

    if (view === 'loading') return (
        <div className="flex flex-col items-center justify-center text-center h-full p-6 animate-fade-in">
             <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-4 text-lg font-semibold text-secondary transition-all">{loadingMessage}</p>
        </div>
    );
    
    if (view === 'result') return (
        <div className="space-y-4 animate-fade-in">
             <div className="bg-surface p-4 rounded-xl border border-weak space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">الخريطة الذهنية</h3>
                    <button onClick={handleDownload} className="flex items-center justify-center gap-2 bg-primary-600 text-white py-2 px-4 font-bold rounded-lg hover:bg-primary-500 transition-all text-sm">
                        <DownloadIcon className="w-5 h-5"/> <span>تحميل (PNG)</span>
                    </button>
                </div>
                <div className="bg-white dark:bg-[rgb(var(--color-bg-rgb))] rounded-lg overflow-hidden">
                    <canvas ref={canvasRef} className="w-full h-[500px]"></canvas>
                </div>
            </div>
            <button onClick={handleRestart} className="w-full flex items-center justify-center gap-2 bg-[rgba(var(--color-text-rgb),0.05)] py-3 font-bold rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.1)] transition-all">
                <PencilIcon /> <span>إنشاء خريطة جديدة</span>
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={e => handleImageInput(e.target.files?.[0])} className="hidden" />
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={e => handleImageInput(e.target.files?.[0])} className="hidden" />

            <StepCard number={1} title="أدخل المحتوى">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="الصق النص هنا، أو ارفق صورة..."
                    className="w-full h-40 p-3 bg-[rgba(var(--color-text-rgb),0.03)] border-2 border-weak rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                />
                 {imagePreview && (
                    <div className="relative w-28 h-28 mt-2 p-1.5 bg-surface-backdrop rounded-lg border border-weak">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded"/>
                        <button onClick={resetForm} type="button" className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full text-sm font-bold">✕</button>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-3 mt-3">
                     <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex items-center justify-center gap-2 bg-[rgba(var(--color-text-rgb),0.05)] py-3 font-bold rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.1)] transition-all disabled:opacity-50"><FileUploadIcon/> <span>رفع صورة</span></button>
                     <button onClick={() => cameraInputRef.current?.click()} disabled={isLoading} className="flex items-center justify-center gap-2 bg-[rgba(var(--color-text-rgb),0.05)] py-3 font-bold rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.1)] transition-all disabled:opacity-50"><CameraIcon/> <span>الكاميرا</span></button>
                </div>
            </StepCard>

            <StepCard number={2} title="خصّص الخريطة">
                <div className="space-y-4">
                     <div>
                        <h4 className="font-semibold text-secondary mb-2">شكل الخريطة</h4>
                        <SegmentedControl options={layoutOptions} selected={layout} onSelect={setLayout} />
                    </div>
                     <div>
                        <h4 className="font-semibold text-secondary mb-2">كثافة المعلومات</h4>
                        <SegmentedControl options={densityOptions} selected={density} onSelect={setDensity} />
                    </div>
                     <div>
                        <h4 className="font-semibold text-secondary mb-2">نظام الألوان</h4>
                        <SegmentedControl options={colorOptions} selected={colorScheme} onSelect={setColorScheme} />
                    </div>
                </div>
            </StepCard>
            <button onClick={handleGenerate} disabled={!text.trim() || isLoading} className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 text-lg font-bold rounded-xl hover:bg-primary-500 disabled:bg-gray-400 transition-all duration-200 transform active:scale-95 shadow-lg shadow-primary-500/20">
                <SparklesIcon />
                <span>إنشاء الخريطة</span>
            </button>
            {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
        </div>
    );
};

const IqTestTool: React.FC = () => {
    // --- State Management ---
    type View = 'settings' | 'loading' | 'test' | 'results';
    const [view, setView] = useState<View>('settings');
    
    // Settings
    const [topic, setTopic] = useState<IQTestTopic>('general');
    const [difficulty, setDifficulty] = useState<IQD>('medium');
    const [numQuestions, setNumQuestions] = useState<5 | 10 | 15>(10);
    
    // Test
    const [questions, setQuestions] = useState<IQQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);

    // Results
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const timerRef = useRef<number>();
    const nextQuestionTimeoutRef = useRef<number>();

    // --- Timer Logic ---
    useEffect(() => {
        if (view === 'test' && !selectedOption) {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleAnswer(null); // Timeout
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            clearInterval(timerRef.current);
            clearTimeout(nextQuestionTimeoutRef.current);
        }
    }, [view, currentQuestionIndex, selectedOption]);


    const getTimerDuration = (difficulty: IQD) => {
        if (difficulty === 'easy') return 45;
        if (difficulty === 'hard') return 75;
        return 60;
    };
    
    const handleStartTest = async () => {
        setIsLoading(true);
        setError('');
        setView('loading');
        try {
            const result = await generateIQTest(topic, difficulty, numQuestions);
            const parsed = JSON.parse(result);
            if (parsed.error) {
                setError(parsed.error);
                setView('settings');
            } else {
                setQuestions(parsed.questions);
                setCurrentQuestionIndex(0);
                setScore(0);
                setSelectedOption(null);
                setTimeLeft(getTimerDuration(difficulty));
                setView('test');
            }
        } catch (e) {
            setError('فشل في إنشاء الاختبار. حاول مرة أخرى.');
            setView('settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswer = (option: string | null) => {
        if (selectedOption) return;
        
        clearInterval(timerRef.current);
        setSelectedOption(option ?? 'timeout');
        
        if (option && option === questions[currentQuestionIndex].correctAnswer) {
            setScore(prev => prev + 1);
        }

        nextQuestionTimeoutRef.current = window.setTimeout(async () => {
            const nextQuestion = currentQuestionIndex + 1;
            if (nextQuestion < questions.length) {
                setCurrentQuestionIndex(nextQuestion);
                setSelectedOption(null);
                setTimeLeft(getTimerDuration(difficulty));
            } else {
                // End of test
                setIsLoading(true);
                setView('loading'); // Show loading while getting feedback
                const feedbackResult = await getIQTestFeedback(score, questions.length, topic, difficulty);
                setFeedback(feedbackResult);
                setIsLoading(false);
                setView('results');
            }
        }, 1500);
    };

    const handleRestart = () => {
        setView('settings');
        setError('');
    };

    const SegmentedControl: React.FC<{options: {value: any, label: string}[], selected: any, onSelect: (value: any) => void}> = ({ options, selected, onSelect }) => (
        <div className={`w-full bg-[rgba(var(--color-text-rgb),0.05)] rounded-lg p-1.5 grid grid-cols-${options.length} gap-1`}>
            {options.map(opt => (
                <button key={opt.value} onClick={() => onSelect(opt.value)} className={`w-full text-center p-2 rounded-md transition-all font-semibold text-sm ${selected === opt.value ? 'bg-surface shadow-sm text-primary-600 dark:text-primary-300' : 'text-secondary hover:bg-[rgba(var(--color-surface-rgb),0.5)]'}`}>
                    {opt.label}
                </button>
            ))}
        </div>
    );
    
    // --- Render Views ---
    if (isLoading) return (
        <div className="flex flex-col items-center justify-center text-center h-full p-6 animate-fade-in">
             <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-4 text-lg font-semibold text-secondary transition-all">
                {view === 'loading' && !feedback ? 'جاري إنشاء اختبار مخصص لك...' : 'جاري تحليل أدائك...'}
             </p>
        </div>
    );

    if (view === 'test') {
        const question = questions[currentQuestionIndex];
        const timerDuration = getTimerDuration(difficulty);

        return (
            <div className="space-y-4 animate-fade-in">
                <div className="relative h-2.5 w-full bg-[rgba(var(--color-text-rgb),0.1)] rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-primary-400" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`, transition: 'width 0.5s' }} />
                </div>
                <div className="p-4 bg-surface rounded-lg border border-weak">
                    <div className="mb-4">
                        <div className="relative h-2.5 w-full bg-[rgba(var(--color-text-rgb),0.1)] rounded-full overflow-hidden mb-3">
                            <div className="absolute top-0 right-0 h-full bg-primary-600 dark:bg-primary-500" style={{ width: `${(timeLeft/timerDuration) * 100}%`, transition: 'width 1s linear' }} />
                        </div>
                        <p className="text-lg mt-1 font-semibold text-center">{question.question}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {question.options.map((option, index) => {
                             const isCorrect = option === question.correctAnswer;
                             const isSelected = selectedOption === option;
                             let buttonClass = 'bg-[rgba(var(--color-bg-rgb),0.5)] hover:bg-[rgba(var(--color-text-rgb),0.05)]';
                             if (selectedOption) {
                                 if (isCorrect) {
                                     buttonClass = 'bg-green-500 text-white ring-green-300';
                                 } else if (isSelected) {
                                     buttonClass = 'bg-red-500 text-white ring-red-300';
                                 } else {
                                     buttonClass = 'bg-[rgba(var(--color-bg-rgb),0.5)] opacity-50';
                                 }
                             }
                            return (
                                <button key={index} onClick={() => handleAnswer(option)} disabled={!!selectedOption} className={`w-full p-3 rounded-md text-start transition-all duration-300 font-medium ring-2 ring-transparent ${buttonClass}`}>
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
    
    if (view === 'results') return (
        <div className="text-center p-6 bg-surface rounded-lg animate-fade-in space-y-4">
            <h4 className="text-2xl font-bold">انتهى الاختبار!</h4>
            <p className="mt-2 text-lg">نتيجتك هي <span className="font-bold text-primary-500 text-3xl">{score}</span> / {questions.length}</p>
            <p className="text-secondary italic leading-relaxed">"{feedback}"</p>
            <button onClick={handleRestart} className="mt-6 bg-primary-600 text-white py-2 px-6 rounded-md hover:bg-primary-500 font-semibold transition-transform active:scale-95">
                إعادة الاختبار
            </button>
        </div>
    );
    
    // Default: Settings View
    return (
        <div className="space-y-6 animate-fade-in">
            <p className="text-sm text-secondary text-center">
                قم بتخصيص تحدي الذكاء الخاص بك. سيقوم الذكاء الاصطناعي بإنشاء أسئلة فريدة لك في كل مرة.
            </p>
            <div className="bg-surface p-5 rounded-xl border border-weak space-y-4">
                <div>
                    <h4 className="font-semibold text-secondary mb-2">موضوع الاختبار</h4>
                    <SegmentedControl options={[ {value: 'general', label: 'عام'}, {value: 'logic', label: 'المنطق'}, {value: 'math', label: 'الرياضيات'}, {value: 'spatial', label: 'مكاني'} ]} selected={topic} onSelect={setTopic} />
                </div>
                 <div>
                    <h4 className="font-semibold text-secondary mb-2">مستوى الصعوبة</h4>
                    <SegmentedControl options={[{value: 'easy', label: 'سهل'}, {value: 'medium', label: 'متوسط'}, {value: 'hard', label: 'صعب'}]} selected={difficulty} onSelect={setDifficulty} />
                </div>
                 <div>
                    <h4 className="font-semibold text-secondary mb-2">عدد الأسئلة</h4>
                    <SegmentedControl options={[{value: 5, label: '5'}, {value: 10, label: '10'}, {value: 15, label: '15'}]} selected={numQuestions} onSelect={setNumQuestions} />
                </div>
            </div>
            <button onClick={handleStartTest} className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 text-lg font-bold rounded-xl hover:bg-primary-500 transition-all duration-200 transform active:scale-95 shadow-lg shadow-primary-500/20">
                <BrainIcon />
                <span>ابدأ التحدي</span>
            </button>
            {error && <p className="text-red-500 dark:text-red-400 text-center font-semibold">{error}</p>}
        </div>
    );
};


const TextToSpeechTool: React.FC = () => {
    // --- State Management ---
    const [view, setView] = useState<'form' | 'loading' | 'result'>('form');
    const [text, setText] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [voice, setVoice] = useState<'male' | 'female'>('female');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // --- Helper Functions ---
    const StepCard: React.FC<{ number: number, title: string, children: React.ReactNode }> = ({ number, title, children }) => (
        <div className="group relative bg-surface p-6 rounded-2xl border border-weak transition-all duration-300 hover:border-primary-400/50 hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-black/20 hover:-translate-y-2">
            <div className="absolute -top-6 right-6 w-12 h-12 flex items-center justify-center bg-primary-500 text-white font-bold text-xl rounded-full transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-6 group-hover:bg-primary-600 shadow-lg shadow-primary-500/30">
                {number}
            </div>
            <div className="pt-4">
                <h3 className="text-lg font-bold mb-3">{title}</h3>
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
    
    // --- Logic & Handlers ---
    const resetForm = useCallback(() => {
        setText('');
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
    }, [imagePreview]);

    const handleImageInput = useCallback(async (file: File | null) => {
        if (!file) return;
        setImagePreview(URL.createObjectURL(file));
        setIsLoading(true);
        setLoadingMessage('جاري استخراج النص من الصورة...');
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const extracted = await extractTextFromImage(base64, file.type);
                if (extracted.includes("خطأ") || extracted.includes("لم يتم العثور")) {
                    setError(extracted);
                } else {
                    setText(prev => `${prev}\n${extracted}`.trim());
                }
                setIsLoading(false);
            };
        } catch (e) {
            setError('فشل في معالجة الصورة.');
            setIsLoading(false);
        }
    }, []);

    const handleGenerate = async () => {
        if (!text.trim()) return;
        setView('loading');
        setError('');
        setLoadingMessage("نحول الكلمات إلى موجات صوتية...");
        
        const base64Audio = await generateSpeech(text, voice);

        if (base64Audio) {
            try {
                const decode = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                const pcmData = decode(base64Audio);

                // --- Create WAV Blob from raw PCM data ---
                const sampleRate = 24000;
                const numChannels = 1;
                const bitsPerSample = 16;
                const dataSize = pcmData.length;
                const buffer = new ArrayBuffer(44 + dataSize);
                const view = new DataView(buffer);

                // RIFF header
                view.setUint32(0, 0x52494646, false); // "RIFF"
                view.setUint32(4, 36 + dataSize, true);
                view.setUint32(8, 0x57415645, false); // "WAVE"
                // "fmt " sub-chunk
                view.setUint32(12, 0x666d7420, false); // "fmt "
                view.setUint32(16, 16, true);
                view.setUint16(20, 1, true); // PCM
                view.setUint16(22, numChannels, true);
                view.setUint32(24, sampleRate, true);
                view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
                view.setUint16(32, numChannels * (bitsPerSample / 8), true);
                view.setUint16(34, bitsPerSample, true);
                // "data" sub-chunk
                view.setUint32(36, 0x64617461, false); // "data"
                view.setUint32(40, dataSize, true);
                
                // Write PCM data
                new Uint8Array(buffer, 44).set(pcmData);
                
                setAudioBlob(new Blob([view], { type: 'audio/wav' }));
                setView('result');

            } catch(e) {
                console.error("Audio processing error:", e);
                setError("فشل في معالجة الصوت.");
                setView('form');
            }
        } else {
            setError("فشل في توليد الصوت من الخادم.");
            setView('form');
        }
        setIsLoading(false);
    };
    
    const handleRestart = () => {
      setView('form');
      setAudioBlob(null);
      resetForm();
    };

    // --- Sub-Components ---
    const CustomAudioPlayer: React.FC<{ audioBlob: Blob }> = ({ audioBlob }) => {
        const audioRef = useRef<HTMLAudioElement | null>(null);
        const [isPlaying, setIsPlaying] = useState(false);
        const [progress, setProgress] = useState(0);
        const [duration, setDuration] = useState(0);
        const [currentTime, setCurrentTime] = useState(0);
        
        const formatTime = (time: number) => {
            if (isNaN(time) || time === 0) return '00:00';
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        };

        useEffect(() => {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            const setAudioData = () => { setDuration(audio.duration); }
            const updateProgress = () => { setCurrentTime(audio.currentTime); setProgress((audio.currentTime / audio.duration) * 100 || 0); }
            const onEnded = () => { setIsPlaying(false); }
            
            audio.addEventListener('loadedmetadata', setAudioData);
            audio.addEventListener('timeupdate', updateProgress);
            audio.addEventListener('ended', onEnded);

            return () => {
                audio.removeEventListener('loadedmetadata', setAudioData);
                audio.removeEventListener('timeupdate', updateProgress);
                audio.removeEventListener('ended', onEnded);
                URL.revokeObjectURL(audioUrl);
                audio.pause();
                audioRef.current = null;
            }
        }, [audioBlob]);

        const togglePlayPause = () => {
            if (audioRef.current) {
                if (isPlaying) audioRef.current.pause();
                else audioRef.current.play();
                setIsPlaying(!isPlaying);
            }
        }
        
        const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (audioRef.current) {
                const newTime = (Number(e.target.value) / 100) * duration;
                audioRef.current.currentTime = newTime;
                setCurrentTime(newTime);
            }
        };

        const handleDownload = () => {
          const url = URL.createObjectURL(audioBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'audio.wav';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };

        return (
          <div className="space-y-4">
            <div className="bg-surface p-4 rounded-xl border border-weak flex items-center gap-4">
                <button onClick={togglePlayPause} className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-primary-500 text-white rounded-full transition-transform active:scale-90">
                    {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                </button>
                <div className="w-full">
                    <input type="range" value={progress} onChange={handleScrub} className="w-full h-2 bg-[rgba(var(--color-text-rgb),0.1)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full"/>
                    <div className="flex justify-between text-xs font-mono mt-1 text-secondary">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>
            <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 bg-[rgba(var(--color-text-rgb),0.05)] py-3 font-bold rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.1)] transition-all">
              <DownloadIcon className="w-5 h-5" />
              <span>تحميل الملف الصوتي (WAV)</span>
            </button>
          </div>
        );
    };

    // --- Render Logic ---
    if (view === 'loading') return (
        <div className="flex flex-col items-center justify-center text-center h-full p-6 animate-fade-in">
             <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-4 text-lg font-semibold text-secondary transition-all">{loadingMessage}</p>
        </div>
    );
    
    if (view === 'result' && audioBlob) return (
        <div className="animate-fade-in space-y-4">
            <CustomAudioPlayer audioBlob={audioBlob} />
            <button onClick={handleRestart} className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 text-lg font-bold rounded-xl hover:bg-primary-500 transition-all transform active:scale-95">
                <span>إنشاء صوت جديد</span>
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={e => handleImageInput(e.target.files?.[0])} className="hidden" />
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={e => handleImageInput(e.target.files?.[0])} className="hidden" />

            <StepCard number={1} title="أدخل المحتوى">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="اكتب أو الصق النص هنا..."
                    className="w-full h-32 p-3 bg-[rgba(var(--color-text-rgb),0.03)] border-2 border-weak rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                />
                {imagePreview && (
                    <div className="relative w-28 h-28 mt-2 p-1.5 bg-surface-backdrop rounded-lg border border-weak">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded"/>
                        <button onClick={() => {setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; if (cameraInputRef.current) cameraInputRef.current.value = "";}} type="button" className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full text-sm font-bold">✕</button>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-3 mt-3">
                     <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex items-center justify-center gap-2 bg-[rgba(var(--color-text-rgb),0.05)] py-3 font-bold rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.1)] transition-all disabled:opacity-50"><FileUploadIcon/> <span>رفع صورة</span></button>
                     <button onClick={() => cameraInputRef.current?.click()} disabled={isLoading} className="flex items-center justify-center gap-2 bg-[rgba(var(--color-text-rgb),0.05)] py-3 font-bold rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.1)] transition-all disabled:opacity-50"><CameraIcon/> <span>الكاميرا</span></button>
                </div>
            </StepCard>

            <StepCard number={2} title="اختر الصوت">
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setVoice('female')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${voice === 'female' ? 'bg-primary-500/10 border-primary-500' : 'bg-[rgba(var(--color-text-rgb),0.03)] border-weak'}`}>
                        <FemaleIcon />
                        <span className="font-bold">أنثى</span>
                    </button>
                    <button onClick={() => setVoice('male')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${voice === 'male' ? 'bg-primary-500/10 border-primary-500' : 'bg-[rgba(var(--color-text-rgb),0.03)] border-weak'}`}>
                        <MaleIcon />
                        <span className="font-bold">ذكر</span>
                    </button>
                </div>
            </StepCard>

            <button onClick={handleGenerate} disabled={!text.trim() || isLoading} className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 text-lg font-bold rounded-xl hover:bg-primary-500 disabled:bg-gray-400 transition-all duration-200 transform active:scale-95 shadow-lg shadow-primary-500/20">
                <TtsIcon/>
                <span>إنشاء الصوت</span>
            </button>
            {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
        </div>
    );
};

// --- Main ToolsPage Component ---

const ToolsPage: React.FC = () => {
    const [expandedToolId, setExpandedToolId] = useState<Tool | null>(null);
    const [activeToolIndex, setActiveToolIndex] = useState(0);
    const [cardStyles, setCardStyles] = useState<React.CSSProperties[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    const tools = [
        { id: 'summarizer' as Tool, title: 'اداة التلخيص', description: 'لخص، اختبر فهمك، واحصل على أمثلة.', icon: <SummarizeIcon />, component: <SummarizerTool />, bgClassName: 'tool-card-1', textClassName: 'text-tool-1', iconBgClassName: 'bg-tool-1-light', animation: <svg width="100%" height="100%" viewBox="0 0 200 300" className="summarizer-anim" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="8" strokeLinecap="round"><rect x="30" y="50" width="140" height="1" /><rect x="30" y="80" width="140" height="1" /><rect x="30" y="110" width="140" height="1" /><rect x="30" y="140" width="90" height="1" /></svg> },
        { id: 'questioner' as Tool, title: 'منشئ الاسئلة', description: 'حوّل أي مادة دراسية إلى اختبار تفاعلي.', icon: <QuestionerIcon />, component: <QuestionGeneratorTool />, bgClassName: 'tool-card-2', textClassName: 'text-tool-2', iconBgClassName: 'bg-tool-2-light', animation: <svg width="100%" height="100%" viewBox="0 0 200 300" className="questioner-anim" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"><path d="M 70 120 C 70 90, 130 90, 130 120 C 130 150, 100 150, 100 180 V 200" /><circle cx="100" cy="230" r="8" fill="rgba(255,255,255,0.3)" stroke="none" /></svg> },
        { id: 'mindmap' as Tool, title: 'الخرائط الذهنية', description: 'نظّم الأفكار في خرائط مرئية واضحة.', icon: <MindMapIcon />, component: <MindMapGeneratorTool />, bgClassName: 'tool-card-3', textClassName: 'text-tool-3', iconBgClassName: 'bg-tool-3-light', animation: <svg width="100%" height="100%" viewBox="0 0 200 300" className="mindmap-anim" fill="rgba(255,255,255,0.6)" stroke="rgba(255,255,255,0.6)" strokeWidth="4" strokeLinecap="round"><circle cx="100" cy="150" r="12" style={{transformOrigin: 'center'}} /><line x1="100" y1="150" x2="40" y2="80" /><line x1="100" y1="150" x2="160" y2="100" /><line x1="100" y1="150" x2="50" y2="220" /><line x1="100" y1="150" x2="150" y2="230" /></svg> },
        { id: 'iqtest' as Tool, title: 'اختبار الذكاء', description: 'اختبارات ذكاء متجددة من الذكاء الاصطناعي.', icon: <BrainIcon />, component: <IqTestTool />, bgClassName: 'tool-card-4', textClassName: 'text-tool-4', iconBgClassName: 'bg-tool-4-light', animation: <svg width="100%" height="100%" viewBox="0 0 200 300" className="iq-anim" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3"><circle cx="100" cy="150" r="20" /><circle cx="100" cy="150" r="20" /><circle cx="100" cy="150" r="20" /></svg> },
        { id: 'tts' as Tool, title: 'القارئ الصوتي', description: 'استمع إلى النصوص والمقالات بدلاً من قراءتها.', icon: <TtsIcon />, component: <TextToSpeechTool />, bgClassName: 'tool-card-5', textClassName: 'text-tool-5', iconBgClassName: 'bg-tool-5-light', animation: <svg width="100%" height="100%" viewBox="0 0 200 300" className="tts-anim" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round"><path d="M 60 120 A 40 40 0 0 1 60 180" /><path d="M 60 100 A 60 60 0 0 1 60 200" /><path d="M 60 80 A 80 80 0 0 1 60 220" /></svg> },
    ];
    
    const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const group = e.currentTarget;
        const rect = group.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;

        const rotateY = (x - width / 2) / width * -20; // max rotation 10deg
        const rotateX = (y - height / 2) / height * 20; // max rotation 10deg
        
        const glowX = (x / width) * 100;
        const glowY = (y / height) * 100;

        group.style.setProperty('--rotateX', `${rotateX}deg`);
        group.style.setProperty('--rotateY', `${rotateY}deg`);
        group.style.setProperty('--x', `${glowX}%`);
        group.style.setProperty('--y', `${glowY}%`);
    }, []);

    const handleCardMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const group = e.currentTarget;
        group.style.setProperty('--rotateX', '0deg');
        group.style.setProperty('--rotateY', '0deg');
    }, []);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const scroller = scrollRef.current;
        const { scrollLeft, offsetWidth } = scroller;
        const scrollCenter = scrollLeft + offsetWidth / 2;

        let closestIndex = 0;
        let closestDistance = Infinity;

        const newStyles = cardRefs.current.map((card, index) => {
            if (!card) return {};

            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const distance = cardCenter - scrollCenter;
            
            if (Math.abs(distance) < closestDistance) {
                closestDistance = Math.abs(distance);
                closestIndex = index;
            }

            const normalizedDistance = distance / (offsetWidth / 2);

            const rotation = normalizedDistance * -45; // Slightly more rotation
            const translateZ = -Math.abs(normalizedDistance) * (card.offsetWidth * 0.6); // Increased depth
            const translateY = Math.abs(normalizedDistance) * (card.offsetHeight * 0.2); // Increased arc
            const scale = 1 - Math.abs(normalizedDistance) * 0.2; // Add scaling
            const opacity = 1 - Math.abs(normalizedDistance) * 0.5; // Slightly more fade
            
            return {
                transform: `perspective(1000px) translateY(${translateY}px) translateZ(${translateZ}px) rotateY(${rotation}deg) scale(${scale})`,
                opacity: Math.max(0.2, opacity), // Allow more fading
                zIndex: cardRefs.current.length - Math.abs(Math.round(normalizedDistance * 2)),
            };
        });
        
        setActiveToolIndex(closestIndex);
        setCardStyles(newStyles);
    }, []);


    useEffect(() => {
        const scroller = scrollRef.current;
        if (scroller) {
            setTimeout(handleScroll, 0); // Initial calculation
            scroller.addEventListener('scroll', handleScroll, { passive: true });
            window.addEventListener('resize', handleScroll);
            return () => {
                scroller.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', handleScroll);
            };
        }
    }, [handleScroll]);


    const scrollToTool = (index: number) => {
        cardRefs.current[index]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    };
    
    const expandedTool = tools.find(t => t.id === expandedToolId);

    if (expandedTool) {
        return (
            <div className="h-[calc(100vh-5rem)] animate-fade-in-up">
                <div className="h-full overflow-y-auto scrollbar-hide p-4">
                    <div className="flex items-center justify-between mb-2">
                        <button 
                            onClick={() => setExpandedToolId(null)} 
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-secondary bg-transparent hover:bg-[rgba(var(--color-text-rgb),0.05)] transition-colors self-start"
                            aria-label="العودة إلى الأدوات"
                        >
                            <ArrowRightIcon />
                        </button>
                        <h2 className="text-2xl font-bold">{expandedTool.title}</h2>
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${expandedTool.iconBgClassName} ${expandedTool.textClassName}`}>
                            <div className="w-7 h-7">{expandedTool.icon}</div>
                        </div>
                    </div>
                    {expandedTool.component}
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] text-center animate-fade-in">
            <header className="px-4 pt-4">
                <h1 className="text-3xl font-bold text-primary-500 dark:text-primary-400">الأدوات التعليمية</h1>
                <p className="text-secondary mt-2">اسحب لاكتشاف أدواتنا التفاعلية</p>
            </header>

            <div 
                ref={scrollRef} 
                className="w-full flex-1 flex items-center gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory px-8 sm:px-16 scrollbar-hide"
            >
                {tools.map((tool, index) => (
                    <div
                        key={tool.id}
                        ref={el => { cardRefs.current[index] = el; }}
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={cardStyles[index] || {}}
                        className="group flex-shrink-0 w-[85%] sm:w-2/3 md:w-1/2 max-w-xs aspect-[2/3] snap-center"
                    >
                        <div className={`w-full h-full rounded-3xl border border-weak p-6 flex flex-col text-right shadow-lg transition-all duration-300 ease-in-out group-hover:shadow-2xl dark:shadow-black/20 ${tool.bgClassName}`}>
                            <div className="tool-card-anim-container">
                                {tool.animation}
                            </div>
                            <div className="tool-card-content">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center self-start transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-3 ${tool.iconBgClassName} ${tool.textClassName}`}>
                                    <div className="w-9 h-9">{tool.icon}</div>
                                </div>
                                
                                <div className="flex-grow"></div>

                                <div>
                                     <h2 className="font-bold text-2xl">{tool.title}</h2>
                                     <p className="text-sm text-secondary mt-2 min-h-[3.5rem]">{tool.description}</p>
                                     <button
                                         onClick={() => setExpandedToolId(tool.id)}
                                         className="mt-5 w-full bg-[rgb(var(--color-text-rgb))] text-[rgb(var(--color-bg-rgb))] py-3 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
                                     >
                                         <span>ابدأ الآن</span>
                                         <div className="w-5 h-5"><BackIcon /></div>
                                     </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex-shrink-0 flex justify-center gap-2 py-4">
                {tools.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollToTool(index)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${activeToolIndex === index ? 'w-6 bg-primary-500' : 'w-2.5 bg-[rgba(var(--color-text-rgb),0.2)]'}`}
                        aria-label={`Go to tool ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default ToolsPage;