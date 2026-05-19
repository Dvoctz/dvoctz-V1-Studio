
import React, { useMemo, useState } from 'react';
import { useSports } from '../context/SportsDataContext';
import { useAuth } from '../context/AuthContext';
import type { Club, Team, Player } from '../types';
import { AssignPlayerModal } from '../components/AssignPlayerModal';
import { Button, Input, Select, Label, ImageUploadOrUrl, FormModal, ErrorMessage } from './AdminView';

interface ClubDetailViewProps {
  club: Club;
  onSelectTeam: (team: Team) => void;
  onSelectPlayer: (player: Player) => void;
  onBack: () => void;
}

const TeamRow: React.FC<{ team: Team; onSelect: () => void }> = ({ team, onSelect }) => (
    <div onClick={onSelect} className="flex items-center p-4 bg-secondary/40 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl hover:bg-white/5 hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-white/5 hover:border-[#D4AF37]/30 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="w-14 h-14 rounded-full object-cover mr-4 z-10 border-2 border-white/10 group-hover:border-[#D4AF37]/50 transition-colors grayscale-[20%] group-hover:grayscale-0" />
        ) : (
            <div className="w-14 h-14 rounded-full bg-primary/80 flex items-center justify-center mr-4 text-slate-500 z-10 border border-white/10">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197" /></svg>
            </div>
        )}
        <div className="z-10">
            <p className="font-black text-white text-lg uppercase tracking-wider group-hover:text-[#D4AF37] transition-colors">{team.name}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 bg-primary/50 px-2 py-0.5 rounded inline-block">{team.division}</p>
        </div>
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 group-hover:text-[#D4AF37] transition-colors ml-auto z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className={`relative flex items-center p-4 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden border ${isSelected ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.15)] shadow-inner' : 'border-white/5 bg-secondary/40 backdrop-blur-md hover:border-[#D4AF37]/30 hover:bg-white/5'} group`}
        >
            {!isSelected && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>}
            
            {isManaging && (
                <div className="absolute top-3 right-3 z-20">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(player.id)}
                        className="h-5 w-5 rounded border-white/20 text-[#D4AF37] bg-primary/80 focus:ring-[#D4AF37] focus:ring-offset-secondary cursor-pointer"
                        aria-label={`Select ${player.name}`}
                    />
                </div>
            )}
            {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className={`w-16 h-16 rounded-full object-cover mr-4 z-10 border-2 transition-all ${isSelected ? 'border-[#D4AF37]' : 'border-white/10 group-hover:border-[#D4AF37]/50 grayscale-[20%] group-hover:grayscale-0'}`} />
            ) : (
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mr-4 flex-shrink-0 z-10 border transition-colors ${isSelected ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' : 'bg-primary/80 border-white/10 text-slate-500'}`}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
            )}
            <div className="overflow-hidden z-10">
                <p className={`font-black text-lg truncate uppercase tracking-wider transition-colors ${isSelected ? 'text-[#D4AF37]' : 'text-white group-hover:text-[#D4AF37]'}`}>{player.name}</p>
                <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mt-0.5">{player.role}</p>
                {team ? (
                    <p className="text-[9px] uppercase tracking-widest text-[#D4AF37] mt-2 truncate bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-2 py-0.5 rounded inline-block">Team: {team.name}</p>
                ) : (
                    <p className="text-[9px] uppercase tracking-widest text-slate-400 mt-2 truncate bg-white/5 border border-white/10 px-2 py-0.5 rounded inline-block">Club Pool</p>
                )}
            </div>
        </div>
    );
};

const QuickAddPlayerModal: React.FC<{ clubId: number; teams: Team[]; onClose: () => void }> = ({ clubId, teams, onClose }) => {
    const { addPlayer } = useSports();
    const [formData, setFormData] = useState({
        name: '',
        role: 'Main Netty',
        teamId: '' as string | number, // Use string for select, convert to number for save
        photoUrl: ''
    });
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
             await addPlayer({
                name: formData.name,
                role: formData.role as any,
                teamId: formData.teamId ? Number(formData.teamId) : null,
                clubId: clubId,
                photoUrl: formData.photoUrl,
                photoFile: file || undefined,
                stats: { matches: 0, aces: 0, kills: 0, blocks: 0 }
             });
             onClose();
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    };

    return (
        <FormModal title="Quick Add Player" onClose={onClose}>
             <form onSubmit={handleSave} className="space-y-4">
                {error && <ErrorMessage message={error} />}
                <div><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div>
                    <Label>Role</Label>
                    <Select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                        {['Main Netty', 'Left Front', 'Right Front', 'Net Center', 'Back Center', 'Left Back', 'Right Back', 'Right Netty', 'Left Netty', 'Service Man'].map(r => <option key={r} value={r}>{r}</option>)}
                    </Select>
                </div>
                <div>
                    <Label>Team</Label>
                    <Select value={formData.teamId} onChange={e => setFormData({...formData, teamId: e.target.value})}>
                        <option value="">Club Pool (Unassigned)</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                </div>
                 <ImageUploadOrUrl 
                    label="Photo" 
                    urlValue={formData.photoUrl || ''} 
                    onUrlChange={(val) => setFormData({...formData, photoUrl: val})}
                    onFileChange={setFile}
                />
                <div className="flex justify-end gap-2">
                    <Button onClick={onClose} className="bg-gray-600">Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Player'}</Button>
                </div>
             </form>
        </FormModal>
    );
}


