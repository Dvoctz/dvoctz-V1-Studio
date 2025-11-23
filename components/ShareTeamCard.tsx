
import React, { forwardRef } from 'react';
import type { Fixture, Team, Tournament, Player } from '../types';

interface ShareTeamCardProps {
  team: Team;
  tournament: Tournament;
  roster: Player[];
  upcomingFixtures: Fixture[];
  officiatingFixtures: Fixture[];
  getTeam: (id: number) => Team | undefined;
}

export const ShareTeamCard = forwardRef<HTMLDivElement, ShareTeamCardProps>(({ team, tournament, roster, upcomingFixtures, officiatingFixtures, getTeam }, ref) => {
    
    // Helper to format date nicely
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div 
            ref={ref} 
            className="bg-primary text-white relative flex flex-col" 
            style={{ 
                width: '540px', 
                minHeight: '960px', 
                padding: '32px',
                fontFamily: 'Inter, system-ui, sans-serif'
            }}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                 <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid-team" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-team)" />
                </svg>
            </div>

            {/* Header */}
            <div className="text-center mb-8 z-10 border-b-4 border-highlight pb-6">
                <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">{team.name}</h1>
                <div className="inline-block bg-highlight text-primary px-4 py-1 rounded font-bold uppercase tracking-widest text-sm">
                    {tournament.name}
                </div>
            </div>

            <div className="flex-grow z-10 space-y-8">
                
                {/* Section 1: Roster */}
                <div>
                    <h3 className="text-2xl font-bold text-highlight uppercase mb-4 flex items-center">
                        <span className="w-2 h-8 bg-highlight mr-2 rounded"></span>
                        Match Day Squad
                    </h3>
                    {roster.length > 0 ? (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {roster.map(p => (
                                <div key={p.id} className="bg-secondary/80 p-2 rounded flex items-center justify-between">
                                    <span className="font-bold text-white text-sm truncate">{p.name}</span>
                                    <span className="text-[10px] text-highlight uppercase tracking-wider ml-1">{p.role.split(' ')[0]}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-secondary italic">Roster not set for this tournament.</p>
                    )}
                </div>

                {/* Section 2: Upcoming Fixtures */}
                <div>
                    <h3 className="text-2xl font-bold text-highlight uppercase mb-4 flex items-center">
                        <span className="w-2 h-8 bg-highlight mr-2 rounded"></span>
                        Upcoming Fixtures
                    </h3>
                    <div className="space-y-3">
                        {upcomingFixtures.slice(0, 3).map(f => {
                            const isTeam1 = f.team1Id === team.id;
                            const opponentId = isTeam1 ? f.team2Id : f.team1Id;
                            const opponent = getTeam(opponentId);
                            
                            return (
                                <div key={f.id} className="bg-secondary p-3 rounded-lg border-l-4 border-white flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-text-secondary uppercase font-bold">
                                            {formatDate(f.dateTime)} @ {formatTime(f.dateTime)}
                                        </span>
                                        <span className="text-white font-bold text-lg">
                                            <span className="text-text-secondary text-sm mr-1">vs</span> {opponent?.name || 'TBD'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] bg-primary px-2 py-1 rounded text-highlight uppercase font-bold">
                                            {f.ground}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {upcomingFixtures.length === 0 && <p className="text-text-secondary italic">No upcoming matches scheduled.</p>}
                    </div>
                </div>

                {/* Section 3: Officiating Duties */}
                {officiatingFixtures.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-bold text-highlight uppercase mb-4 flex items-center">
                            <span className="w-2 h-8 bg-highlight mr-2 rounded"></span>
                            Officiating Duties
                        </h3>
                        <div className="space-y-3">
                            {officiatingFixtures.slice(0, 3).map(f => {
                                const t1 = getTeam(f.team1Id);
                                const t2 = getTeam(f.team2Id);
                                
                                return (
                                    <div key={f.id} className="bg-secondary/50 p-3 rounded-lg border-l-4 border-highlight flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-text-secondary uppercase font-bold">
                                                {formatDate(f.dateTime)} @ {formatTime(f.dateTime)}
                                            </span>
                                            <div className="text-white font-medium text-sm">
                                                Ref: {t1?.name || 'TBD'} vs {t2?.name || 'TBD'}
                                            </div>
                                        </div>
                                         <div className="text-right">
                                            <span className="text-[10px] text-text-secondary uppercase">
                                                {f.ground}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 text-center z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-highlight font-bold tracking-widest uppercase">DVOC Tanzania</span>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-highlight to-transparent opacity-50"></div>
            </div>
        </div>
    );
});
