
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
    
    // Luxury Premium Metallic Gradients
    const bgClass = isDiv1 
        ? "bg-gradient-to-br from-[#806B2A] via-[#D4AF37] to-[#40330E]" 
        : "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600";
        
    const textGlow = isDiv1 ? "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]";
    const accentColor = isDiv1 ? "text-[#FFF8E7]" : "text-slate-100";
    const glassBorder = isDiv1 ? "border-[#FFDF73]/40" : "border-white/30";

    return (
        <div 
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl shadow-premium cursor-pointer group transform hover:scale-[1.02] transition-all duration-500 ${bgClass} text-white min-h-[360px] flex flex-col items-center justify-center text-center p-8 border ${glassBorder}`}
        >
            {/* Animated Shimmer Overlay */}
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%] group-hover:animate-shimmer pointer-events-none transition-opacity"></div>
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-200%) skewX(-12deg); }
                    100% { transform: translateX(200%) skewX(-12deg); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite ease-in-out;
                }
            `}</style>
            
            {/* Background Texture - Giant Faded Logo */}
            {team.logoUrl && (
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none grayscale mix-blend-overlay">
                    <img src={team.logoUrl} className="w-full h-full object-cover scale-150 blur-sm" alt="" />
                </div>
            )}

            {/* Inner Glow Ring */}
            <div className={`absolute inset-2 border ${isDiv1 ? 'border-[#FFDF73]/20' : 'border-white/10'} rounded-xl pointer-events-none z-0`}></div>

            <div className="relative z-10 flex flex-col items-center w-full">
                {/* Crown Icon */}
                 <div className={`mb-3 ${isDiv1 ? 'text-[#FFF8E7]' : 'text-white'} drop-shadow-lg scale-110`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827 1.035l-1.74 3.258 2.169 3.903A1 1 0 0118 12H2a1 1 0 01-.91-1.403l2.169-3.903-1.74-3.258a1 1 0 011.827-1.035l1.699 3.181L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 1.472A3 3 0 004.197 12h11.606a3 3 0 00.015-.254l-.818-1.472L10 8.274l-5 3.274zM16.197 14H3.803l-.585 1.053A1 1 0 003.803 16h12.394a1 1 0 00.585-.947L16.197 14z" clipRule="evenodd" />
                    </svg>
                </div>

                <div className={`uppercase tracking-[0.3em] font-extrabold text-xs sm:text-sm mb-1 ${accentColor} opacity-90 drop-shadow-md`}>{tournamentName}</div>
                
                <h2 className={`text-4xl sm:text-5xl font-black uppercase mb-8 tracking-wider leading-tight ${textGlow}`}>
                    {division === 'Division 1' ? 'Champions' : 'Winners'}
                </h2>

                {/* Team Logo & Name Container */}
                <div className={`flex flex-col items-center gap-4 bg-primary/40 p-6 rounded-2xl backdrop-blur-md border ${isDiv1 ? 'border-[#FFDF73]/30' : 'border-white/20'} w-full max-w-sm shadow-2xl relative overflow-hidden group-hover:bg-primary/50 transition-colors`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                    {team.logoUrl ? (
                         <div className={`relative p-1 rounded-full bg-gradient-to-b ${isDiv1 ? 'from-[#FFDF73] to-[#806B2A]' : 'from-slate-200 to-slate-500'} shadow-glow`}>
                             <div className="bg-primary rounded-full p-[2px]">
                                <img src={team.logoUrl} alt={team.name} className="w-28 h-28 rounded-full object-cover bg-white" />
                             </div>
                         </div>
                    ) : (
                         <div className={`relative p-1 rounded-full bg-gradient-to-b ${isDiv1 ? 'from-[#FFDF73] to-[#806B2A]' : 'from-slate-200 to-slate-500'} shadow-glow`}>
                             <div className="w-28 h-28 rounded-full bg-secondary flex items-center justify-center">
                                <span className="text-3xl font-black text-white">{team.shortName}</span>
                             </div>
                         </div>
                    )}
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide leading-none mt-2 drop-shadow-md">{team.name}</h3>
                </div>

                <div className={`mt-8 px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest backdrop-blur-md border ${isDiv1 ? 'bg-[#40330E]/50 border-[#D4AF37]/50 text-[#FFDF73]' : 'bg-slate-800/50 border-slate-400/50 text-slate-200'} shadow-xl`}>
                    {resultText}
                </div>
            </div>
        </div>
    );
};
