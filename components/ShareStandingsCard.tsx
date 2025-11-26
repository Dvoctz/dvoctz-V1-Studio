
import React, { forwardRef } from 'react';
import type { TeamStanding } from '../types';

interface ShareStandingsCardProps {
  tournamentName: string;
  division: string;
  standings: TeamStanding[];
}

export const ShareStandingsCard = forwardRef<HTMLDivElement, ShareStandingsCardProps>(({ tournamentName, division, standings }, ref) => {
  return (
    <div 
        ref={ref}
        className="bg-primary text-white relative flex flex-col"
        style={{
            width: '540px',
            minHeight: '960px',
            padding: '32px',
            fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
    >
       {/* Background Pattern */}
       <div className="absolute inset-0 opacity-5 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid-standings" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-standings)" />
        </svg>
       </div>

       {/* Header */}
       <div className="text-center mb-8 z-10 border-b-4 border-highlight pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
                 </svg>
                 <span className="text-highlight font-bold tracking-widest uppercase text-sm">DVOC Tanzania</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">{tournamentName}</h1>
            <div className="inline-block bg-highlight text-primary px-4 py-1 rounded font-bold uppercase tracking-widest text-xs shadow-md">
                {division} • Standings
            </div>
       </div>

       {/* Table */}
       <div className="flex-grow z-10">
            <div className="w-full">
                {/* Table Header */}
                <div className="flex bg-secondary/80 text-text-secondary text-xs font-bold uppercase py-3 px-3 rounded-t-lg mb-2">
                    <div className="w-8 text-center">#</div>
                    <div className="flex-grow pl-2">Team</div>
                    <div className="w-10 text-center">P</div>
                    <div className="w-10 text-center">W</div>
                    <div className="w-10 text-center">L</div>
                    <div className="w-10 text-center">GD</div>
                    <div className="w-12 text-center text-white">Pts</div>
                </div>
                
                {/* Rows */}
                <div className="space-y-3">
                    {standings.map((s, index) => (
                        <div key={s.teamId} className="flex items-center bg-secondary/60 p-3 rounded-lg border-l-4 border-highlight shadow-sm">
                             <div className="w-8 text-center font-bold text-text-secondary">{index + 1}</div>
                             <div className="flex-grow flex items-center gap-3 pl-2 overflow-hidden">
                                {s.logoUrl ? (
                                    <img src={s.logoUrl} className="w-8 h-8 rounded-full object-cover border border-white/20" alt="" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-accent border border-white/20"></div>
                                )}
                                <span className="font-bold text-white text-base truncate">{s.teamName}</span>
                             </div>
                             <div className="w-10 text-center text-sm font-medium text-text-secondary">{s.gamesPlayed}</div>
                             <div className="w-10 text-center text-sm font-medium text-white">{s.wins}</div>
                             <div className="w-10 text-center text-sm font-medium text-text-secondary">{s.losses}</div>
                             <div className="w-10 text-center text-sm font-medium text-text-secondary">{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</div>
                             <div className="w-12 text-center font-black text-highlight text-xl">{s.points}</div>
                        </div>
                    ))}
                    
                    {standings.length === 0 && (
                        <div className="text-center py-12 text-text-secondary italic">
                            No standings available yet.
                        </div>
                    )}
                </div>
            </div>
       </div>

       {/* Footer */}
        <div className="mt-auto pt-8 text-center z-10">
            <div className="inline-block bg-highlight text-primary font-bold px-8 py-3 rounded-full text-xl shadow-lg mb-2">
                dvoctz.app
            </div>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Dar Es Salaam Volleyball Oversee Committee</p>
        </div>
    </div>
  );
});
