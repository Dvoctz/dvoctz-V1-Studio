import React, { useMemo, useState } from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Club, Team, Player } from '../types';

interface ClubDetailViewProps {
  club: Club;
  onSelectTeam: (team: Team) => void;
  onBack: () => void;
}

const TeamRow: React.FC<{ team: Team; onSelect: () => void }> = ({ team, onSelect }) => (
    <div onClick={onSelect} className="flex items-center p-4 bg-secondary rounded-lg hover:bg-accent transition-colors duration-200 cursor-pointer">
        {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="w-12 h-12 rounded-full object-cover mr-4" />
        ) : (
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mr-4 text-text-secondary">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197" /></svg>
            </div>
        )}
        <div>
            <p className="font-bold text-white text-lg">{team.name}</p>
            <p className="text-sm text-highlight">{team.division}</p>
        </div>
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    </div>
);

const PlayerCard: React.FC<{ player: Player }> = ({ player }) => {
    const { getTeamById } = useSports();
    const team = getTeamById(player.teamId);

    return (
        <div className="flex items-center p-4 bg-secondary rounded-lg hover:bg-accent transition-colors duration-200">
            {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-16 h-16 rounded-full object-cover mr-4" />
            ) : (
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mr-4 text-text-secondary flex-shrink-0">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
            )}
            <div className="overflow-hidden">
                <p className="font-bold text-white text-lg truncate">{player.name}</p>
                <p className="text-sm text-highlight truncate">{player.role}</p>
                {team && <p className="text-xs text-text-secondary mt-1 truncate">Team: {team.name}</p>}
            </div>
        </div>
    );
};

export const ClubDetailView: React.FC<ClubDetailViewProps> = ({ club, onSelectTeam, onBack }) => {
  const { getTeamsByClub, getPlayersByClub } = useSports();
  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
  const [searchTerm, setSearchTerm] = useState('');

  const clubTeams = useMemo(() => getTeamsByClub(club.id), [getTeamsByClub, club.id]);
  const clubPlayers = useMemo(() => getPlayersByClub(club.id), [getPlayersByClub, club.id]);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return clubPlayers;
    return clubPlayers.filter(player => player.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [clubPlayers, searchTerm]);

  const TabButton: React.FC<{ tab: 'teams' | 'players'; children: React.ReactNode }> = ({ tab, children }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-6 py-3 text-lg font-semibold transition-colors duration-300 focus:outline-none ${activeTab === tab ? 'text-highlight border-b-2 border-highlight' : 'text-text-secondary hover:text-white'}`}
    >
      {children}
    </button>
  );


  return (
    <div>
      <button onClick={onBack} className="flex items-center space-x-2 text-text-secondary hover:text-highlight mb-6 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Clubs</span>
      </button>

      <div className="flex flex-col items-center text-center mb-8">
        {club.logoUrl ? (
            <img src={club.logoUrl} alt={`${club.name} logo`} className="w-32 h-32 rounded-full mb-4 border-4 border-accent object-cover" />
        ) : (
             <div className="w-32 h-32 rounded-full mb-4 border-4 border-accent bg-accent flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
             </div>
        )}
        <h1 className="text-4xl font-extrabold">{club.name}</h1>
      </div>
      
      <div className="flex border-b border-accent mb-6 justify-center">
        <TabButton tab="teams">Teams</TabButton>
        <TabButton tab="players">Players</TabButton>
      </div>

      <div>
        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clubTeams.length > 0 ? (
              clubTeams.map(team => <TeamRow key={team.id} team={team} onSelect={() => onSelectTeam(team)} />)
            ) : (
              <p className="text-center text-text-secondary md:col-span-2">No teams registered for this club yet.</p>
            )}
          </div>
        )}
        
        {activeTab === 'players' && (
            <div>
                 <div className="mb-6 max-w-lg mx-auto">
                    <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search players by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-secondary p-3 pl-10 rounded-lg border border-accent focus:ring-highlight focus:border-highlight transition-colors"
                        aria-label="Search players"
                    />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPlayers.length > 0 ? (
                        filteredPlayers.map(player => <PlayerCard key={player.id} player={player} />)
                    ) : (
                         <p className="text-center text-text-secondary md:col-span-2 lg:col-span-3">No players found for this club.</p>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
