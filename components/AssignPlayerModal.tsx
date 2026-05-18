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
    <div className="fixed inset-0 bg-primary/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={handleClose}>
      <div className="bg-secondary/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg transform transition-all relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-glow pointer-events-none"></div>
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#D4AF37]/5 to-transparent pointer-events-none"></div>

        <div className="p-6 md:p-8 flex flex-col gap-6 relative z-10">
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
              <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Assign Players
              </h3>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50 group" disabled={isLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center font-bold text-sm tracking-widest uppercase text-slate-400">
                Managing <span className="text-white px-2 py-0.5 rounded-md bg-white/10 mx-1">{selectedPlayerIds.length}</span> {selectedPlayerIds.length === 1 ? 'Player' : 'Players'}
            </div>

            {error && (
                <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center">
                    {error}
                </div>
            )}
            
            {step === 'division' && (
                <div className="flex flex-col gap-4">
                    <h4 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase mt-4 mb-2 flex items-center justify-center gap-2">
                        <span className="w-8 h-px bg-slate-600"></span>
                        Select Division
                        <span className="w-8 h-px bg-slate-600"></span>
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleDivisionSelect('Division 1')} className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#D4AF37]/20 rounded-2xl text-white transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#D4AF37] mb-2 opacity-80 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="font-black text-lg tracking-widest uppercase">Div 1</span>
                        </button>
                        <button onClick={() => handleDivisionSelect('Division 2')} className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-400/5 to-transparent border border-slate-500/30 hover:border-slate-300/50 hover:bg-slate-400/10 rounded-2xl text-slate-300 transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 mb-2 opacity-80 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="font-black text-lg tracking-widest uppercase">Div 2</span>
                        </button>
                    </div>
                </div>
            )}
            
            {step === 'team' && (
                <div className="flex flex-col gap-4">
                    <button onClick={() => setStep('division')} className="self-start text-[10px] font-bold tracking-widest text-[#D4AF37] hover:text-white uppercase flex items-center gap-1 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                    <h4 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase mt-2 mb-1 flex items-center justify-center gap-2">
                        <span className="w-8 h-px bg-slate-600"></span>
                        Select Team
                        <span className="w-8 h-px bg-slate-600"></span>
                    </h4>
                    
                    <div className="relative">
                        <select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="w-full bg-primary/80 p-4 pl-5 pr-12 rounded-2xl text-white font-bold border border-white/10 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none appearance-none transition-all"
                            aria-label="Select a team"
                        >
                            <option value="" disabled className="text-slate-500 font-medium">Select a team from {selectedDivision}...</option>
                            <option value="unassign" className="text-amber-500 font-bold">Unassign (Make Free Agent)</option>
                            {clubTeamsInDivision.map(team => (
                                <option key={team.id} value={team.id} className="font-medium">{team.name}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-slate-500">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                             </svg>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-4 pt-6 border-t border-white/5 mt-4">
                <button onClick={handleClose} disabled={isLoading} className="px-6 py-3 rounded-full text-xs uppercase tracking-widest font-bold text-slate-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50">
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit} 
                    disabled={step !== 'team' || !selectedTeamId || isLoading}
                    className="px-8 py-3 rounded-full text-xs uppercase tracking-[0.2em] font-black text-primary bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] hover:from-[#F3E5AB] hover:to-[#D4AF37] transition-all disabled:opacity-50 disabled:grayscale shadow-glow flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </>
                    ) : 'Confirm Assignment'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};