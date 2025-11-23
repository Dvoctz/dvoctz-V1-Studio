
import React, { forwardRef } from 'react';
import type { Fixture, Team, Tournament } from '../types';

interface ShareFixtureCardProps {
  date: string;
  fixtures: Fixture[];
  getTeam: (id: number) => Team | undefined;
  getTournament: (id: number) => Tournament | undefined;
}

// Fixed dimensions for optimal sharing (like WhatsApp Status)
// We scale this down in the preview using CSS transforms
export const ShareFixtureCard = forwardRef<HTMLDivElement, ShareFixtureCardProps>(({ date, fixtures, getTeam, getTournament }, ref) => {
    
    // Sort fixtures by time
    const sortedFixtures = [...fixtures].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    return (
        <div 
            ref={ref} 
            className="bg-primary text-white relative overflow-hidden flex flex-col" 
            style={{ 
                width: '540px', 
                minHeight: '960px', 
                padding: '32px',
                // Explicit font family fallback to ensure it renders even if we skip webfont fetching
                fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}
        >
            {/* Background Texture/Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                 <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Header */}
            <div className="flex flex-col items-center justify-center mb-8 border-b-4 border-highlight pb-6 z-10">
                 <div className="flex items-center gap-3 mb-2">
                    {/* SVG Logo re-used here for the image capture */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
                    </svg>
                    <span className="text-3xl font-extrabold text-white tracking-widest">DVOC TZ</span>
                 </div>
                 <div className="text-highlight text-sm font-bold tracking-[0.3em] uppercase">Daily Schedule</div>
            </div>
            
            <div className="text-center mb-8 z-10">
                <h2 className="text-4xl font-black text-white uppercase drop-shadow-md">
                    {new Date(date).toLocaleDateString(undefined, { weekday: 'long' })}
                </h2>
                <p className="text-2xl text-text-secondary mt-2 font-medium">
                    {new Date(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
            </div>

            {/* Fixtures List */}
            <div className="flex-grow space-y-6 z-10">
                {sortedFixtures.map((f, i) => {
                    const t1 = getTeam(f.team1Id);
                    const t2 = getTeam(f.team2Id);
                    const tourney = getTournament(f.tournamentId);
                    const time = new Date(f.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}); // 12-hour format looks better on posters
                    
                    return (
                        <div key={i} className="bg-secondary/90 rounded-xl p-5 flex flex-col gap-4 border-l-8 border-highlight shadow-lg">
                            <div className="flex justify-between items-center text-text-secondary border-b border-accent pb-2 mb-1">
                                <span className="font-black text-2xl text-white">{time}</span>
                                <span className="uppercase tracking-wider text-xs font-bold bg-primary px-3 py-1 rounded text-highlight">
                                    {tourney?.division || 'Friendly'}
                                </span>
                            </div>
                            
                            <div className="flex items-center justify-between gap-4 px-2 py-2">
                                {/* Team 1 */}
                                <div className="flex-1 text-right flex flex-col justify-center">
                                    <span className="text-2xl font-black text-white leading-tight uppercase drop-shadow-sm">
                                        {t1?.name || 'TBD'}
                                    </span>
                                </div>

                                <div className="flex-shrink-0 px-2">
                                    <span className="text-2xl font-black text-highlight italic">VS</span>
                                </div>

                                {/* Team 2 */}
                                <div className="flex-1 text-left flex flex-col justify-center">
                                    <span className="text-2xl font-black text-white leading-tight uppercase drop-shadow-sm">
                                        {t2?.name || 'TBD'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <div className="flex items-center justify-center text-sm text-text-secondary bg-black/20 py-1.5 rounded">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="font-medium truncate max-w-[300px] uppercase tracking-wide">{f.ground}</span>
                                </div>
                                
                                {f.referee && (
                                    <div className="flex items-center justify-center text-xs text-highlight font-bold bg-black/10 py-1 rounded uppercase tracking-widest">
                                        Officiating: {f.referee}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                
                {sortedFixtures.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-text-secondary border-2 border-dashed border-accent rounded-xl">
                        <p className="text-xl font-bold">No Matches</p>
                        <p>Scheduled for this day</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-auto pt-6 text-center z-10">
                <div className="inline-block bg-highlight text-primary font-bold px-8 py-3 rounded-full text-xl shadow-lg mb-2">
                    dvoctz.app
                </div>
                <p className="text-xs text-text-secondary uppercase tracking-widest mt-2">Dar Es Salaam Volleyball Oversee Committee</p>
            </div>
        </div>
    );
});
