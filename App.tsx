
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import ChatPage from './pages/ChatPage';
import TextbooksPage from './pages/TextbooksPage';
import ToolsPage from './pages/ToolsPage';
import SuggestionsPage from './pages/SuggestionsPage';
import { Page, Theme, ColorTheme, BackgroundTheme } from './types';
import InteractiveBackground from './components/InteractiveBackground';


// --- Running Man Easter Egg Component ---
const RunningMan: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isDead, setIsDead] = useState(false);
  const manRef = useRef<HTMLDivElement>(null);
  const animationTimeoutRef = useRef<number>();
  const deathTimeoutRef = useRef<number>();

  useEffect(() => {
    // The animation duration is 4s.
    animationTimeoutRef.current = window.setTimeout(onComplete, 4000); 
    
    return () => {
      clearTimeout(animationTimeoutRef.current);
      clearTimeout(deathTimeoutRef.current);
    };
  }, [onComplete]);

  const handleClick = () => {
    if (!isDead && manRef.current) {
        clearTimeout(animationTimeoutRef.current); // Stop the original completion timer
        manRef.current.style.animationPlayState = 'paused';
        setIsDead(true);
        deathTimeoutRef.current = window.setTimeout(onComplete, 500); // Death animation duration
    }
  };

  return (
    <div
      ref={manRef}
      className="running-man-container"
      onClick={handleClick}
      role="button"
      tabIndex={-1}
      aria-label="Funny running man"
    >
      <div className={`running-man-character ${isDead ? 'dead' : ''}`}>
        <svg viewBox="0 0 40 50" fill="none" stroke="rgb(var(--color-text-rgb))" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="20" cy="7" r="6" strokeWidth="2" className="head" />
            <path d="M 20 13 V 30" strokeWidth="3" />
            <path d="M 20 20 L 10 15" strokeWidth="2.5" className="arm-1" />
            <path d="M 20 20 L 30 25" strokeWidth="2.5" className="arm-2" />
            <path d="M 20 30 L 10 45" strokeWidth="3" className="leg-1" />
            <path d="M 20 30 L 30 45" strokeWidth="3" className="leg-2" />
        </svg>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('chat');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
  const [activeColor, setActiveColor] = useState<ColorTheme>(() => (localStorage.getItem('colorTheme') as ColorTheme) || 'gold');
  const [activeBackground, setActiveBackground] = useState<BackgroundTheme>(() => (localStorage.getItem('backgroundTheme') as BackgroundTheme) || 'bg-3d-1');
  
  const [showMan, setShowMan] = useState(false);
  const [manKey, setManKey] = useState(0);
  const timerRef = useRef<number>();

  const scheduleNextRun = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const delay = Math.random() * 20000 + 10000; // 10-30 seconds
    timerRef.current = window.setTimeout(() => {
      setShowMan(true);
    }, delay);
  }, []);

  useEffect(() => {
    scheduleNextRun();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [scheduleNextRun]);

  const handleManComplete = () => {
    setShowMan(false);
    setManKey(prev => prev + 1);
    scheduleNextRun();
  };

  useEffect(() => {
    const doc = document.documentElement;
    const body = document.body;
    
    // Clean up old theme classes
    Array.from(doc.classList).forEach(className => {
        if (className.startsWith('theme-')) {
            doc.classList.remove(className);
        }
    });
    // Clean up old background classes
    Array.from(body.classList).forEach(className => {
      if (className.startsWith('bg-pro-') || className.startsWith('bg-3d-')) {
        body.classList.remove(className);
      }
    });

    // Add color theme class
    doc.classList.add(`theme-${activeColor}`);
    
    // Add background theme class
    body.classList.add(activeBackground);
    
    // Function to apply light/dark theme
    const applySystemTheme = (isDark: boolean) => {
        doc.classList.remove('dark', 'light');
        doc.classList.add(isDark ? 'dark' : 'light');
    };

    let mediaQuery: MediaQueryList | undefined;
    let systemThemeChangeHandler: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | undefined;
    
    if (theme === 'system') {
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        applySystemTheme(mediaQuery.matches);
        systemThemeChangeHandler = (e) => applySystemTheme(e.matches);
        mediaQuery.addEventListener('change', systemThemeChangeHandler);
    } else {
        doc.classList.remove('dark', 'light');
        doc.classList.add(theme);
    }

    // Save to local storage
    localStorage.setItem('theme', theme);
    localStorage.setItem('colorTheme', activeColor);
    localStorage.setItem('backgroundTheme', activeBackground);

    return () => {
        if (mediaQuery && systemThemeChangeHandler) {
            mediaQuery.removeEventListener('change', systemThemeChangeHandler);
        }
    };
  }, [theme, activeColor, activeBackground]);
  
  const renderPage = () => {
    switch (activePage) {
      case 'chat':
        return <ChatPage />;
      case 'textbooks':
        return <TextbooksPage />;
      case 'tools':
        return <ToolsPage />;
      case 'settings':
        return <SuggestionsPage 
                  theme={theme} 
                  setTheme={setTheme}
                  activeColor={activeColor}
                  setActiveColor={setActiveColor}
                  activeBackground={activeBackground}
                  setActiveBackground={setActiveBackground}
                />;
      default:
        return <ChatPage />;
    }
  };

  return (
    <div className="bg-transparent min-h-screen flex flex-col font-sans">
      <InteractiveBackground />
      {showMan && <RunningMan key={manKey} onComplete={handleManComplete} />}
      <main className="flex-grow pb-32">
        {renderPage()}
      </main>
      <Navbar activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
};

export default App;