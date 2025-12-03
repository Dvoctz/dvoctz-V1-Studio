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
            className={`relative overflow-hidden rounded-xl shadow-2xl cursor-pointer transform hover:scale-105 transition-all duration-300 ${isDiv1 ? 'bg-gradient-to-br from-yellow-900 via-yellow-600 to-yellow-800' : 'bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800'}`}
        >
            {/* Background Accents */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-black/20 rounded-full blur-2xl"></div>

            <div className="p-6 relative z-10 flex flex-col items-center text-center">
                {/* Header */}
                <div className="mb-4">
                    <span className={`text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full ${isDiv1 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-300 text-gray-900'}`}>
                        {division} MVP Leader
                    </span>
                </div>

                {/* Photo */}
                <div className={`w-28 h-28 rounded-full p-1 mb-4 ${isDiv1 ? 'bg-yellow-400' : 'bg-gray-300'}`}>
                    {player.photoUrl ? (
                        <img src={player.photoUrl} alt={player.name} className="w-full h-full rounded-full object-cover border-4 border-black/20" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-black/20 flex items-center justify-center text-white/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <h3 className="text-2xl font-black text-white mb-1">{player.name}</h3>
                <p className={`text-sm font-bold mb-4 ${isDiv1 ? 'text-yellow-200' : 'text-gray-200'}`}>{team?.name || 'Free Agent'}</p>

                <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <span className="text-2xl">🏆</span>
                    <div className="flex flex-col items-start">
                        <span className="text-xl font-bold text-white leading-none">{awardCount}</span>
                        <span className="text-[10px] uppercase text-white/70 leading-none">Awards</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
