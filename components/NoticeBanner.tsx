import React, { useState, useEffect } from 'react';
import type { Notice } from '../types';

interface NoticeBannerProps {
  notice: Notice;
}

const getLevelStyles = (level: Notice['level']) => {
    switch (level) {
        case 'Warning':
            return {
                bg: 'bg-yellow-500/20 border-yellow-500/30',
                iconColor: 'text-yellow-400',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                )
            };
        case 'Urgent':
            return {
                bg: 'bg-red-500/20 border-red-500/30',
                iconColor: 'text-red-400',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                )
            };
        case 'Information':
        default:
            return {
                bg: 'bg-blue-500/20 border-blue-500/30',
                iconColor: 'text-blue-400',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
    
    const { bg, icon, iconColor } = getLevelStyles(notice.level);

    return (
        <div className={`p-4 rounded-lg border flex items-start gap-4 ${bg}`}>
            <div className={`flex-shrink-0 ${iconColor}`}>
                {icon}
            </div>
            <div className="flex-grow">
                <h3 className="font-bold text-white">{notice.title}</h3>
                <p className="text-sm text-text-secondary mt-1">{notice.message}</p>
            </div>
            <button onClick={handleDismiss} className="text-text-secondary hover:text-white transition-colors flex-shrink-0 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};