import React, { useState, useMemo } from 'react';
import { 
    ChildIcon, HistoryBookIcon, GraduationCapIcon, ArrowRightIcon, BackIcon,
    CalculatorIcon, AtomIcon, BeakerIcon, QuillIcon, DnaIcon, BrainIcon, 
    BookIcon, GlobeIcon, DownloadIcon
} from '../components/icons/Icons';

// --- Data Structure ---
interface Book { name: string; downloadUrl: string; icon: React.ReactElement; }
interface Grade { name: string; books: Book[]; }
interface Stage { name: string; description: string; grades: Grade[]; icon: React.ReactElement; }

const TEXTBOOKS_DATA: Stage[] = [
    {
        name: 'المرحلة الابتدائية',
        description: 'من الصف الأول إلى السادس',
        icon: <ChildIcon className="w-12 h-12" />,
        grades: [
            { name: 'الصف الأول', books: [
                { name: 'الرياضيات', downloadUrl: '#', icon: <CalculatorIcon /> },
                { name: 'اللغة العربية', downloadUrl: '#', icon: <QuillIcon /> },
            ]},
            { name: 'الصف الثاني', books: [] },
            { name: 'الصف الثالث', books: [] },
            { name: 'الصف الرابع', books: [] },
            { name: 'الصف الخامس', books: [] },
            { name: 'الصف السادس', books: [] },
        ]
    },
    {
        name: 'المرحلة الإعدادية',
        description: 'من الصف السابع إلى التاسع',
        icon: <HistoryBookIcon className="w-12 h-12" />,
        grades: [
            { name: 'الصف السابع', books: [] },
            { name: 'الصف الثامن', books: [] },
            { name: 'الصف التاسع', books: [
                { name: 'الرياضيات - الجبر', downloadUrl: '#', icon: <CalculatorIcon /> },
                { name: 'الرياضيات - الهندسة', downloadUrl: '#', icon: <CalculatorIcon /> },
                { name: 'الفيزياء والكيمياء', downloadUrl: '#', icon: <AtomIcon /> },
                { name: 'اللغة العربية', downloadUrl: '#', icon: <QuillIcon /> },
            ]},
        ]
    },
    {
        name: 'المرحلة الثانوية',
        description: 'من الصف العاشر إلى البكالوريا',
        icon: <GraduationCapIcon className="w-12 h-12" />,
        grades: [
            { name: 'الصف العاشر', books: [
                { name: 'اللغة العربية', downloadUrl: '#', icon: <QuillIcon /> },
                { name: 'التاريخ', downloadUrl: '#', icon: <BookIcon /> },
            ]},
            { name: 'الصف الحادي عشر', books: [
                { name: 'الكيمياء', downloadUrl: '#', icon: <BeakerIcon /> },
                { name: 'الجغرافيا', downloadUrl: '#', icon: <GlobeIcon /> },
            ]},
            { name: 'البكالوريا', books: [
                { name: 'علم الأحياء', downloadUrl: '#', icon: <DnaIcon /> },
                { name: 'الفلسفة', downloadUrl: '#', icon: <BrainIcon /> },
            ]},
        ]
    }
];

// --- Reusable Components ---

