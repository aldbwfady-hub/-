
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Theme, SuggestionType, ColorTheme, BackgroundTheme } from '../types';
import { SettingsIcon, SunIcon, MoonIcon, PaintBrushIcon, CheckmarkIcon, SendIcon, SparklesIcon, ArrowRightIcon, PaletteIcon, AddIcon, BugReportIcon, LoadingIcon, BackIcon, BellIcon, ChatIcon, InstagramIcon, RocketLaunchIcon, ListBulletIcon } from '../components/icons/Icons';

// --- Reusable Components ---

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = '' }) => (
    <div className={`bg-card-professional p-4 sm:p-6 rounded-2xl border border-weak border-r-4 border-primary-500/50 ${className}`}>
        <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-6 text-primary-500 dark:text-primary-400">{icon}</div>
            <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div className="space-y-5">
            {children}
        </div>
    </div>
);


const StepCard: React.FC<{ step: number; title: string; children: React.ReactNode; }> = ({ step, title, children }) => (
    <div className="group relative w-full bg-surface p-6 rounded-2xl border border-weak animate-fade-in transition-all duration-300 hover:border-primary-400/50 hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-black/20 hover:-translate-y-2">
        <div className="absolute -top-6 right-6 w-12 h-12 flex items-center justify-center bg-primary-500 text-white font-bold text-xl rounded-full transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-6 group-hover:bg-primary-600 shadow-lg shadow-primary-500/30">
            {step}
        </div>
        <div className="pt-4">
            <h3 className="text-lg font-bold mb-3">{title}</h3>
            <div>
                {children}
            </div>
        </div>
    </div>
);

// --- Settings Panel Component ---

interface SettingsPanelProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    activeColor: ColorTheme;
    setActiveColor: (color: ColorTheme) => void;
    activeBackground: BackgroundTheme;
    setActiveBackground: (bg: BackgroundTheme) => void;
}


