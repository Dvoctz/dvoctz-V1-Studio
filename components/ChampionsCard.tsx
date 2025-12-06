
import React from 'react';
import type { Team } from '../types';

interface ChampionsCardProps {
    team: Team;
    division: string;
    tournamentName: string;
    resultText: string;
    onClick: () => void;
}

export const ChampionsCard: React.FC<ChampionsCardProps> = ({ team, division, tournamentName, resultText, onClick }) => {
    const isDiv1 = division === 'Division 1';
    
    // Gold theme for Div 1, Silver/Metallic for Div 2
    const bgClass = isDiv1 
        ? "bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-900" 
        : "bg-gradient-to-br from-slate-300 via-slate-500 to-slate-700";
        
    const textGlow = isDiv1 ? "drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" : "drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]";
    const accentColor = isDiv1 ? "text-yellow-100" : "text-slate-100";

    return (
        <div 
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl shadow-2xl cursor-pointer group transform hover:scale-[1.02] transition-all duration-500 ${bgClass} text-white min-h-[320px] flex flex-col items-center justify-center text-center p-6 border-y-4 border-white/20`}
        >
            {/* Animated Shimmer Overlay */}
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] animate-shimmer pointer-events-none"></div>
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-200%) skewX(-12deg); }
                    20% { transform: translateX(200%) skewX(-12deg); }
                    100% { transform: translateX(200%) skewX(-12deg); }
                }
                .animate-shimmer {
                    animation: shimmer 5s infinite ease-in-out;
                }
            `}</style>
            
            {/* Background Texture - Giant Faded Logo */}
            {team.logoUrl && (
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none grayscale mix-blend-overlay">
                    <img src={team.logoUrl} className="w-full h-full object-cover scale-150" alt="" />
                </div>
            )}

            <div className="relative z-10 flex flex-col items-center w-full">
                {/* Crown Icon */}
                 <div className="mb-2 text-white/90 drop-shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827 1.035l-1.74 3.258 2.169 3.903A1 1 0 0118 12H2a1 1 0 01-.91-1.403l2.169-3.903-1.74-3.258a1 1 0 011.827-1.035l1.699 3.181L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 1.472A3 3 0 004.197 12h11.606a3 3 0 00.015-.254l-.818-1.472L10 8.274l-5 3.274zM16.197 14H3.803l-.585 1.053A1 1 0 003.803 16h12.394a1 1 0 00.585-.947L16.197 14z" clipRule="evenodd" />
                    </svg>
                </div>

                <div className={`uppercase tracking-[0.2em] font-bold text-xs sm:text-sm mb-1 ${accentColor} opacity-90`}>{tournamentName}</div>
                
                <h2 className={`text-3xl sm:text-4xl font-black uppercase mb-6 leading-tight ${textGlow}`}>
                    {division === 'Division 1' ? 'Champions' : 'Winners'}
                </h2>

                {/* Team Logo & Name Container */}
                <div className="flex flex-col items-center gap-3 bg-black/20 p-6 rounded-xl backdrop-blur-sm border border-white/20 w-full max-w-xs shadow-xl">
                    {team.logoUrl ? (
                         <img src={team.logoUrl} alt={team.name} className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-2xl bg-white" />
                    ) : (
                         <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                            <span className="text-2xl font-bold">{team.shortName}</span>
                         </div>
                    )}
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide leading-none mt-2">{team.name}</h3>
                </div>

                <div className="mt-6 bg-white/20 px-6 py-2 rounded-full text-sm font-bold backdrop-blur-md border border-white/10 shadow-lg">
                    {resultText}
                </div>
            </div>
        </div>
    );
};
