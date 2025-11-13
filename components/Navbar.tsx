import React, { useRef, useEffect } from 'react';
import { Page } from '../types';
import { ChatIcon, BookIcon, ToolsIcon, SettingsIcon } from './icons/Icons';

interface NavbarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const navItems: { page: Page; label: string; icon: React.ReactElement }[] = [
    { page: 'chat', label: 'الدردشة', icon: <ChatIcon /> },
    { page: 'textbooks', label: 'الكتب', icon: <BookIcon /> },
    { page: 'tools', label: 'الأدوات', icon: <ToolsIcon /> },
    { page: 'settings', label: 'الإعدادات', icon: <SettingsIcon /> },
];

const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = navItems.findIndex(item => item.page === activePage);
    if (activeIndex !== -1 && itemRefs.current[activeIndex]) {
        itemRefs.current[activeIndex]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }
  }, [activePage]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-transparent pb-1">
      <div 
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto snap-x snap-mandatory px-4 py-3 scrollbar-hide"
      >
        {navItems.map((item, index) => {
          const isActive = activePage === item.page;
          return (
            <button
              key={item.page}
              ref={el => { if(el) itemRefs.current[index] = el; }}
              onClick={() => setActivePage(item.page)}
              className={`
                snap-center flex-shrink-0 w-24 rounded-2xl p-2 flex flex-col items-center justify-center gap-y-1 
                transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
                ${isActive 
                  ? 'h-24 bg-surface shadow-lg scale-100 opacity-100 border-2 border-primary-500'
                  : 'h-20 bg-surface-backdrop shadow-md scale-95 opacity-80 border border-weak'}
              `}
              title={item.label}
              aria-label={item.label}
            >
              <div className={`w-7 h-7 transition-colors duration-300 ${
                isActive
                  ? 'text-primary-500 dark:text-primary-400' 
                  : 'text-secondary'
              }`}>
                {item.icon}
              </div>
              <span className={`text-xs font-bold transition-colors duration-300 ${
                isActive 
                  ? 'text-primary-600 dark:text-primary-300' 
                  : 'text-secondary'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;