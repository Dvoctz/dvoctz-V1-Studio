import React, { useState, useMemo } from 'react';
import { useSports } from '../context/SportsDataContext';

interface AssignPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentSuccess: () => void;
  clubId: number;
  selectedPlayerIds: number[];
}

export const AssignPlayerModal: React.FC<AssignPlayerModalProps> = ({ isOpen, onClose, onAssignmentSuccess, clubId, selectedPlayerIds }) => {
  const { teams, bulkUpdatePlayerTeam } = useSports();
  
  const [step, setStep] = useState<'division' | 'team'>('division');
  const [selectedDivision, setSelectedDivision] = useState<'Division 1' | 'Division 2' | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clubTeamsInDivision = useMemo(() => {
    if (!selectedDivision) return [];
    return teams.filter(team => team.clubId === clubId && team.division === selectedDivision);
  }, [teams, clubId, selectedDivision]);

  const handleDivisionSelect = (division: 'Division 1' | 'Division 2') => {
    setSelectedDivision(division);
    setStep('team');
  };

  const handleSubmit = async () => {
    if (!selectedTeamId) {
        setError("Please select a team or the unassign option.");
        return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const targetTeamId = selectedTeamId === 'unassign' ? null : parseInt(selectedTeamId, 10);
      await bulkUpdatePlayerTeam(selectedPlayerIds, targetTeamId);
      onAssignmentSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-accent flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">Assign Players</h3>
          <button onClick={handleClose} className="text-text-secondary hover:text-white transition-colors" disabled={isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md text-sm">
                    <strong>Error:</strong> {error}
                </div>
            )}
            
            {step === 'division' && (
                <div>
                    <h4 className="text-lg font-semibold text-text-secondary mb-4 text-center">Step 1: Select a Division</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleDivisionSelect('Division 1')} className="p-6 bg-accent rounded-lg text-white font-bold text-xl hover:bg-highlight transition-colors">Division 1</button>
                        <button onClick={() => handleDivisionSelect('Division 2')} className="p-6 bg-accent rounded-lg text-white font-bold text-xl hover:bg-highlight transition-colors">Division 2</button>
                    </div>
                </div>
            )}
            
            {step === 'team' && (
                <div>
                    <button onClick={() => setStep('division')} className="text-sm text-text-secondary hover:text-white mb-4">&larr; Back to division select</button>
                    <h4 className="text-lg font-semibold text-text-secondary mb-2">Step 2: Assign to Team</h4>
                    <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="w-full bg-primary mt-1 p-3 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight"
                        aria-label="Select a team"
                    >
                        <option value="" disabled>Choose an option...</option>
                        <option value="unassign" className="text-yellow-400 font-bold">Remove from Team (Unassign)</option>
                        {clubTeamsInDivision.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="flex justify-end space-x-4 pt-4 border-t border-accent">
                <button onClick={handleClose} disabled={isLoading} className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors bg-gray-600 hover:bg-gray-500 disabled:opacity-50">
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit} 
                    disabled={step !== 'team' || !selectedTeamId || isLoading}
                    className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors bg-highlight hover:bg-teal-400 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Assigning...' : `Confirm Assignment (${selectedPlayerIds.length})`}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