const StepCard: React.FC<{
    step: number;
    title: string;
    onBack?: () => void;
    children: React.ReactNode;
}> = ({ step, title, onBack, children }) => (
    <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-weak shadow-lg">
        <div className="flex items-center gap-4 mb-5">
            {onBack && (
                <button 
                    onClick={onBack} 
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-secondary bg-transparent hover:bg-[rgba(var(--color-text-rgb),0.05)] transition-colors"
                >
                    <ArrowRightIcon />
                </button>
            )}
            <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg rounded-full bg-primary-500 shadow-md shadow-primary-500/30`}>
                {step}
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div>
            {children}
        </div>
    </div>
);

const SelectionCard: React.FC<{
    title: string;
    description?: string;
    icon: React.ReactElement;
    onClick: () => void;
}> = ({ title, description, icon, onClick }) => (
    <button onClick={onClick} className="w-full text-center p-6 bg-card-professional rounded-2xl border border-weak transition-all duration-300 hover:border-primary-400/50 hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-black/20 hover:-translate-y-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">
        <div className="mx-auto w-fit text-primary-500 dark:text-primary-400 mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
        {description && <p className="text-sm text-secondary mt-1">{description}</p>}
    </button>
);


// --- Main Page Component ---

const TextbooksPage: React.FC = () => {
    const [step, setStep] = useState(1); // 1: stage, 2: grade, 3: books
    const [selectedStageName, setSelectedStageName] = useState('');
    const [selectedGradeName, setSelectedGradeName] = useState('');

    const selectedStage = useMemo(() => 
        TEXTBOOKS_DATA.find(s => s.name === selectedStageName),
        [selectedStageName]
    );

    const selectedGrade = useMemo(() =>
        selectedStage?.grades.find(g => g.name === selectedGradeName),
        [selectedStage, selectedGradeName]
    );

    const handleStageSelect = (stageName: string) => {
        setSelectedStageName(stageName);
        setStep(2);
    };

    const handleGradeSelect = (gradeName: string) => {
        setSelectedGradeName(gradeName);
        setStep(3);
    };

    const handleBack = () => {
        setStep(prev => Math.max(1, prev - 1));
    };

    const renderContent = () => {
        switch (step) {
            case 2:
                return (
                    <StepCard step={2} title={`اختر الصف الدراسي`} onBack={handleBack}>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedStage?.grades.map(grade => (
                                <SelectionCard
                                    key={grade.name}
                                    title={grade.name}
                                    icon={<BookIcon />}
                                    onClick={() => handleGradeSelect(grade.name)}
                                />
                            ))}
                        </div>
                    </StepCard>
                );
            case 3:
                return (
                    <StepCard step={3} title={`كتب ${selectedGradeName}`} onBack={handleBack}>
                        <div className="space-y-3">
                            {selectedGrade?.books.length ? selectedGrade.books.map(book => (
                                <div key={book.name} className="flex items-center gap-4 p-3 bg-card-professional rounded-lg border border-weak">
                                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-primary-500/10 text-primary-500 rounded-lg">
                                        {book.icon}
                                    </div>
                                    <p className="flex-grow font-semibold">{book.name}</p>
                                    <a
                                        href={book.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-primary-600 text-white py-2 px-4 text-sm font-bold rounded-lg hover:bg-primary-500 transition-transform duration-200 active:scale-95"
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                        <span>تحميل</span>
                                    </a>
                                </div>
                            )) : (
                                <p className="text-center text-secondary py-4">سيتم إضافة كتب هذا الصف قريباً.</p>
                            )}
                        </div>
                    </StepCard>
                );
            case 1:
            default:
                return (
                    <StepCard step={1} title="اختر المرحلة الدراسية">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {TEXTBOOKS_DATA.map(stage => (
                                <SelectionCard
                                    key={stage.name}
                                    title={stage.name}
                                    description={stage.description}
                                    icon={stage.icon}
                                    onClick={() => handleStageSelect(stage.name)}
                                />
                            ))}
                        </div>
                    </StepCard>
                );
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <header className="text-center mb-6">
                <h1 className="text-3xl font-bold text-primary-500 dark:text-primary-400">الكتب المدرسية</h1>
                <p className="text-secondary mt-2">تصفح وحمل الكتب المدرسية لجميع المراحل</p>
            </header>

            <div className="mb-6 bg-surface-backdrop border-r-4 border-primary-500 p-4 rounded-lg">
                <p className="text-sm font-semibold">
                    جميع الكتب هي النسخ الرسمية المعتمدة من وزارة التربية للعام الدراسي 2025-2026.
                </p>
            </div>

            <div key={step} className="animate-fade-in-up">
                {renderContent()}
            </div>
        </div>
    );
};

export default TextbooksPage;
