import React, { useState } from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Club } from '../types';

interface ClubsViewProps {
  onSelectClub: (club: Club) => void;
}

const ClubCard: React.FC<{ club: Club, onSelect: () => void }> = ({ club, onSelect }) => (
  <div 
    onClick={onSelect}
    className="bg-secondary p-4 rounded-lg shadow-md text-center transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
  >
    {club.logoUrl ? (
      <img src={club.logoUrl} alt={`${club.name} logo`} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-accent object-cover" />
    ) : (
      <div className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-accent bg-accent flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
    )}
    <h3 className="text-lg font-bold text-white">{club.name}</h3>
  </div>
);

export const ClubsView: React.FC<ClubsViewProps> = ({ onSelectClub }) => {
  const { clubs } = useSports();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClubs = clubs.filter(club => {
      return club.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <h1 className="text-4xl font-extrabold text-center mb-8">Clubs</h1>
      <div className="mb-8 max-w-lg mx-auto">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search clubs by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary p-3 pl-10 rounded-lg border border-accent focus:ring-highlight focus:border-highlight transition-colors"
            aria-label="Search clubs"
          />
        </div>
      </div>
      
      {filteredClubs.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredClubs.map(club => (
            <ClubCard key={club.id} club={club} onSelect={() => onSelectClub(club)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-text-secondary text-lg">No clubs found matching your search.</p>
        </div>
      )}
    </div>
  );
};