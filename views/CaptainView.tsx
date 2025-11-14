import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSports } from '../context/SportsDataContext';
import type { Team, Tournament, Player } from '../types';
import { RosterBuilder } from '../components/RosterBuilder';

export const CaptainView: React.FC = () => {
    const { userProfile } = useAuth();
    const { teams, getCaptainTeams, tournaments, loading } = useSports();
    const [managedTeams, setManagedTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

    useEffect(() => {
        if (userProfile) {
            const captainTeams = getCaptainTeams(userProfile.id);
            setManagedTeams(captainTeams);
            // Default select the first team
            if (captainTeams.length > 0) {
                setSelectedTeam(captainTeams[0]);
            }
        }
    }, [userProfile, teams, getCaptainTeams]);

    const handleSelectTeam = (team: Team) => {
        setSelectedTeam(team);
        setSelectedTournament(null);
    };

    const handleBackToDashboard = () => {
        setSelectedTeam(null);
        setSelectedTournament(null);
        if (managedTeams.length > 0) {
            setSelectedTeam(managedTeams[0]);
        }
    };

    if (loading) {
        return <div className="text-center text-text-secondary">Loading your data...</div>;
    }

    if (!selectedTeam) {
        return (
            <div>
                 <h1 className="text-4xl font-extrabold text-center mb-8">Captain's Dashboard</h1>
                 <p className="text-center text-text-secondary">Welcome, {userProfile?.fullName || 'Captain'}.</p>
                 <p className="text-center text-text-secondary mt-4">You have not been assigned to any teams yet. An admin needs to assign you to a team before you can manage rosters.</p>
            </div>
        );
    }
    
    if (selectedTeam && selectedTournament) {
        return (
            <RosterBuilder 
                team={selectedTeam} 
                tournament={selectedTournament} 
                onDone={() => setSelectedTournament(null)}
            />
        )
    }

    const eligibleTournaments = tournaments.filter(t => t.division === selectedTeam.division);

    return (
        <div>
            <h1 className="text-4xl font-extrabold text-center mb-2">Captain's Dashboard</h1>
            <p className="text-center text-text-secondary mb-8">Welcome, {userProfile?.fullName || 'Captain'}.</p>

            <div className="bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Manage Rosters</h2>

                {managedTeams.length > 1 && (
                     <div className="mb-6">
                        <label htmlFor="team-select" className="block text-sm font-medium text-text-secondary mb-1">Select a team to manage:</label>
                        <select
                            id="team-select"
                            value={selectedTeam.id}
                            onChange={(e) => handleSelectTeam(teams.find(t => t.id === parseInt(e.target.value))!)}
                            className="w-full bg-primary mt-1 p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight"
                        >
                            {managedTeams.map(team => (
                                <option key={team.id} value={team.id}>{team.name} ({team.division})</option>
                            ))}
                        </select>
                    </div>
                )}
               
                <div>
                    <h3 className="text-xl font-semibold text-white mb-3">
                        Select a tournament for <span className="text-highlight">{selectedTeam.name}</span>:
                    </h3>
                    {eligibleTournaments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {eligibleTournaments.map(tournament => (
                                <button
                                    key={tournament.id}
                                    onClick={() => setSelectedTournament(tournament)}
                                    className="text-left p-4 bg-accent rounded-lg hover:bg-highlight transition-colors duration-200"
                                >
                                    <p className="font-bold">{tournament.name}</p>
                                    <p className="text-sm text-text-secondary">{tournament.division}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-secondary">There are no upcoming tournaments for {selectedTeam.division}.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
