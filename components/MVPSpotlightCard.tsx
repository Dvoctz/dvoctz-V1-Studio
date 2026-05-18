import React from 'react';
import type { Player, Team } from '../types';

interface MVPSpotlightCardProps {
    player: Player;
    team?: Team;
    awardCount: number;
    division: string;
    onClick: () => void;
}

export const MVPSpotlightCard: React.FC<MVPSpotlightCardProps> = ({ player, team, awardCount, division, onClick }) => {
    const isDiv1 = division === 'Division 1';
    
    return (
        <div 
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl shadow-premium cursor-pointer transform hover:translate-y-[-4px] hover:scale-[1.01] transition-all duration-300 border ${isDiv1 ? 'border-[#D4AF37]/40 bg-gradient-to-br from-[#1E293B] to-[#0F172A]' : 'border-slate-500/40 bg-gradient-to-br from-slate-800 to-slate-900'} group`}
        >
            {/* Background Glows */}
            <div className={`absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 ${isDiv1 ? 'bg-[#D4AF37]/10' : 'bg-slate-400/10'} rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700`}></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black/40 rounded-full blur-3xl"></div>

            <div className="p-8 relative z-10 flex flex-col items-center text-center">
                {/* Header */}
                <div className="mb-6">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-4 rounded-full ${isDiv1 ? 'bg-gradient-to-r from-[#D4AF37] to-[#806B2A] text-[#020617] shadow-glow' : 'bg-gradient-to-r from-slate-300 to-slate-500 text-slate-900 shadow-md'}`}>
                        {division} MVP
                    </span>
                </div>

                {/* Photo Container with premium borders */}
                <div className={`relative p-1 rounded-full mb-6 ${isDiv1 ? 'bg-gradient-to-b from-[#D4AF37] to-[#806B2A] shadow-glow' : 'bg-gradient-to-b from-slate-400 to-slate-600 shadow-md'}`}>
                    <div className="w-32 h-32 rounded-full bg-primary p-1">
                        {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.name} className="w-full h-full rounded-full object-cover grayscale-[30%] contrast-125" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-text-secondary/30">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    {/* Rank Badge */}
                     <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-4 border-primary flex items-center justify-center font-black ${isDiv1 ? 'bg-[#D4AF37] text-primary' : 'bg-slate-300 text-primary'}`}>
                        1
                    </div>
                </div>

                {/* Stats */}
                <h3 className="text-3xl font-black text-white mb-2 tracking-wide drop-shadow-md">{player.name}</h3>
                <p className={`text-sm font-semibold mb-6 tracking-wide ${isDiv1 ? 'text-[#D4AF37]' : 'text-slate-300'}`}>{team?.name || 'Free Agent'}</p>

                <div className="flex items-center gap-3 bg-black/40 px-5 py-3 border border-white/5 rounded-xl backdrop-blur-md shadow-inner">
                    {/* Minimalist Trophy SVG */}
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDiv1 ? 'text-[#D4AF37]' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 24 24">
                         <path d="M12,2.5c0,0-4-1-4,3v2c0,3,4,4,4,4s4-1,4-4V5.5C16,1.5,12,2.5,12,2.5z M20,6h-2v3.5c0,3.5-3.5,6-6,6.5v4h3v2H9v-2h3v-4c-2.5-0.5-6-3-6-6.5V6H4v2c0,4,3.5,6,6.5,6.5C10,18,12,19,12,19s2-1,1.5-4.5C16.5,14,20,12,20,8V6z"/>
                    </svg>
                    <div className="flex flex-col items-start border-l border-white/10 pl-3">
                        <span className="text-2xl font-black text-white leading-none tracking-wider">{awardCount}</span>
                        <span className="text-[10px] uppercase font-bold text-text-secondary mt-1 tracking-widest">MOTM</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
