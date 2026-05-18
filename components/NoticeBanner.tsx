import React, { useState, useEffect } from 'react';
import type { Notice } from '../types';

interface NoticeBannerProps {
  notice: Notice;
}

const getLevelStyles = (level: Notice['level']) => {
    switch (level) {
        case 'Warning':
            return {
                bg: 'bg-gradient-to-r from-amber-500/20 to-primary/90 border-amber-500/30',
                iconColor: 'bg-amber-500 text-primary shadow-glow shadow-amber-500/20',
                textColor: 'text-amber-400',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                )
            };
        case 'Urgent':
            return {
                bg: 'bg-gradient-to-r from-red-600/20 to-primary/90 border-red-500/30',
                iconColor: 'bg-red-500 text-white shadow-glow shadow-red-500/20',
                textColor: 'text-red-400',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            };
        case 'Information':
        default:
            return {
                bg: 'bg-gradient-to-r from-blue-500/20 to-primary/90 border-blue-500/30',
                iconColor: 'bg-blue-500 text-white shadow-glow shadow-blue-500/20',
                textColor: 'text-blue-400',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            };
    }
};

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ notice }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        const dismissedId = sessionStorage.getItem('dismissedNoticeId');
        if (dismissedId !== String(notice.id)) {
            setIsVisible(true);
        }
    }, [notice.id]);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('dismissedNoticeId', String(notice.id));
    };

    if (!isVisible) {
        return null;
    }
    
    const { bg, icon, iconColor, textColor } = getLevelStyles(notice.level);

    return (
        <div className={`p-4 rounded-2xl border backdrop-blur-sm flex items-start sm:items-center gap-4 ${bg} shadow-lg relative overflow-hidden group animate-fade-in-up`}>
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${iconColor} relative z-10`}>
                {icon}
            </div>
            
            <div className="flex-grow relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <h3 className={`font-black text-xs uppercase tracking-widest ${textColor}`}>{notice.title}</h3>
                    <span className="hidden sm:inline text-white/20">•</span>
                    <p className="text-sm font-medium text-slate-300">{notice.message}</p>
                </div>
            </div>
            
            <button onClick={handleDismiss} className="text-white/40 hover:text-white transition-colors flex-shrink-0 p-2 hover:bg-white/10 rounded-full relative z-10">
                <span className="sr-only">Dismiss</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};