const SettingsPanel: React.FC<SettingsPanelProps> = ({ theme, setTheme, activeColor, setActiveColor, activeBackground, setActiveBackground }) => {

    const colorOptions: { id: ColorTheme; name: string; style: React.CSSProperties }[] = [
        { id: 'gold', name: 'ذهبي', style: { background: 'linear-gradient(135deg, #D1BFA0, #A58B5E)' } },
        { id: 'blue', name: 'أزرق', style: { background: 'linear-gradient(135deg, #6EB1F7, #3B82F6)' } },
        { id: 'green', name: 'أخضر', style: { background: 'linear-gradient(135deg, #6EE7B7, #10B981)' } },
        { id: 'ruby', name: 'ياقوتي', style: { background: 'linear-gradient(135deg, #F87171, #DC2626)' } },
        { id: 'violet', name: 'بنفسجي', style: { background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)' } },
    ];
    
    const themeOptions: { id: Theme; label: string; }[] = [
        { id: 'light', label: 'نهاري' },
        { id: 'dark', label: 'ليلي' },
        { id: 'system', label: 'تلقائي' },
    ];

    const backgroundOptions: { id: BackgroundTheme }[] = [
        { id: 'bg-3d-1' }, { id: 'bg-3d-2' }, { id: 'bg-3d-3' }, { id: 'bg-3d-4' }, { id: 'bg-3d-5' },
        { id: 'bg-3d-6' }, { id: 'bg-3d-7' }, { id: 'bg-3d-8' }, { id: 'bg-3d-9' }, { id: 'bg-3d-10' },
    ];
    
    const SegmentedControl: React.FC<{options: {id: Theme, label: string}[], selected: Theme, onSelect: (value: Theme) => void}> = ({ options, selected, onSelect }) => (
        <div className={`w-full bg-[rgba(var(--color-text-rgb),0.05)] rounded-lg p-1.5 grid grid-cols-3 gap-1`}>
            {options.map(opt => (
                <button key={opt.id} onClick={() => onSelect(opt.id)} className={`w-full text-center p-2 rounded-md transition-all font-semibold text-sm ${selected === opt.id ? 'bg-surface shadow-sm text-primary-600 dark:text-primary-300' : 'text-secondary hover:bg-[rgba(var(--color-surface-rgb),0.5)]'}`}>
                    {opt.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <Section title="وضع المظهر" icon={<SunIcon />}>
                <SegmentedControl options={themeOptions} selected={theme} onSelect={setTheme} />
            </Section>

            <Section title="لون التطبيق" icon={<PaletteIcon />}>
                <div className="grid grid-cols-5 gap-3 justify-items-center py-2">
                    {colorOptions.map(color => (
                        <button
                            key={color.id}
                            onClick={() => setActiveColor(color.id)}
                            className="w-12 h-12 rounded-xl relative overflow-hidden transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ring-primary-400 shadow-inner"
                            style={color.style}
                            aria-label={color.name}
                        >
                            {activeColor === color.id && (
                                <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center text-white">
                                    <CheckmarkIcon />
                                </div>
                            )}
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl"></div>
                        </button>
                    ))}
                </div>
            </Section>

            <Section title="خلفية التطبيق" icon={<PaintBrushIcon />}>
                 <div className="grid grid-cols-5 gap-3 justify-items-center py-2">
                    {backgroundOptions.map(bg => (
                        <button
                            key={bg.id}
                            onClick={() => setActiveBackground(bg.id)}
                            className={`w-12 h-12 bg-surface rounded-xl relative overflow-hidden transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ring-primary-400 shadow-inner ${bg.id}`}
                            aria-label={`خلفية ثلاثية الأبعاد ${bg.id.split('-')[2]}`}
                        >
                            {activeBackground === bg.id && (
                                <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center text-white">
                                    <CheckmarkIcon />
                                </div>
                            )}
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl"></div>
                        </button>
                    ))}
                </div>
            </Section>
            
            <Section title="التحديث القادم بعون الله" icon={<RocketLaunchIcon />}>
                <p className="text-secondary leading-relaxed">
                    نعمل على ميزة ثورية: تخصيص الذكاء الاصطناعي لكل كتاب. ستتمكن من سؤال النموذج عن أي شيء في كتابك وسيجيبك بدقة من محتواه. نخطط أيضًا لأدوات أخرى تساعد في الدراسة. يمكنك دائمًا اقتراح أدوات جديدة لتحسين التطبيق عبر صفحة الاقتراحات.
                </p>
            </Section>

            <Section title="التحديثات القادمة" icon={<ListBulletIcon />}>
                <ul className="space-y-3">
                    {[
                        "إضافة دورات تعليمية مسجلة للمواد الأساسية.",
                        "توفير قسم خاص للملخصات والنماذج الامتحانية.",
                        "إنشاء غرف دردشة جماعية لكل مادة دراسية.",
                        "تحسينات مستمرة بناءً على اقتراحاتكم القيمة."
                    ].map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <span className="text-primary-500 mt-1.5 flex-shrink-0">&#9679;</span>
                            <span className="text-secondary">{item}</span>
                        </li>
                    ))}
                </ul>
            </Section>

            <Section title="تابعنا على" icon={<ChatIcon/>}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <a href="https://www.facebook.com/profile.php?id=61581813059961&mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" className="p-3 text-center rounded-lg font-bold text-white bg-[#1877F2] transition-transform hover:scale-105">Facebook</a>
                    <a href="https://whatsapp.com/channel/0029Vb6npWr1iUxXrvmb5U00" target="_blank" rel="noopener noreferrer" className="p-3 text-center rounded-lg font-bold text-white bg-[#25D366] transition-transform hover:scale-105">WhatsApp</a>
                    <a href="https://www.instagram.com/the.syrian.student?igsh=MWkyYzMydTc4ZnY0OQ==" target="_blank" rel="noopener noreferrer" className="p-3 flex items-center justify-center gap-2 text-center rounded-lg font-bold text-white bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285AEB_90%)] transition-transform hover:scale-105">
                        <InstagramIcon />
                    </a>
                </div>
            </Section>
        </div>
    );
};
// --- Suggestion Wizard Component ---

const SuggestionTypeCard: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick: () => void }> = ({ icon, title, description, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 text-right p-4 rounded-lg bg-[rgba(var(--color-bg-rgb),0.5)] hover:bg-[rgba(var(--color-text-rgb),0.05)] transition-all duration-200 hover:scale-[1.02] border border-weak">
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-primary-500/10 text-primary-500 dark:bg-primary-400/10 dark:text-primary-400 rounded-lg">
            {icon}
        </div>
        <div>
            <h4 className="font-bold">{title}</h4>
            <p className="text-sm text-secondary">{description}</p>
        </div>
    </button>
);


const SuggestionWizard: React.FC = () => {
    const [step, setStep] = useState(1);
    const [suggestionType, setSuggestionType] = useState<SuggestionType | null>(null);
    const [suggestionText, setSuggestionText] = useState('');
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const MAX_CHARS = 1000;

    const handleTypeSelect = (type: SuggestionType) => {
        setSuggestionType(type);
        setStep(2);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        console.log("Submitting:", { type: suggestionType, text: suggestionText, name: userName });
        setTimeout(() => { // Simulate API call
            setIsLoading(false);
            setShowSuccess(true);
        }, 1500);
    };

    const handleReset = () => {
        setShowSuccess(false);
        setTimeout(() => {
            setStep(1);
            setSuggestionType(null);
            setSuggestionText('');
            setUserName('');
        }, 300);
    };
    
    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-full animate-fade-in">
                 <div className="mb-4">
                    <svg className="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="success-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="success-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                </div>
                <h3 className="font-bold text-2xl">شكراً جزيلاً لك!</h3>
                <p className="text-secondary mt-2">تم إرسال اقتراحك بنجاح.</p>
                <button onClick={handleReset} className="mt-8 bg-primary-600 text-white py-2 px-6 rounded-lg hover:bg-primary-500 font-semibold transition-all active:scale-95">
                    تقديم اقتراح آخر
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-start pt-4 space-y-4 w-full">
            {step === 1 && (
                <StepCard step={1} title="حدد نوع الاقتراح">
                    <div className="space-y-3">
                        <SuggestionTypeCard icon={<SparklesIcon className="w-7 h-7" />} title="تحسين" description="تطوير ميزة موجودة حالياً" onClick={() => handleTypeSelect('improvement')} />
                        <SuggestionTypeCard icon={<AddIcon />} title="أداة جديدة" description="اقتراح فكرة لميزة غير موجودة" onClick={() => handleTypeSelect('new_tool')} />
                        <SuggestionTypeCard icon={<BugReportIcon />} title="إبلاغ عن خطأ" description="الإبلاغ عن أي مشكلة تقنية" onClick={() => handleTypeSelect('bug_report')} />
                    </div>
                </StepCard>
            )}

            {step === 2 && (
                <StepCard step={2} title="اشرح الفكرة بالتفصيل">
                    <div className="relative">
                        <textarea
                            value={suggestionText}
                            onChange={(e) => setSuggestionText(e.target.value)}
                            placeholder="اكتب اقتراحك هنا..."
                            className="w-full h-32 p-3 bg-[rgba(var(--color-bg-rgb),0.5)] border-2 border-weak rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                            rows={5}
                            maxLength={MAX_CHARS}
                        />
                        <div className="absolute bottom-3 left-3 text-xs text-secondary">{suggestionText.length} / {MAX_CHARS}</div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                        <button onClick={() => setStep(1)} className="w-full bg-[rgba(var(--color-text-rgb),0.05)] py-2.5 rounded-lg font-semibold hover:bg-[rgba(var(--color-text-rgb),0.1)] transition-colors">العودة</button>
                        <button onClick={() => setStep(3)} disabled={!suggestionText.trim()} className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-semibold hover:bg-primary-500 disabled:bg-gray-400 transition-colors">التالي</button>
                    </div>
                </StepCard>
            )}

            {step === 3 && (
                <form onSubmit={handleSubmit} className="w-full">
                    <StepCard step={3} title="الإرسال النهائي">
                        <p className="text-sm text-secondary mb-4">نود أن نشكرك بالاسم عند تطبيق اقتراحك. يمكنك ترك هذا الحقل فارغاً.</p>
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="اسمك (اختياري)"
                            className="w-full p-3 bg-[rgba(var(--color-bg-rgb),0.5)] border-2 border-weak rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition mb-4"
                        />
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setStep(2)} className="w-full bg-[rgba(var(--color-text-rgb),0.05)] py-2.5 rounded-lg font-semibold hover:bg-[rgba(var(--color-text-rgb),0.1)] transition-colors">العودة</button>
                            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-x-2 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-500 disabled:bg-primary-500/70 font-semibold transition-all active:scale-95">
                                {isLoading ? <LoadingIcon /> : <span>إرسال الاقتراح</span>}
                            </button>
                        </div>
                    </StepCard>
                </form>
            )}
        </div>
    );
};


// --- Main Page Component ---
interface SuggestionsPageProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    activeColor: ColorTheme;
    setActiveColor: (color: ColorTheme) => void;
    activeBackground: BackgroundTheme;
    setActiveBackground: (bg: BackgroundTheme) => void;
}

