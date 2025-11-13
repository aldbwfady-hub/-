import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { ChatMessage } from '../types';
import { getChatResponse } from '../services/geminiService';
import { SendIcon, MicrophoneIcon, BellIcon } from '../components/icons/Icons';

const PaperClipIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" />
    </svg>
);

const XCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" strokeWidth={1.5} stroke="white" className="w-6 h-6">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
)

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error('Failed to read file as Base64'));
            }
        };
        reader.onerror = (error) => reject(error);
    });

const ChatPage: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastStyle, setToastStyle] = useState<CSSProperties>({ top: '-100px', opacity: 0, transition: 'top 0.5s ease-out, opacity 0.5s ease-out' });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const formRef = useRef<HTMLFormElement>(null);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    useEffect(() => {
        // Show welcome toast on first load
        setShowToast(true);
        setTimeout(() => setToastStyle(prev => ({ ...prev, top: '1rem', opacity: 1 })), 100);

        // Hide and remove toast
        const hideTimer = setTimeout(() => {
            setToastStyle(prev => ({ ...prev, top: '-100px', opacity: 0 }));
        }, 4500);
        const removeTimer = setTimeout(() => setShowToast(false), 5000);

        return () => {
            clearTimeout(hideTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const textToSend = input;
        if ((textToSend.trim() === '' && !imageFile) || isLoading) return;

        // Blur input to collapse it visually
        textareaRef.current?.blur();

        const userMessage: ChatMessage = { sender: 'user', text: textToSend, imageUrl: imagePreview };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        removeImage();
        setIsLoading(true);

        const history = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const newMessageParts: any[] = [];
        if (textToSend.trim()) {
            newMessageParts.push({ text: textToSend });
        }
        if (imageFile) {
            try {
                const base64Image = await fileToBase64(imageFile);
                newMessageParts.push({
                    inlineData: {
                        data: base64Image,
                        mimeType: imageFile.type
                    }
                });
            } catch (error) {
                console.error("Error converting image to base64:", error);
                const errorMessage: ChatMessage = { sender: 'bot', text: 'عذراً، حدث خطأ أثناء معالجة الصورة.' };
                setMessages((prev) => [...prev, errorMessage]);
                setIsLoading(false);
                return;
            }
        }

        const botResponseText = await getChatResponse(history, newMessageParts);
        const botMessage: ChatMessage = { sender: 'bot', text: botResponseText };

        setMessages((prev) => [...prev, botMessage]);
        setIsLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            formRef.current?.requestSubmit();
        }
    };

    const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
        const renderText = (txt: string) => {
            const parts = txt.split(/(\*\*.*?\*\*|\*.*?\*)/g);
            return parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                    return <em key={index}>{part.slice(1, -1)}</em>;
                }
                return part;
            });
        };

        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        let listItems: string[] = [];
        let listType: 'ul' | 'ol' | null = null;

        const flushList = () => {
            if (listItems.length > 0) {
                const ListComponent = listType === 'ol' ? 'ol' : 'ul';
                const listStyle = listType === 'ol' ? 'list-decimal' : 'ul';
                elements.push(
                    <ListComponent key={`list-${elements.length}`} className={`${listStyle} list-inside space-y-1 my-2 mr-4`}>
                        {listItems.map((item, i) => <li key={i}>{renderText(item)}</li>)}
                    </ListComponent>
                );
                listItems = [];
                listType = null;
            }
        };

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            const isUnorderedList = trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ');
            const isOrderedList = /^\d+\.\s/.test(trimmedLine);

            if (isUnorderedList) {
                if (listType === 'ol') flushList();
                listType = 'ul';
                listItems.push(trimmedLine.substring(2));
            } else if (isOrderedList) {
                if (listType === 'ul') flushList();
                listType = 'ol';
                listItems.push(trimmedLine.replace(/^\d+\.\s/, ''));
            } else {
                flushList();
                if (trimmedLine.startsWith('### ')) {
                     elements.push(<h4 key={`h4-${index}`} className="text-md font-bold mt-2 mb-1">{renderText(trimmedLine.substring(4))}</h4>);
                } else if (trimmedLine.startsWith('## ')) {
                     elements.push(<h3 key={`h3-${index}`} className="text-lg font-bold mt-3 mb-1">{renderText(trimmedLine.substring(3))}</h3>);
                } else if (trimmedLine.startsWith('# ')) {
                     elements.push(<h2 key={`h2-${index}`} className="text-xl font-bold mt-4 mb-2">{renderText(trimmedLine.substring(2))}</h2>);
                } else if (trimmedLine) {
                    elements.push(<p key={`p-${index}`}>{renderText(trimmedLine)}</p>);
                }
            }
        });

        flushList();

        return <div className="space-y-1 text-sm break-words">{elements}</div>;
    };

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto px-4 pt-4">
            {showToast && (
                <div style={toastStyle} className="fixed top-4 right-1/2 translate-x-1/2 z-[100] max-w-[90%]">
                    <div className="flex items-center gap-3 bg-surface-backdrop py-2 pl-3 pr-5 rounded-full shadow-lg border border-primary-500/30">
                        <div className="w-6 h-6 text-primary-500 dark:text-primary-400 flex-shrink-0">
                            <BellIcon />
                        </div>
                        <p className="text-sm font-medium">
                            سيتم تدريب النموذج قريباً على المناهج السورية الحديثة.
                        </p>
                    </div>
                </div>
            )}
            <div className="flex-grow overflow-y-auto space-y-4 pb-48">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl shadow-lg transition-all duration-300 bg-surface ${
                          msg.sender === 'user'
                            ? 'border border-primary-500 dark:border-primary-400 rounded-br-none'
                            : 'border border-weak rounded-bl-none'
                        }`}>
                            {msg.imageUrl && (
                                <img src={msg.imageUrl} alt="User upload" className="rounded-lg mb-2 max-w-full h-auto" />
                            )}
                            {msg.text && (msg.sender === 'bot' ? <MarkdownRenderer text={msg.text} /> : <p className="text-sm break-words">{msg.text}</p>)}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-end">
                        <div className="bg-surface border-weak border rounded-2xl rounded-bl-none p-3 shadow-lg">
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            <div className="fixed bottom-[8rem] left-0 right-0 z-40 bg-gradient-to-t from-[rgb(var(--color-bg-rgb))] via-40% via-[rgb(var(--color-bg-rgb))] to-transparent">
                <div className="max-w-3xl mx-auto px-4 w-full flex flex-col items-center gap-2">
                     {imagePreview && (
                        <div className="w-fit self-start ml-auto mr-auto sm:ml-12">
                            <div className="relative w-20 h-20 p-1 bg-surface rounded-lg border border-weak shadow-md animate-fade-in-up">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded" />
                                <button onClick={removeImage} type="button" className="absolute -top-2 -left-2 bg-[rgb(var(--color-text-rgb))] rounded-full">
                                    <XCircleIcon />
                                </button>
                            </div>
                        </div>
                    )}
                    <form
                        ref={formRef}
                        onSubmit={handleSendMessage}
                        className="chat-input-bar w-full max-w-3xl"
                        onClick={() => textareaRef.current?.focus()}
                    >
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="icon-button"
                            disabled={isLoading}
                            aria-label="Attach file"
                        >
                            <PaperClipIcon />
                        </button>
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="رسالتك..."
                            className="text-sm"
                            disabled={isLoading}
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                            accept="image/*"
                        />
                         <div className="chat-icon-swap">
                             <button
                                type="button"
                                className="icon-button mic-button"
                                aria-label="Start voice input"
                             >
                                <MicrophoneIcon className="w-6 h-6" />
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || (input.trim() === '' && !imageFile)}
                                className="icon-button send-button"
                                aria-label="Send message"
                            >
                                <SendIcon />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;