import React, { useMemo, useState } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
import { useAuth } from '../context/AuthContext';
import type { Club, Team, Player } from '../types';
import { AssignPlayerModal } from '../components/AssignPlayerModal';

interface ClubDetailViewProps {
  club: Club;
  onSelectTeam: (team: Team) => void;
  onSelectPlayer: (player: Player) => void;
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

const PlayerCard: React.FC<{ player: Player; isManaging: boolean; isSelected: boolean; onSelect: (player: Player) => void; onToggleSelection: (id: number) => void; }> = ({ player, isManaging, isSelected, onSelect, onToggleSelection }) => {
    const { getTeamById } = useSports();
    const team = getTeamById(player.teamId);

    const handleClick = () => {
        if (isManaging) {
            onToggleSelection(player.id);
        } else {
            onSelect(player);
        }
    };

    return (
        <div 
            onClick={handleClick} 
            className={`relative flex items-center p-4 bg-secondary rounded-lg transition-all duration-200 cursor-pointer ${isSelected ? 'ring-2 ring-highlight bg-accent' : 'hover:bg-accent'}`}
        >
            {isManaging && (
                <div className="absolute top-2 right-2">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(player.id)}
                        className="h-5 w-5 rounded border-gray-300 text-highlight bg-primary focus:ring-highlight focus:ring-offset-secondary"
                        aria-label={`Select ${player.name}`}
                    />
                </div>
            )}
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
                {team ? (
                    <p className="text-xs text-text-secondary mt-1 truncate">Team: {team.name}</p>
                ) : (
                    <p className="text-xs text-yellow-400 mt-1 truncate">Club Pool (Unassigned)</p>
                )}
            </div>
        </div>
    );
};


export const ClubDetailView: React.FC<ClubDetailViewProps> = ({ club, onSelectTeam, onSelectPlayer, onBack }) => {
  const { userProfile } = useAuth();
  const { getTeamsByClub, getPlayersByClub } = useSports();
  
  const { loading: playersLoading } = useEntityData('players');
  const { loading: teamsLoading } = useEntityData('teams');

  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
  const [searchTerm, setSearchTerm] = useState('');

  // Roster Management State
  const [isManaging, setIsManaging] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const isAdmin = userProfile?.role === 'admin';

  const clubTeams = useMemo(() => getTeamsByClub(club.id), [getTeamsByClub, club.id]);
  const clubPlayers = useMemo(() => getPlayersByClub(club.id), [getPlayersByClub, club.id]);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return clubPlayers;
    return clubPlayers.filter(player => player.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [clubPlayers, searchTerm]);

  // Sort players: Assigned to team first, then pool players
  const sortedPlayers = useMemo(() => {
      return [...filteredPlayers].sort((a, b) => {
          if (a.teamId && !b.teamId) return -1;
          if (!a.teamId && b.teamId) return 1;
          return 0;
      });
  }, [filteredPlayers]);

  const handleTogglePlayerSelection = (playerId: number) => {
      const newSelection = new Set(selectedPlayerIds);
      if (newSelection.has(playerId)) {
          newSelection.delete(playerId);
      } else {
          newSelection.add(playerId);
      }
      setSelectedPlayerIds(newSelection);
  };
  
  const handleSelectAll = () => {
      if (selectedPlayerIds.size === filteredPlayers.length) {
          setSelectedPlayerIds(new Set());
      } else {
          setSelectedPlayerIds(new Set(filteredPlayers.map(p => p.id)));
      }
  };

  const handleAssignmentSuccess = () => {
      setIsModalOpen(false);
      setSelectedPlayerIds(new Set());
      setIsManaging(false);
  }

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
          teamsLoading ? (
             <div className="flex justify-center py-8">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-highlight"></div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clubTeams.length > 0 ? (
                clubTeams.map(team => <TeamRow key={team.id} team={team} onSelect={() => onSelectTeam(team)} />)
                ) : (
                <p className="text-center text-text-secondary md:col-span-2">No teams registered for this club yet.</p>
                )}
            </div>
          )
        )}
        
        {activeTab === 'players' && (
            <div className="pb-24">
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

                {isAdmin && (
                    <div className="flex justify-end items-center mb-4">
                        <button
                            onClick={() => {
                                setIsManaging(!isManaging);
                                setSelectedPlayerIds(new Set()); // Clear selection on toggle
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors duration-300 ${isManaging ? 'bg-red-600 hover:bg-red-500' : 'bg-highlight hover:bg-teal-400'}`}
                        >
                           {isManaging ? 'Cancel Management' : 'Manage Roster'}
                        </button>
                    </div>
                )}
                
                {isManaging && filteredPlayers.length > 0 && (
                     <div className="flex items-center mb-4 p-2 bg-accent rounded-md">
                        <input
                            type="checkbox"
                            checked={selectedPlayerIds.size === filteredPlayers.length && filteredPlayers.length > 0}
                            onChange={handleSelectAll}
                            className="h-5 w-5 rounded border-gray-300 text-highlight bg-primary focus:ring-highlight"
                            id="select-all-players"
                        />
                        <label htmlFor="select-all-players" className="ml-3 text-sm text-text-primary">
                            Select All / Deselect All
                        </label>
                    </div>
                )}

                {playersLoading || teamsLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-highlight"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Grouped Display */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedPlayers.length > 0 ? (
                                sortedPlayers.map(player => (
                                    <PlayerCard 
                                        key={player.id} 
                                        player={player} 
                                        isManaging={isManaging}
                                        isSelected={selectedPlayerIds.has(player.id)}
                                        onSelect={onSelectPlayer}
                                        onToggleSelection={handleTogglePlayerSelection}
                                    />
                                ))
                            ) : (
                                 <p className="text-center text-text-secondary md:col-span-2 lg:col-span-3">No players found for this club.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
      
      {isManaging && selectedPlayerIds.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-secondary shadow-lg p-4 border-t border-accent z-40">
              <div className="container mx-auto flex justify-between items-center">
                  <p className="text-text-primary font-bold">{selectedPlayerIds.size} player{selectedPlayerIds.size > 1 ? 's' : ''} selected</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors duration-300 bg-highlight hover:bg-teal-400"
                  >
                    Assign to Team...
                  </button>
              </div>
          </div>
      )}

      {isModalOpen && (
          <AssignPlayerModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAssignmentSuccess={handleAssignmentSuccess}
            clubId={club.id}
            selectedPlayerIds={Array.from(selectedPlayerIds)}
          />
      )}
    </div>
  );
};