const SuggestionsPage: React.FC<SuggestionsPageProps> = (props) => {
    const [expandedId, setExpandedId] = useState<'suggestions' | 'settings' | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [cardStyles, setCardStyles] = useState<React.CSSProperties[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    const sections = [
        {
            id: 'suggestions' as const,
            title: 'الاقتراحات والآراء',
            description: 'شاركنا أفكارك، أبلغ عن مشكلة، أو اطلب ميزة جديدة لتحسين التطبيق.',
            icon: <SendIcon />,
            component: <SuggestionWizard />,
        },
        {
            id: 'settings' as const,
            title: 'الإعدادات',
            description: 'خصص مظهر ولون وخلفية التطبيق.',
            icon: <SettingsIcon />,
            component: <SettingsPanel {...props} />,
        },
    ];

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
            
            // New "elegant and modern" coverflow animation
            const normalizedDistance = distance / (offsetWidth / 2);
            const rotation = normalizedDistance * -35; // Less rotation
            const translateZ = -Math.abs(normalizedDistance) * (card.offsetWidth * 0.5); // Less depth
            // translateY is removed for a flatter, sleeker look
            const scale = 1 - Math.abs(normalizedDistance) * 0.15; // Less scaling
            const opacity = 1 - Math.abs(normalizedDistance) * 0.4; // Less fade

            return {
                transform: `perspective(1000px) translateZ(${translateZ}px) rotateY(${rotation}deg) scale(${scale})`,
                opacity: Math.max(0.4, opacity), // Higher minimum opacity for visibility
                zIndex: cardRefs.current.length - Math.abs(Math.round(normalizedDistance)),
            };
        });
        
        setActiveIndex(closestIndex);
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

    const scrollToSection = (index: number) => {
        cardRefs.current[index]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    };
    
    const expandedSection = sections.find(s => s.id === expandedId);

    if (expandedSection) {
        return (
            <div className="h-[calc(100vh-5rem)] animate-fade-in-up">
                <div className="h-full overflow-y-auto scrollbar-hide p-4">
                    <button 
                        onClick={() => setExpandedId(null)} 
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full mb-2 text-secondary bg-transparent hover:bg-[rgba(var(--color-text-rgb),0.05)] transition-colors self-start"
                        aria-label="العودة"
                    >
                        <ArrowRightIcon />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-primary-500/10 text-primary-500 dark:text-primary-400">
                            <div className="w-7 h-7">{expandedSection.icon}</div>
                        </div>
                        <h2 className="text-2xl font-bold">{expandedSection.title}</h2>
                    </div>
                    {expandedSection.component}
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] text-center animate-fade-in">
            <header className="px-4 pt-4">
                <h1 className="text-3xl font-bold text-primary-500 dark:text-primary-400">الإعدادات والاقتراحات</h1>
                <p className="text-secondary mt-2">خصص تجربتك وساعدنا على التحسين</p>
            </header>

            <div 
                ref={scrollRef} 
                className="w-full flex-1 flex items-center gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory px-8 sm:px-16 scrollbar-hide"
            >
                {sections.map((section, index) => (
                        <div
                            key={section.id}
                            ref={el => { cardRefs.current[index] = el; }}
                            style={cardStyles[index] || {}}
                            onClick={() => setExpandedId(section.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(section.id); } }}
                            className={`group cursor-pointer flex-shrink-0 w-[85%] sm:w-2/3 md:w-1/2 max-w-xs aspect-[2/3] snap-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--color-bg-rgb))] focus-visible:ring-primary-400 rounded-3xl`}
                        >
                            <div className="suggestion-card w-full h-full bg-card-professional rounded-3xl border border-weak p-6 flex flex-col text-right shadow-lg group-hover:shadow-2xl dark:shadow-black/20 transition-all duration-300 ease-in-out group-hover:-translate-y-2">
                                <div className="absolute top-6 left-6 w-9 h-9 flex items-center justify-center bg-surface rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0">
                                    <div className="w-5 h-5 text-primary-500 dark:text-primary-300"><BackIcon /></div>
                                </div>

                                <div className="w-14 h-14 mb-auto rounded-2xl flex items-center justify-center bg-primary-500/10 text-primary-500 dark:text-primary-400 self-start transition-transform duration-300 ease-in-out">
                                    <div className="w-8 h-8">{section.icon}</div>
                                </div>
                                
                                <div className="z-10">
                                     <h2 className="font-bold text-2xl">{section.title}</h2>
                                     <p className="text-sm text-secondary mt-2 min-h-[3.5rem]">{section.description}</p>
                                </div>
                            </div>
                        </div>
                ))}
            </div>

            <div className="flex-shrink-0 flex justify-center gap-2 py-4">
                {sections.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollToSection(index)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${activeIndex === index ? 'w-6 bg-primary-500' : 'w-2.5 bg-[rgba(var(--color-text-rgb),0.2)]'}`}
                        aria-label={`Go to section ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default SuggestionsPage;
