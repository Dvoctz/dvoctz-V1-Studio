
import React, { useState, useMemo } from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Fixture, Team, Player } from '../types';

interface LiveScorerViewProps {
    onExit: () => void;
}

// --- Live Score Modal ---
interface LiveScoreModalProps {
    fixture: Fixture;
    onClose: () => void;
    onUpdate: (fixture: Fixture) => void;
}

const LiveScoreModal: React.FC<LiveScoreModalProps> = ({ fixture, onClose, onUpdate }) => {
    const { getTeamById, players } = useSports();
    const team1 = getTeamById(fixture.team1Id);
    const team2 = getTeamById(fixture.team2Id);

    // Initialize state from fixture
    const [status, setStatus] = useState<Fixture['status']>(fixture.status);
    const [sets, setSets] = useState<{ team1Points: number; team2Points: number }[]>(
        fixture.score?.sets?.length ? fixture.score.sets : [{ team1Points: 0, team2Points: 0 }]
    );
    const [manOfTheMatchId, setManOfTheMatchId] = useState<number | null>(fixture.manOfTheMatchId || null);
    const [saving, setSaving] = useState(false);

    // Eligible players for MOTM (Team 1 + Team 2)
    const eligiblePlayers = useMemo(() => {
        return players.filter(p => p.teamId === fixture.team1Id || p.teamId === fixture.team2Id).sort((a,b) => a.name.localeCompare(b.name));
    }, [players, fixture.team1Id, fixture.team2Id]);

    const handleSetChange = (index: number, field: 'team1Points' | 'team2Points', value: string) => {
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [field]: parseInt(value) || 0 };
        setSets(newSets);
    };

    const addSet = () => setSets([...sets, { team1Points: 0, team2Points: 0 }]);
    const removeSet = (index: number) => setSets(sets.filter((_, i) => i !== index));

    const calculateResult = () => {
        let t1Wins = 0;
        let t2Wins = 0;
        sets.forEach(s => {
            if (s.team1Points > s.team2Points) t1Wins++;
            if (s.team2Points > s.team1Points) t2Wins++;
        });
        return { 
            team1Score: t1Wins, 
            team2Score: t2Wins, 
            resultMessage: `${team1?.shortName || 'T1'} ${t1Wins} - ${t2Wins} ${team2?.shortName || 'T2'}` 
        };
    };

    const handleSave = async () => {
        setSaving(true);
        const { team1Score, team2Score, resultMessage } = calculateResult();
        
        const updatedFixture: Fixture = {
            ...fixture,
            status,
            manOfTheMatchId,
            score: {
                team1Score,
                team2Score,
                sets,
                resultMessage
            }
        };

        try {
            await onUpdate(updatedFixture);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to update match.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-secondary w-full max-w-lg rounded-xl shadow-2xl border border-accent flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-accent flex justify-between items-center bg-secondary sticky top-0 z-10 rounded-t-xl">
                    <h3 className="font-bold text-white text-lg">Update Match Score</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-white">✕</button>
                </div>
                
                <div className="p-4 space-y-6 overflow-y-auto flex-1">
                    {/* Teams Header */}
                    <div className="flex justify-between items-center bg-primary p-4 rounded-lg">
                        <div className="text-center w-1/3">
                            <h4 className="font-bold text-white text-lg">{team1?.shortName}</h4>
                        </div>
                        <div className="text-center w-1/3 font-mono text-sm text-text-secondary">VS</div>
                        <div className="text-center w-1/3">
                            <h4 className="font-bold text-white text-lg">{team2?.shortName}</h4>
                        </div>
                    </div>

                    {/* Status Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Match Status</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['upcoming', 'live', 'completed'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatus(s)}
                                    className={`py-2 px-1 rounded font-bold uppercase text-xs sm:text-sm transition-colors ${
                                        status === s 
                                            ? s === 'live' ? 'bg-red-600 text-white' : 'bg-highlight text-white' 
                                            : 'bg-primary text-text-secondary hover:bg-accent'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Score Entry */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Set Scores</label>
                        <div className="space-y-2">
                            {sets.map((set, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="text-text-secondary font-mono w-8 text-sm">S{idx+1}</span>
                                    <input 
                                        type="number" 
                                        className="bg-primary text-white text-center font-bold text-xl p-2 rounded w-full border border-accent focus:border-highlight"
                                        value={set.team1Points}
                                        onChange={(e) => handleSetChange(idx, 'team1Points', e.target.value)}
                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                    />
                                    <span className="text-text-secondary">-</span>
                                    <input 
                                        type="number" 
                                        className="bg-primary text-white text-center font-bold text-xl p-2 rounded w-full border border-accent focus:border-highlight"
                                        value={set.team2Points}
                                        onChange={(e) => handleSetChange(idx, 'team2Points', e.target.value)}
                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                    />
                                    <button onClick={() => removeSet(idx)} className="p-2 text-red-500 hover:text-red-400">✕</button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addSet} className="mt-3 w-full py-2 bg-accent hover:bg-primary text-text-secondary rounded text-sm font-medium">+ Add Set</button>
                    </div>

                    {/* Results Preview */}
                    <div className="bg-primary p-3 rounded text-center">
                        <span className="text-sm text-text-secondary">Current Match Score</span>
                        <div className="text-2xl font-bold text-white mt-1">
                            {calculateResult().team1Score} - {calculateResult().team2Score}
                        </div>
                    </div>

                    {/* MOTM */}
                    {status === 'completed' && (
                        <div>
                             <label className="block text-sm font-medium text-text-secondary mb-2">Man of the Match</label>
                             <select 
                                className="w-full bg-primary text-white p-3 rounded border border-accent focus:border-highlight"
                                value={manOfTheMatchId || ''}
                                onChange={(e) => setManOfTheMatchId(Number(e.target.value) || null)}
                             >
                                 <option value="">-- Select Player --</option>
                                 {eligiblePlayers.map(p => (
                                     <option key={p.id} value={p.id}>{p.name} ({getTeamById(p.teamId)?.shortName})</option>
                                 ))}
                             </select>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-accent bg-secondary sticky bottom-0 rounded-b-xl">
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg text-lg transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Update Match'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main View ---

export const LiveScorerView: React.FC<LiveScorerViewProps> = ({ onExit }) => {
    const { fixtures, getTeamById, updateFixture, tournaments } = useSports();
    const [filter, setFilter] = useState<'live' | 'upcoming' | 'completed'>('live');
    const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);

    // Filter fixtures and sort by date
    const filteredFixtures = useMemo(() => {
        return fixtures
            .filter(f => {
                if (filter === 'live') return f.status === 'live';
                if (filter === 'upcoming') return f.status === 'upcoming';
                return f.status === 'completed';
            })
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }, [fixtures, filter]);

    const handleUpdate = async (updatedFixture: Fixture) => {
        await updateFixture(updatedFixture);
    };

    return (
        <div className="min-h-screen bg-primary pb-20">
            {/* Mobile Header */}
            <div className="bg-secondary p-4 sticky top-0 z-20 shadow-md flex justify-between items-center border-b border-accent">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">📱</span> Live Scorer
                    </h1>
                </div>
                <button 
                    onClick={onExit}
                    className="text-xs font-bold text-text-secondary hover:text-white border border-accent px-3 py-1.5 rounded uppercase tracking-wide"
                >
                    Exit Mode
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex p-2 gap-2 overflow-x-auto bg-primary sticky top-[60px] z-10 shadow-sm">
                {(['live', 'upcoming', 'completed'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold uppercase text-sm whitespace-nowrap transition-colors ${
                            filter === f 
                                ? f === 'live' ? 'bg-red-600 text-white shadow-lg' : 'bg-highlight text-white shadow-lg'
                                : 'bg-secondary text-text-secondary border border-accent'
                        }`}
                    >
                        {f} {f === 'live' && <span className="ml-1 animate-pulse">●</span>}
                    </button>
                ))}
            </div>

            {/* Fixture List */}
            <div className="p-4 space-y-4 max-w-xl mx-auto">
                {filteredFixtures.length > 0 ? (
                    filteredFixtures.map(f => {
                        const t1 = getTeamById(f.team1Id);
                        const t2 = getTeamById(f.team2Id);
                        const tourney = tournaments.find(t => t.id === f.tournamentId);
                        const isLive = f.status === 'live';
                        
                        return (
                            <div 
                                key={f.id} 
                                onClick={() => setSelectedFixture(f)}
                                className={`bg-secondary rounded-xl overflow-hidden shadow-lg cursor-pointer transform transition-transform active:scale-95 border-l-4 ${isLive ? 'border-red-500 ring-2 ring-red-500/20' : 'border-highlight'}`}
                            >
                                <div className="bg-black/20 p-2 flex justify-between items-center text-xs text-text-secondary">
                                    <span className="uppercase font-bold tracking-wide">{tourney?.name || 'Tournament'}</span>
                                    <span>{new Date(f.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                
                                <div className="p-5 flex items-center justify-between">
                                    {/* Team 1 */}
                                    <div className="flex-1 text-center">
                                        {t1?.logoUrl && <img src={t1.logoUrl} className="w-10 h-10 rounded-full mx-auto mb-2 object-cover" alt="" />}
                                        <h3 className="font-bold text-white leading-tight">{t1?.shortName || 'T1'}</h3>
                                    </div>

                                    {/* Score/VS */}
                                    <div className="px-4 flex flex-col items-center">
                                        {f.status === 'upcoming' ? (
                                            <span className="text-2xl font-black text-text-secondary opacity-50">VS</span>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <span className={`text-3xl font-black ${isLive ? 'text-white' : 'text-text-primary'}`}>
                                                    {f.score?.team1Score || 0}
                                                </span>
                                                <span className="text-text-secondary">-</span>
                                                <span className={`text-3xl font-black ${isLive ? 'text-white' : 'text-text-primary'}`}>
                                                    {f.score?.team2Score || 0}
                                                </span>
                                            </div>
                                        )}
                                        {isLive && <span className="mt-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse uppercase">LIVE</span>}
                                    </div>

                                    {/* Team 2 */}
                                    <div className="flex-1 text-center">
                                        {t2?.logoUrl && <img src={t2.logoUrl} className="w-10 h-10 rounded-full mx-auto mb-2 object-cover" alt="" />}
                                        <h3 className="font-bold text-white leading-tight">{t2?.shortName || 'T2'}</h3>
                                    </div>
                                </div>
                                
                                <div className="bg-highlight/10 p-3 text-center border-t border-white/5">
                                    <span className="text-highlight font-bold text-sm uppercase tracking-wide">
                                        {f.status === 'upcoming' ? 'Tap to Start' : 'Tap to Update Score'}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 text-text-secondary">
                        <div className="text-4xl mb-2">😴</div>
                        <p>No {filter} matches found.</p>
                    </div>
                )}
            </div>

            {selectedFixture && (
                <LiveScoreModal 
                    fixture={selectedFixture} 
                    onClose={() => setSelectedFixture(null)} 
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
};