export const ClubDetailView: React.FC<ClubDetailViewProps> = ({ club, onSelectTeam, onSelectPlayer, onBack }) => {
  const { userProfile } = useAuth();
  const { getTeamsByClub, getPlayersByClub, loading } = useSports();
  
  const playersLoading = loading.has('players');
  const teamsLoading = loading.has('teams');

  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
  const [searchTerm, setSearchTerm] = useState('');

  // Roster Management State
  const [isManaging, setIsManaging] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Quick Add State
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  
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
      className={`px-6 py-4 text-sm uppercase tracking-widest font-black transition-all duration-300 focus:outline-none flex-1 md:flex-none whitespace-nowrap ${activeTab === tab ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-[#D4AF37]/5' : 'text-slate-400 border-b-2 border-transparent hover:text-white hover:bg-white/5'}`}
    >
      {children}
    </button>
  );


  return (
    <div className="animate-fade-in-up">
      <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 hover:text-[#D4AF37] mb-8 transition-colors text-sm font-bold uppercase tracking-wider group">
        <div className="w-8 h-8 rounded-full bg-secondary border border-white/10 flex items-center justify-center group-hover:bg-[#D4AF37]/10 group-hover:border-[#D4AF37]/30 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
        <span>Clubs</span>
      </button>

      <div className="flex flex-col items-center text-center mb-12">
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#D4AF37] blur-2xl opacity-20 rounded-full animate-pulse-slow"></div>
            {club.logoUrl ? (
                <img src={club.logoUrl} alt={`${club.name} logo`} className="w-32 h-32 md:w-36 md:h-36 rounded-full border border-white/20 object-cover shadow-2xl relative z-10 bg-secondary" />
            ) : (
                 <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border border-white/20 bg-secondary flex items-center justify-center shadow-2xl relative z-10 text-[#D4AF37]/40">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                 </div>
            )}
        </div>
        <h1 className="text-4xl md:text-5xl font-black drop-shadow-md uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary tracking-tight">{club.name}</h1>
      </div>
      
      <div className="flex border-b border-white/10 mb-8 max-w-2xl mx-auto">
        <TabButton tab="teams">Teams</TabButton>
        <TabButton tab="players">Players</TabButton>
      </div>

      <div className="max-w-6xl mx-auto">
        {activeTab === 'teams' && (
          teamsLoading ? (
             <div className="flex justify-center py-16">
                 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {clubTeams.length > 0 ? (
                clubTeams.map(team => <TeamRow key={team.id} team={team} onSelect={() => onSelectTeam(team)} />)
                ) : (
                <div className="text-center py-20 bg-primary/40 rounded-3xl border border-dashed border-white/10 md:col-span-2">
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No teams registered for this club yet.</p>
                </div>
                )}
            </div>
          )
        )}
        
        {activeTab === 'players' && (
            <div className="pb-24">
                 <div className="mb-8 max-w-2xl mx-auto">
                    <div className="relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 group-focus-within:text-[#D4AF37] transition-colors" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search players by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-secondary/60 backdrop-blur-md p-4 pl-14 rounded-full border border-white/5 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all outline-none font-bold text-white shadow-inner"
                        aria-label="Search players"
                    />
                    </div>
                </div>

                {isAdmin && (
                    <div className="flex flex-col sm:flex-row justify-center items-center mb-8 gap-4">
                        <button
                            onClick={() => setIsAddPlayerModalOpen(true)}
                            className="w-full sm:w-auto px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 transition-all flex items-center justify-center gap-2"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                           Add Player
                        </button>
                        <button
                            onClick={() => {
                                setIsManaging(!isManaging);
                                setSelectedPlayerIds(new Set()); // Clear selection on toggle
                            }}
                            className={`w-full sm:w-auto px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isManaging ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' : 'bg-[#D4AF37] text-black hover:bg-[#F9F295] shadow-lg shadow-[#D4AF37]/20'}`}
                        >
                           {isManaging ? 'Cancel Management' : 'Manage Roster'}
                        </button>
                    </div>
                )}
                
                {isManaging && filteredPlayers.length > 0 && (
                     <div className="flex items-center justify-center mb-8 p-3 bg-secondary/40 backdrop-blur-sm border border-white/10 rounded-full max-w-sm mx-auto">
                        <input
                            type="checkbox"
                            checked={selectedPlayerIds.size === filteredPlayers.length && filteredPlayers.length > 0}
                            onChange={handleSelectAll}
                            className="h-5 w-5 rounded border-white/20 text-[#D4AF37] bg-primary/80 focus:ring-[#D4AF37] cursor-pointer"
                            id="select-all-players"
                        />
                        <label htmlFor="select-all-players" className="ml-3 text-[10px] font-bold uppercase tracking-widest text-slate-300 cursor-pointer">
                            Select All / Deselect All
                        </label>
                    </div>
                )}

                {playersLoading || teamsLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      
      {isAddPlayerModalOpen && (
          <QuickAddPlayerModal 
            clubId={club.id} 
            teams={clubTeams} 
            onClose={() => setIsAddPlayerModalOpen(false)} 
          />
      )}
    </div>
  );
};
