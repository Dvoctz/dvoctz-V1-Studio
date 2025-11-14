import React, { useState, useEffect, useMemo } from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Team, Tournament, Player } from '../types';

interface RosterBuilderProps {
    team: Team;
    tournament: Tournament;
    onDone: () => void;
}

const PlayerCard: React.FC<{ player: Player, onAdd: () => void, onRemove?: () => void, isAdded?: boolean, isEligible: boolean, reason: string | null }> = ({ player, onAdd, onRemove, isAdded = false, isEligible, reason }) => (
    <div className={`p-3 rounded-md flex items-center justify-between transition-all duration-200 ${isEligible ? 'bg-primary' : 'bg-gray-800/50 opacity-60'}`}>
        <div>
            <p className={`font-semibold ${isEligible ? 'text-text-primary' : 'text-text-secondary'}`}>{player.name}</p>
            <p className="text-xs text-highlight">{player.role}</p>
            {!isEligible && reason && <p className="text-xs text-yellow-400 mt-1">{reason}</p>}
        </div>
        {onRemove ? (
             <button onClick={onRemove} className="text-red-500 hover:text-red-400 p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg></button>
        ) : (
             <button onClick={onAdd} disabled={!isEligible || isAdded} className="text-green-500 hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg></button>
        )}
    </div>
);


export const RosterBuilder: React.FC<RosterBuilderProps> = ({ team, tournament, onDone }) => {
    const { players, teams, getTeamById, getClubById, getPlayerD1History, getTournamentRoster, saveTournamentRoster } = useSports();
    const [roster, setRoster] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchRoster = async () => {
            setIsLoading(true);
            const existingRoster = await getTournamentRoster(tournament.id, team.id);
            if (existingRoster) {
                const rosterPlayers = existingRoster.player_ids.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
                setRoster(rosterPlayers);
            }
            setIsLoading(false);
        };
        fetchRoster();
    }, [tournament.id, team.id, getTournamentRoster, players]);
    
    const availablePlayerPool = useMemo(() => {
        // 1. Players from the current team
        let pool = players.filter(p => p.teamId === team.id);

        // 2. If team is in a club, add players from other teams in the same club & division
        if (team.clubId) {
            const clubTeams = teams.filter(t => t.clubId === team.clubId && t.id !== team.id && t.division === tournament.division);
            clubTeams.forEach(clubTeam => {
                const teamPlayers = players.filter(p => p.teamId === clubTeam.id);
                pool = [...pool, ...teamPlayers];
            });
        }
        
        // 3. Deduplicate and sort
        return Array.from(new Set(pool.map(p => p.id)))
            .map(id => pool.find(p => p.id === id)!)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [team, tournament.division, players, teams]);

    const d1PlayersOnRosterCount = useMemo(() => {
        return roster.filter(p => getPlayerD1History(p.id)).length;
    }, [roster, getPlayerD1History]);

    const checkEligibility = (player: Player) => {
        if (tournament.division === 'Division 1') {
            return { eligible: true, reason: null };
        }
        // Division 2 Rules
        const hasD1History = getPlayerD1History(player.id);
        if (hasD1History && d1PlayersOnRosterCount >= 3) {
            return { eligible: false, reason: "Max D1 players reached." };
        }
        return { eligible: true, reason: null };
    };

    const addToRoster = (player: Player) => {
        if (roster.length < 12 && !roster.find(p => p.id === player.id)) {
            setRoster(prev => [...prev, player]);
        }
    };
    
    const removeFromRoster = (player: Player) => {
        setRoster(prev => prev.filter(p => p.id !== player.id));
    };

    const handleSaveRoster = async () => {
        setIsSaving(true);
        setError(null);
        try {
            await saveTournamentRoster(tournament.id, team.id, roster.map(p => p.id));
            alert("Roster saved successfully!");
            onDone();
        } catch (err: any) {
            setError(err.message);
            alert(`Failed to save roster: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="text-center">Loading roster...</div>

    return (
        <div>
            <button onClick={onDone} className="flex items-center space-x-2 text-text-secondary hover:text-highlight mb-6 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                <span>Back</span>
            </button>
            <div className="text-center mb-8">
                 <h1 className="text-3xl font-extrabold">Roster Builder</h1>
                 <p className="text-text-secondary">For <span className="text-white font-semibold">{team.name}</span> in <span className="text-highlight font-semibold">{tournament.name}</span></p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
                {/* Available Players */}
                <div className="bg-secondary p-4 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Available Player Pool ({availablePlayerPool.length})</h2>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                        {availablePlayerPool.map(player => {
                            const { eligible, reason } = checkEligibility(player);
                            const isAdded = roster.some(p => p.id === player.id);
                            return <PlayerCard key={player.id} player={player} onAdd={() => addToRoster(player)} isAdded={isAdded} isEligible={eligible && !isAdded} reason={reason} />
                        })}
                    </div>
                </div>

                {/* Current Roster */}
                <div className="bg-secondary p-4 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Tournament Roster ({roster.length} / 12)</h2>
                    {tournament.division === 'Division 2' && (
                        <p className={`text-sm mb-4 p-2 rounded-md ${d1PlayersOnRosterCount > 3 ? 'bg-red-900/50 text-red-300' : 'bg-accent text-text-secondary'}`}>
                            Players with D1 experience: {d1PlayersOnRosterCount} / 3
                        </p>
                    )}
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                        {roster.length > 0 ? roster.map(player => (
                           <PlayerCard key={player.id} player={player} onAdd={() => {}} onRemove={() => removeFromRoster(player)} isEligible={true} reason={null} />
                        )) : <p className="text-center text-text-secondary py-8">Select players from the pool to build your roster.</p>}
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                 {error && <p className="text-red-500 mb-4">{error}</p>}
                <Button onClick={handleSaveRoster} disabled={isSaving || roster.length === 0} className="w-full max-w-xs text-lg py-3">
                    {isSaving ? 'Saving...' : 'Save Roster'}
                </Button>
            </div>
        </div>
    );
};

// Reusable Button to avoid import from AdminView
const Button: React.FC<{ onClick?: () => void; children: React.ReactNode; className?: string; disabled?: boolean; type?: 'button' | 'submit' }> = ({ onClick, children, className = 'bg-highlight hover:bg-teal-400', disabled = false, type = "button" }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-md font-medium text-white transition-colors duration-300 ${className} disabled:bg-gray-500 disabled:cursor-not-allowed`}
    >
        {children}
    </button>
);
