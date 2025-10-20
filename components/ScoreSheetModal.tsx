import React from 'react';
import type { Fixture, Team } from '../types';

interface ScoreSheetModalProps {
  fixture: Fixture;
  team1: Team;
  team2: Team;
  onClose: () => void;
}

export const ScoreSheetModal: React.FC<ScoreSheetModalProps> = ({ fixture, team1, team2, onClose }) => {
  if (!fixture.score) return null;

  const score = fixture.score;

  const renderTeamHeader = (team: Team, teamScore: number) => (
    <div className="flex items-center justify-between bg-accent p-4 rounded-lg">
        <div className="flex items-center">
            <img src={team.logoUrl} alt={team.name} className="w-10 h-10 rounded-full mr-4" />
            <h4 className="text-xl font-bold text-text-primary">{team.name}</h4>
        </div>
        <div>
            <span className="text-2xl font-extrabold text-white">{teamScore}</span>
            <span className="text-sm text-text-secondary ml-2">Final Score</span>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-accent flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">Match Scorecard</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
            {renderTeamHeader(team1, score.team1Score)}
            {renderTeamHeader(team2, score.team2Score)}
        </div>
         <div className="px-6 pb-6 space-y-2">
            <h4 className="text-lg font-semibold text-center text-text-secondary">Set Breakdown</h4>
            {score.sets.map((set, index) => (
            <div key={index} className="flex justify-between items-center bg-accent p-3 rounded-md">
                <span className="text-sm font-bold text-text-secondary">Set {index + 1}</span>
                <div className="flex items-center space-x-4 text-lg">
                <span className={`font-bold ${set.team1Points > set.team2Points ? 'text-white' : 'text-text-secondary'}`}>{set.team1Points}</span>
                <span className="text-text-secondary">-</span>
                <span className={`font-bold ${set.team2Points > set.team1Points ? 'text-white' : 'text-text-secondary'}`}>{set.team2Points}</span>
                </div>
            </div>
            ))}
        </div>
        <div className="p-6 bg-primary rounded-b-xl text-center border-t border-accent">
            <p className="text-lg font-semibold text-highlight">{score.resultMessage}</p>
            <p className="text-sm text-text-secondary mt-1">{new Date(fixture.dateTime).toLocaleDateString()} at {fixture.ground}</p>
            {fixture.referee && (
                <p className="text-sm text-text-secondary mt-1">Referee: {fixture.referee}</p>
            )}
        </div>
      </div>
    </div>
  );
};