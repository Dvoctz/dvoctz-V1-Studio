import React from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Club, Team } from '../types';

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

export const ClubDetailView: React.FC<ClubDetailViewProps> = ({ club, onSelectTeam, onBack }) => {
  const { getTeamsByClub } = useSports();
  const clubTeams = getTeamsByClub(club.id);

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

      <div>
        <h2 className="text-2xl font-bold mb-4">Teams</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubTeams.length > 0 ? (
            clubTeams.map(team => <TeamRow key={team.id} team={team} onSelect={() => onSelectTeam(team)} />)
          ) : (
            <p className="text-center text-text-secondary md:col-span-2">No teams registered for this club yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
