
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { useSports, CsvTeam, CsvPlayer } from '../context/SportsDataContext';
import { useAuth } from '../context/AuthContext';
import type { Tournament, Team, Player, Fixture, Sponsor, Score, PlayerRole, UserRole, Club, PlayerTransfer, Notice, NoticeLevel } from '../types';

// Reusable UI Components
export const AdminSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-secondary p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
        {children}
    </div>
);

export const Button: React.FC<{ onClick?: (e?: React.MouseEvent) => void; children: React.ReactNode; className?: string; disabled?: boolean; type?: 'button' | 'submit' }> = ({ onClick, children, className = 'bg-highlight hover:bg-teal-400', disabled = false, type = "button" }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors duration-300 ${className || ''} disabled:bg-gray-500 disabled:cursor-not-allowed`}
    >
        {children}
    </button>
);

export const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`w-full bg-primary mt-1 p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight ${className || ''}`} />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props} className="w-full bg-primary mt-1 p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight disabled:bg-gray-800 disabled:cursor-not-allowed" />
);

export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className={`w-full bg-primary mt-1 p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight ${props.className || ''}`} />
);

export const Label: React.FC<{ children: React.ReactNode; htmlFor?: string; className?: string; }> = ({ children, htmlFor, className }) => (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-text-secondary ${className || ''}`.trim()}>{children}</label>
);

export const FormModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-lg transform transition-all max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-accent flex justify-between items-center sticky top-0 bg-secondary z-10">
                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md mb-4 text-sm">
        <strong>Error:</strong> {message}
    </div>
);

export const ImageUploadOrUrl: React.FC<{ 
    label: string; 
    urlValue: string; 
    onUrlChange: (val: string) => void; 
    onFileChange: (file: File | null) => void;
}> = ({ label, urlValue, onUrlChange, onFileChange }) => {
    const [mode, setMode] = useState<'file' | 'url'>('file');

    return (
        <div>
            <Label>{label}</Label>
            <div className="flex gap-4 mb-2 text-sm">
                <button 
                    type="button"
                    onClick={() => setMode('file')}
                    className={`${mode === 'file' ? 'text-highlight font-bold border-b-2 border-highlight' : 'text-text-secondary hover:text-white'}`}
                >
                    Upload File
                </button>
                <button 
                    type="button"
                    onClick={() => { setMode('url'); onFileChange(null); }} 
                    className={`${mode === 'url' ? 'text-highlight font-bold border-b-2 border-highlight' : 'text-text-secondary hover:text-white'}`}
                >
                    Image URL
                </button>
            </div>
            
            {mode === 'file' ? (
                <div>
                    <Input type="file" accept="image/*" onChange={e => onFileChange(e.target.files?.[0] || null)} />
                    {urlValue && (
                        <div className="mt-2 flex items-center gap-2">
                             <span className="text-xs text-text-secondary">Current:</span>
                             <a href={urlValue} target="_blank" rel="noreferrer" className="text-xs text-highlight truncate max-w-[200px] block">{urlValue}</a>
                        </div>
                    )}
                    <p className="text-[10px] text-text-secondary mt-1">Upload will override current URL.</p>
                </div>
            ) : (
                <div>
                     <Input 
                        type="url" 
                        placeholder="https://example.com/image.png" 
                        value={urlValue} 
                        onChange={e => onUrlChange(e.target.value)} 
                    />
                    <p className="text-[10px] text-text-secondary mt-1">Enter a direct link to an image.</p>
                </div>
            )}
        </div>
    );
};

// --- TOURNAMENTS ---
const TournamentsAdmin = () => {
    const { tournaments, addTournament, updateTournament, deleteTournament, concludeLeaguePhase, fixtures } = useSports();
    const [editing, setEditing] = useState<Tournament | Partial<Tournament> | null>(null);
    const [managingSponsorsFor, setManagingSponsorsFor] = useState<Tournament | null>(null);
    const [managingSquadsFor, setManagingSquadsFor] = useState<Tournament | null>(null);
    const [managingTeamsFor, setManagingTeamsFor] = useState<Tournament | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isConcluding, setIsConcluding] = useState<number | null>(null);

    const handleSave = async (tournament: Tournament | Partial<Tournament>) => {
        setError(null);
        try {
            if ('id' in tournament && tournament.id) {
                await updateTournament(tournament as Tournament);
            } else {
                await addTournament(tournament as Omit<Tournament, 'id'>);
            }
            setEditing(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this tournament?')) {
            try { await deleteTournament(id); } catch (err: any) { alert(err.message); }
        }
    };

    const handleConclude = async (id: number) => {
        if (window.confirm('Conclude league phase? This generates knockout fixtures.')) {
            setIsConcluding(id);
            try { await concludeLeaguePhase(id); } catch(e: any) { alert(e.message); } finally { setIsConcluding(null); }
        }
    };

    const filtered = useMemo(() => tournaments.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())), [tournaments, searchTerm]);

    return (
        <AdminSection title="Manage Tournaments">
             <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <Input placeholder="Search tournaments..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!w-64 !mt-0" />
                <Button onClick={() => setEditing({})}>Add Tournament</Button>
            </div>
            <div className="space-y-2">
                {filtered.map(t => (
                    <div key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-accent rounded-md gap-2">
                        <div><p className="font-bold text-white">{t.name}</p><p className="text-sm text-highlight">{t.division} - {t.phase}</p></div>
                        <div className="flex flex-wrap gap-2">
                            {t.phase === 'round-robin' && <Button onClick={() => handleConclude(t.id)} disabled={isConcluding === t.id} className="bg-green-600 hover:bg-green-500 text-xs">Conclude League</Button>}
                            <Button onClick={() => setManagingTeamsFor(t)} className="bg-teal-600 hover:bg-teal-500 text-xs">Teams</Button>
                            <Button onClick={() => setManagingSquadsFor(t)} className="bg-indigo-600 hover:bg-indigo-500 text-xs">Squads</Button>
                            <Button onClick={() => setManagingSponsorsFor(t)} className="bg-purple-600 hover:bg-purple-500 text-xs">Sponsors</Button>
                            <Button onClick={() => setEditing(t)} className="bg-blue-600 hover:bg-blue-500 text-xs">Edit</Button>
                            <Button onClick={() => handleDelete(t.id)} className="bg-red-600 hover:bg-red-500 text-xs">Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
            {editing && <FormModal title={editing.id ? "Edit" : "Add"} onClose={() => setEditing(null)}><TournamentForm tournament={editing} onSave={handleSave} onCancel={() => setEditing(null)} error={error} /></FormModal>}
            {managingSponsorsFor && <TournamentSponsorsModal tournament={managingSponsorsFor} onClose={() => setManagingSponsorsFor(null)} />}
            {managingSquadsFor && <TournamentSquadsModal tournament={managingSquadsFor} onClose={() => setManagingSquadsFor(null)} />}
            {managingTeamsFor && <TournamentTeamsModal tournament={managingTeamsFor} onClose={() => setManagingTeamsFor(null)} />}
        </AdminSection>
    );
};

const TournamentForm: React.FC<{ tournament: any, onSave: any, onCancel: any, error: any }> = ({ tournament, onSave, onCancel, error }) => {
    const [formData, setFormData] = useState({ name: '', division: 'Division 1', ...tournament });
    return (
        <form onSubmit={e => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
            <div><Label>Division</Label><Select value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})}><option>Division 1</option><option>Division 2</option></Select></div>
            <div className="flex justify-end gap-2"><Button onClick={onCancel} className="bg-gray-600">Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

const TournamentSponsorsModal: React.FC<{ tournament: Tournament, onClose: () => void }> = ({ tournament, onClose }) => {
    const { sponsors, getSponsorsForTournament, updateSponsorsForTournament } = useSports();
    const [selected, setSelected] = useState(new Set<number>());
    const [initialized, setInitialized] = useState(false);
    const [saving, setSaving] = useState(false);
    
    useEffect(() => {
        if (initialized) return;
        const currentSponsors = getSponsorsForTournament(tournament.id);
        setSelected(new Set(currentSponsors.map(s => s.id)));
        setInitialized(true);
    }, [tournament.id, getSponsorsForTournament, initialized]);

    const toggle = (id: number) => { 
        setSelected(prev => {
            const s = new Set(prev); 
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        }); 
    };
    
    const save = async () => { 
        setSaving(true);
        try {
            await updateSponsorsForTournament(tournament.id, Array.from(selected)); 
            onClose(); 
        } catch(e: any) {
            alert('Error saving sponsors: ' + e.message);
        } finally {
            setSaving(false);
        }
    };
    
    return (
        <FormModal title="Sponsors" onClose={onClose}>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {sponsors.map(s => (
                    <div 
                        key={s.id} 
                        className="flex items-center gap-2 p-2 bg-primary rounded cursor-pointer hover:bg-accent" 
                        onClick={() => toggle(s.id)}
                    >
                        <input 
                            type="checkbox" 
                            checked={selected.has(s.id)} 
                            readOnly 
                            className="pointer-events-none rounded border-gray-300 text-highlight focus:ring-highlight h-4 w-4" 
                        />
                        <span>{s.name}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-2"><Button onClick={onClose} className="bg-gray-600">Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></div>
        </FormModal>
    );
};

const TournamentTeamsModal: React.FC<{ tournament: Tournament, onClose: () => void }> = ({ tournament, onClose }) => {
    const { teams, tournamentTeams, updateTournamentTeams } = useSports();
    const [selectedTeamIds, setSelectedTeamIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Filter teams by Division
    const availableTeams = useMemo(() => {
        return teams.filter(t => t.division === tournament.division).sort((a, b) => a.name.localeCompare(b.name));
    }, [teams, tournament.division]);

    // Load existing selection ONLY ONCE to prevent reset during editing
    useEffect(() => {
        if (initialized) return;

        // If tournamentTeams is available (loaded from context), initialize the form
        if (tournamentTeams) {
            const currentParticipants = tournamentTeams
                .filter(tt => tt.tournamentId === tournament.id)
                .map(tt => tt.teamId);
            setSelectedTeamIds(new Set(currentParticipants));
            setInitialized(true);
        }
    }, [tournament.id, tournamentTeams, initialized]);

    const handleToggle = (teamId: number) => {
        setSelectedTeamIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(teamId)) newSet.delete(teamId);
            else newSet.add(teamId);
            return newSet;
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateTournamentTeams(tournament.id, Array.from(selectedTeamIds));
            onClose();
        } catch (e: any) {
            alert('Error saving participating teams: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormModal title={`Participating Teams: ${tournament.name}`} onClose={onClose}>
            <p className="text-sm text-highlight mb-4">Showing only {tournament.division} teams.</p>
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4 bg-primary p-2 rounded">
                {availableTeams.length > 0 ? availableTeams.map(t => (
                    <div 
                        key={t.id} 
                        className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer select-none" 
                        onClick={() => handleToggle(t.id)}
                    >
                         <input 
                            type="checkbox" 
                            checked={selectedTeamIds.has(t.id)} 
                            readOnly
                            className="pointer-events-none rounded border-gray-300 text-highlight focus:ring-highlight h-4 w-4"
                        />
                        <span className={selectedTeamIds.has(t.id) ? "text-white font-medium" : "text-text-secondary"}>{t.name}</span>
                    </div>
                )) : (
                    <p className="text-text-secondary text-center py-4">No teams found in {tournament.division}.</p>
                )}
            </div>
            <div className="flex justify-end gap-2">
                <Button onClick={onClose} className="bg-gray-600">Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Selection'}</Button>
            </div>
        </FormModal>
    );
};


const TournamentSquadsModal: React.FC<{ tournament: Tournament, onClose: () => void }> = ({ tournament, onClose }) => {
    const { teams, getPlayersByClub, updateTournamentSquad, getTournamentSquad } = useSports();
    const [selectedTeamId, setSelectedTeamId] = useState<number | ''>('');
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Track initialization per team to avoid resets
    const [lastLoadedTeamId, setLastLoadedTeamId] = useState<number | null>(null);

    const selectedTeam = useMemo(() => teams.find(t => t.id === Number(selectedTeamId)), [selectedTeamId, teams]);
    
    const availablePlayers = useMemo(() => {
        if (!selectedTeam) return [];
        return getPlayersByClub(selectedTeam.clubId); 
    }, [selectedTeam, getPlayersByClub]);

    const filteredPlayers = useMemo(() => {
        if (!searchTerm) return availablePlayers;
        return availablePlayers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [availablePlayers, searchTerm]);

    // Load existing roster when team changes, but ONLY when the selected team ID specifically changes
    useEffect(() => {
        if (selectedTeamId && selectedTeamId !== lastLoadedTeamId) {
            const roster = getTournamentSquad(tournament.id, Number(selectedTeamId));
            setSelectedPlayerIds(new Set(roster.map(p => p.id)));
            setLastLoadedTeamId(Number(selectedTeamId));
        } else if (!selectedTeamId) {
            setSelectedPlayerIds(new Set());
            setLastLoadedTeamId(null);
        }
    }, [selectedTeamId, lastLoadedTeamId, tournament.id, getTournamentSquad]);

    const handleToggle = (playerId: number) => {
        setSelectedPlayerIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(playerId)) newSet.delete(playerId);
            else newSet.add(playerId);
            return newSet;
        });
    };

    const handleSave = async () => {
        if (!selectedTeamId) return;
        setLoading(true);
        try {
            await updateTournamentSquad(tournament.id, Number(selectedTeamId), Array.from(selectedPlayerIds));
            alert('Squad updated successfully!');
        } catch (e: any) {
            alert('Error updating squad: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormModal title={`Manage Squad: ${tournament.name}`} onClose={onClose}>
            <div className="mb-4">
                <Label>Select Team</Label>
                <Select value={selectedTeamId} onChange={e => setSelectedTeamId(Number(e.target.value) || '')}>
                    <option value="">-- Choose a Team --</option>
                    {teams
                        .filter(t => t.division === tournament.division)
                        .sort((a,b) => a.name.localeCompare(b.name))
                        .map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </Select>
                 <p className="text-xs text-highlight mt-1">Showing only {tournament.division} teams.</p>
            </div>

            {selectedTeam && (
                <div className="space-y-4">
                    <div>
                        <Input 
                            placeholder="Search players..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-white">Available Players ({availablePlayers.length})</h4>
                        <span className="text-sm text-highlight">{selectedPlayerIds.size} selected</span>
                    </div>
                    <div className="bg-primary p-2 rounded max-h-60 overflow-y-auto space-y-1">
                        {filteredPlayers.length > 0 ? filteredPlayers.map(p => (
                            <div 
                                key={p.id} 
                                className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer select-none" 
                                onClick={() => handleToggle(p.id)}
                            >
                                <input 
                                    type="checkbox" 
                                    checked={selectedPlayerIds.has(p.id)} 
                                    readOnly
                                    className="pointer-events-none rounded border-gray-300 text-highlight focus:ring-highlight h-4 w-4"
                                />
                                <span className={selectedPlayerIds.has(p.id) ? "text-white font-medium" : "text-text-secondary"}>{p.name} <span className="text-xs opacity-70">({p.role})</span></span>
                            </div>
                        )) : (
                            <p className="text-text-secondary text-sm p-2">No players found matching "{searchTerm}".</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-accent">
                        <Button onClick={onClose} className="bg-gray-600">Close</Button>
                        <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Squad'}</Button>
                    </div>
                </div>
            )}
            
            {!selectedTeam && (
                <p className="text-text-secondary text-center py-4">Please select a team to manage its roster for this tournament.</p>
            )}
        </FormModal>
    );
};

// --- CLUBS ---
const ClubsAdmin = () => {
    const { clubs, addClub, updateClub, deleteClub } = useSports();
    const [editing, setEditing] = useState<Club | Partial<Club> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (club: any) => {
        setError(null);
        try { club.id ? await updateClub(club) : await addClub(club); setEditing(null); } catch(e: any) { setError(e.message); }
    };
    const handleDelete = async (id: number) => { if(window.confirm('Delete club?')) try { await deleteClub(id); } catch(e: any) { alert(e.message); } };
    const filtered = useMemo(() => clubs.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())), [clubs, searchTerm]);

    const handleExport = () => {
        const csv = Papa.unparse(clubs.map(c => ({
            Name: c.name,
            LogoUrl: c.logoUrl || ''
        })));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'clubs_export.csv';
        link.click();
    };

    return (
        <AdminSection title="Manage Clubs">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <Input placeholder="Search clubs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!w-64 !mt-0" />
                <div className="flex gap-2">
                    <Button onClick={handleExport} className="bg-green-600 hover:bg-green-500">Export CSV</Button>
                    <Button onClick={() => setEditing({})}>Add Club</Button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(c => (
                    <div key={c.id} className="bg-accent p-3 rounded flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {c.logoUrl ? <img src={c.logoUrl} className="w-8 h-8 rounded-full object-cover" alt="" /> : <div className="w-8 h-8 bg-primary rounded-full" />}
                            <span className="font-bold">{c.name}</span>
                        </div>
                        <div className="flex gap-1">
                             <Button onClick={() => setEditing(c)} className="bg-blue-600 text-xs px-2 py-1">Edit</Button>
                             <Button onClick={() => handleDelete(c.id)} className="bg-red-600 text-xs px-2 py-1">Del</Button>
                        </div>
                    </div>
                ))}
            </div>
            {editing && <FormModal title={editing.id ? "Edit Club" : "Add Club"} onClose={() => setEditing(null)}><ClubForm club={editing} onSave={handleSave} onCancel={() => setEditing(null)} error={error} /></FormModal>}
        </AdminSection>
    );
};

const ClubForm: React.FC<{ club: any, onSave: any, onCancel: any, error: any }> = ({ club, onSave, onCancel, error }) => {
    const [formData, setFormData] = useState({ name: '', logoUrl: '', ...club });
    const [file, setFile] = useState<File | null>(null);
    return (
        <form onSubmit={e => { e.preventDefault(); onSave({ ...formData, logoFile: file }); }} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
            <ImageUploadOrUrl 
                label="Logo" 
                urlValue={formData.logoUrl || ''} 
                onUrlChange={(val) => setFormData({...formData, logoUrl: val})}
                onFileChange={setFile}
            />
            <div className="flex justify-end gap-2"><Button onClick={onCancel} className="bg-gray-600">Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

// --- TEAMS ---
const TeamsAdmin = () => {
    const { teams, clubs, addTeam, updateTeam, deleteTeam, bulkAddOrUpdateTeams } = useSports();
    const [editing, setEditing] = useState<Team | Partial<Team> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (team: any) => {
        setError(null);
        try { team.id ? await updateTeam(team) : await addTeam(team); setEditing(null); } catch(e: any) { setError(e.message); }
    };
    const handleDelete = async (id: number) => { if(window.confirm('Delete team?')) try { await deleteTeam(id); } catch(e: any) { alert(e.message); } };
    
    const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    // Fix for mapping capitalized headers from export
                    const rawData = results.data as any[];
                    const csvTeams: CsvTeam[] = rawData.map(r => ({
                        name: r.name || r.Name,
                        shortName: r.shortName || r.ShortName,
                        division: r.division || r.Division || 'Division 1',
                        clubName: r.clubName || r.ClubName,
                        logoUrl: r.logoUrl || r.LogoUrl
                    })).filter(t => t.name && t.clubName);
                    
                    if (csvTeams.length === 0) {
                         alert("No valid teams found. Check headers: Name, ClubName are required.");
                         return;
                    }

                    await bulkAddOrUpdateTeams(csvTeams);
                    alert(`Successfully processed ${csvTeams.length} teams.`);
                } catch (e: any) { alert(`Upload failed: ${e.message}`); }
            }
        });
    };

    const handleExport = () => {
        const exportData = teams.map(t => {
            const club = clubs.find(c => c.id === t.clubId);
            return {
                Name: t.name,
                ShortName: t.shortName,
                Division: t.division,
                ClubName: club ? club.name : '',
                LogoUrl: t.logoUrl || ''
            };
        });
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'teams_export.csv';
        link.click();
    };

    const filtered = useMemo(() => teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())), [teams, searchTerm]);

    return (
        <AdminSection title="Manage Teams">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <Input placeholder="Search teams..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!w-64 !mt-0" />
                <div className="flex gap-2 flex-wrap justify-end">
                    <Button onClick={handleExport} className="bg-green-600 hover:bg-green-500">Export CSV</Button>
                     <label className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer">
                        Bulk Upload CSV <input type="file" className="hidden" accept=".csv" onChange={handleBulkUpload} />
                    </label>
                    <Button onClick={() => setEditing({})}>Add Team</Button>
                </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filtered.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 bg-accent rounded">
                        <div>
                            <p className="font-bold text-white">{t.name} ({t.shortName})</p>
                            <p className="text-xs text-highlight">{t.division} - {clubs.find(c => c.id === t.clubId)?.name}</p>
                        </div>
                        <div className="flex gap-2">
                             <Button onClick={() => setEditing(t)} className="bg-blue-600 text-xs px-2 py-1">Edit</Button>
                             <Button onClick={() => handleDelete(t.id)} className="bg-red-600 text-xs px-2 py-1">Del</Button>
                        </div>
                    </div>
                ))}
            </div>
            {editing && <FormModal title={editing.id ? "Edit Team" : "Add Team"} onClose={() => setEditing(null)}><TeamForm team={editing} clubs={clubs} onSave={handleSave} onCancel={() => setEditing(null)} error={error} /></FormModal>}
        </AdminSection>
    );
};

const TeamForm: React.FC<{ team: any, clubs: Club[], onSave: any, onCancel: any, error: any }> = ({ team, clubs, onSave, onCancel, error }) => {
    const [formData, setFormData] = useState({ name: '', shortName: '', division: 'Division 1', clubId: clubs[0]?.id || 0, logoUrl: '', ...team });
    const [file, setFile] = useState<File | null>(null);
    return (
        <form onSubmit={e => { e.preventDefault(); onSave({ ...formData, logoFile: file }); }} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
            <div><Label>Short Name</Label><Input value={formData.shortName} onChange={e => setFormData({...formData, shortName: e.target.value})} required /></div>
            <div><Label>Division</Label><Select value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})}><option>Division 1</option><option>Division 2</option></Select></div>
            <div><Label>Club</Label><Select value={formData.clubId} onChange={e => setFormData({...formData, clubId: Number(e.target.value)})}>{clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <ImageUploadOrUrl 
                label="Logo" 
                urlValue={formData.logoUrl || ''} 
                onUrlChange={(val) => setFormData({...formData, logoUrl: val})}
                onFileChange={setFile}
            />
            <div className="flex justify-end gap-2"><Button onClick={onCancel} className="bg-gray-600">Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

// --- PLAYERS ---
const PlayersAdmin = () => {
    const { players, teams, clubs, addPlayer, updatePlayer, deletePlayer, bulkAddOrUpdatePlayers, deleteAllPlayers } = useSports();
    const [editing, setEditing] = useState<Player | Partial<Player> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (player: any) => {
        setError(null);
        try { player.id ? await updatePlayer(player) : await addPlayer(player); setEditing(null); } catch(e: any) { setError(e.message); }
    };
    const handleDelete = async (id: number) => { if(window.confirm('Delete player?')) try { await deletePlayer(id); } catch(e: any) { alert(e.message); } };
    
    const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    // Fix for mapping capitalized headers from export
                    const rawData = results.data as any[];
                    const csvPlayers: CsvPlayer[] = rawData.map(r => ({
                        name: r.name || r.Name,
                        role: r.role || r.Role || 'Main Netty',
                        teamName: r.teamName || r.TeamName,
                        clubName: r.clubName || r.ClubName,
                        matches: r.matches || r.Matches || '0',
                        aces: r.aces || r.Aces || '0',
                        kills: r.kills || r.Kills || '0',
                        blocks: r.blocks || r.Blocks || '0',
                        photoUrl: r.photoUrl || r.PhotoUrl
                    })).filter(p => p.name && (p.teamName || p.clubName));

                    if (csvPlayers.length === 0) {
                        alert("No valid players found in CSV. Please check headers (Name, TeamName, ClubName) and ensure at least Name and either TeamName or ClubName are present.");
                        return;
                    }

                    await bulkAddOrUpdatePlayers(csvPlayers);
                    alert(`Successfully processed ${csvPlayers.length} players.`);
                } catch (e: any) { alert(`Upload failed: ${e.message}`); }
            }
        });
    };
    const handleMassDelete = async () => {
         if(window.confirm('WARNING: This will delete ALL players and transfer history. This cannot be undone. Are you sure?')) {
             try { await deleteAllPlayers(); alert('All players deleted.'); } catch(e: any) { alert(e.message); }
         }
    }

    const handleExport = () => {
        const exportData = players.map(p => {
            const team = teams.find(t => t.id === p.teamId);
            const club = clubs.find(c => c.id === p.clubId);
            return {
                Name: p.name,
                Role: p.role,
                TeamName: team ? team.name : '',
                ClubName: club ? club.name : '',
                Matches: p.stats?.matches || 0,
                Aces: p.stats?.aces || 0,
                Kills: p.stats?.kills || 0,
                Blocks: p.stats?.blocks || 0,
                PhotoUrl: p.photoUrl || ''
            };
        });
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'players_export.csv';
        link.click();
    };
    
    const filtered = useMemo(() => players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 50), [players, searchTerm]);

    return (
        <AdminSection title="Manage Players">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <Input placeholder="Search players..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!w-full sm:!w-64 !mt-0" />
                <div className="flex gap-2 flex-wrap justify-end">
                    <Button onClick={handleExport} className="bg-green-600 hover:bg-green-500">Export CSV</Button>
                    <label className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer">
                        CSV Upload <input type="file" className="hidden" accept=".csv" onChange={handleBulkUpload} />
                    </label>
                    <Button onClick={handleMassDelete} className="bg-red-800 hover:bg-red-700">Delete All</Button>
                    <Button onClick={() => setEditing({})}>Add Player</Button>
                </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filtered.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-2 bg-accent rounded text-sm">
                        <div>
                            <p className="font-bold text-white">{p.name}</p>
                            <p className="text-xs text-text-secondary">
                                {p.role} - {teams.find(t => t.id === p.teamId)?.name || <span className="text-yellow-400">Club Pool (Unassigned)</span>}
                            </p>
                        </div>
                        <div className="flex gap-2">
                             <Button onClick={() => setEditing(p)} className="bg-blue-600 text-xs px-2 py-1">Edit</Button>
                             <Button onClick={() => handleDelete(p.id)} className="bg-red-600 text-xs px-2 py-1">Del</Button>
                        </div>
                    </div>
                ))}
                {players.length > 50 && filtered.length === 50 && <p className="text-center text-xs text-text-secondary">Showing first 50 results...</p>}
            </div>
            {editing && <FormModal title={editing.id ? "Edit Player" : "Add Player"} onClose={() => setEditing(null)}><PlayerForm player={editing} teams={teams} clubs={clubs} onSave={handleSave} onCancel={() => setEditing(null)} error={error} /></FormModal>}
        </AdminSection>
    );
};

const PlayerForm: React.FC<{ player: any, teams: Team[], clubs: Club[], onSave: any, onCancel: any, error: any }> = ({ player, teams, clubs, onSave, onCancel, error }) => {
    const [formData, setFormData] = useState({ name: '', role: 'Main Netty', teamId: null as number | null, clubId: null as number | null, stats: { matches: 0, aces: 0, kills: 0, blocks: 0 }, photoUrl: '', ...player });
    const [file, setFile] = useState<File | null>(null);

    // If editing existing player with team but no clubId set locally, infer it
    useEffect(() => {
        if (formData.teamId && !formData.clubId) {
            const team = teams.find(t => t.id === formData.teamId);
            if (team) setFormData(prev => ({ ...prev, clubId: team.clubId }));
        }
    }, [formData.teamId, teams]);
    
    const handleClubChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const newClubId = val === '' ? null : Number(val);
        setFormData(prev => ({ ...prev, clubId: newClubId, teamId: null })); // Reset team if club changes
    };

    const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setFormData({ ...formData, teamId: val === '' ? null : Number(val) });
    };

    const availableTeams = useMemo(() => {
        if (!formData.clubId) return [];
        return teams.filter(t => t.clubId === formData.clubId);
    }, [teams, formData.clubId]);

    return (
        <form onSubmit={e => { e.preventDefault(); onSave({ ...formData, photoFile: file }); }} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
            <div>
                <Label>Role</Label>
                <Select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    {['Main Netty', 'Left Front', 'Right Front', 'Net Center', 'Back Center', 'Left Back', 'Right Back', 'Right Netty', 'Left Netty', 'Service Man'].map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
            </div>
            
            {/* Step 1: Select Club */}
            <div>
                <Label>Club</Label>
                <Select value={formData.clubId ?? ''} onChange={handleClubChange}>
                    <option value="">No Club (Free Agent)</option>
                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
            </div>

            {/* Step 2: Select Team (Filtered by Club) */}
            <div>
                <Label>Team (Optional)</Label>
                <Select value={formData.teamId ?? ''} onChange={handleTeamChange} disabled={!formData.clubId}>
                    <option value="">Unassigned (Club Pool)</option>
                    {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
                {!formData.clubId && <p className="text-xs text-highlight mt-1">Player will be registered as a Free Agent (No Club).</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
                 <div><Label>Matches</Label><Input type="number" value={formData.stats.matches} onChange={e => setFormData({...formData, stats: {...formData.stats, matches: Number(e.target.value)}})} /></div>
                 <div><Label>Aces</Label><Input type="number" value={formData.stats.aces} onChange={e => setFormData({...formData, stats: {...formData.stats, aces: Number(e.target.value)}})} /></div>
                 <div><Label>Kills</Label><Input type="number" value={formData.stats.kills} onChange={e => setFormData({...formData, stats: {...formData.stats, kills: Number(e.target.value)}})} /></div>
                 <div><Label>Blocks</Label><Input type="number" value={formData.stats.blocks} onChange={e => setFormData({...formData, stats: {...formData.stats, blocks: Number(e.target.value)}})} /></div>
            </div>
            <ImageUploadOrUrl 
                label="Photo" 
                urlValue={formData.photoUrl || ''} 
                onUrlChange={(val) => setFormData({...formData, photoUrl: val})}
                onFileChange={setFile}
            />
            <div className="flex justify-end gap-2"><Button onClick={onCancel} className="bg-gray-600">Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

// --- TRANSFERS ---
const TransfersAdmin = () => {
    const { playerTransfers, players, teams, addPlayerTransfer, updatePlayerTransfer, deletePlayerTransfer } = useSports();
    const [editing, setEditing] = useState<PlayerTransfer | Partial<PlayerTransfer> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const handleSave = async (transfer: any) => {
        setError(null);
        try {
            if (transfer.id) {
                await updatePlayerTransfer(transfer);
            } else {
                await addPlayerTransfer(transfer);
            }
            setEditing(null);
        } catch(e: any) {
            setError(e.message);
        }
    };

    const handleDelete = async (id: number) => {
        if(window.confirm('Are you sure you want to delete this transfer record?')) {
            try { await deletePlayerTransfer(id); } catch(e: any) { alert(e.message); }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if(window.confirm(`Are you sure you want to delete ${selectedIds.size} transfer records? This cannot be undone.`)) {
            const idsToDelete = Array.from(selectedIds) as number[];
            for (const id of idsToDelete) {
                 try { await deletePlayerTransfer(id); } catch(e: any) { console.error(e); }
            }
            setSelectedIds(new Set());
        }
    };

    const filtered = useMemo(() => {
        let list = playerTransfers ? [...playerTransfers] : [];
        if (searchTerm) {
            list = list.filter(t => {
                const p = players.find(player => player.id === t.playerId);
                return p?.name.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }
        return list.sort((a,b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime());
    }, [playerTransfers, players, searchTerm]);

    const handleToggleSelect = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filtered.length && filtered.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(t => t.id)));
        }
    };

    return (
        <AdminSection title="Manage Transfers">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <Input placeholder="Search by player name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!w-full sm:!w-64 !mt-0" />
                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <Button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-500">
                            Delete Selected ({selectedIds.size})
                        </Button>
                    )}
                    <Button onClick={() => setEditing({})}>Record Transfer</Button>
                </div>
            </div>

             {filtered.length > 0 && (
                <div className="flex items-center gap-2 mb-2 px-3">
                    <input 
                        type="checkbox" 
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-highlight focus:ring-highlight"
                    />
                    <span className="text-sm text-text-secondary cursor-pointer" onClick={handleSelectAll}>Select All</span>
                </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filtered.map(t => {
                    const player = players.find(p => p.id === t.playerId);
                    const fromTeam = teams.find(team => team.id === t.fromTeamId);
                    const toTeam = teams.find(team => team.id === t.toTeamId);
                    const isSelected = selectedIds.has(t.id);

                    return (
                        <div key={t.id} className={`p-3 rounded text-sm flex flex-col sm:flex-row justify-between gap-2 transition-colors ${isSelected ? 'bg-highlight/20 border border-highlight' : 'bg-accent'}`}>
                            <div className="flex items-start gap-3">
                                 <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => handleToggleSelect(t.id)}
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-highlight focus:ring-highlight flex-shrink-0"
                                />
                                <div>
                                    <p className="font-bold text-white">{player?.name || 'Unknown Player'}</p>
                                    <p className="text-xs text-text-primary">
                                        {new Date(t.transferDate).toLocaleDateString()}: <span className="text-text-secondary">{fromTeam?.name || 'Free Agent'}</span> &rarr; <span className="text-highlight">{toTeam?.name || 'Free Agent'}</span>
                                    </p>
                                    {t.notes && <p className="text-xs text-text-secondary italic mt-1">"{t.notes}"</p>}
                                    {t.isAutomated && <span className="inline-block mt-1 text-[10px] uppercase bg-gray-600 text-white px-1 rounded">Automated</span>}
                                </div>
                            </div>
                            <div className="flex gap-2 self-start ml-7 sm:ml-0">
                                <Button onClick={() => setEditing(t)} className="bg-blue-600 text-xs px-2 py-1">Edit</Button>
                                <Button onClick={() => handleDelete(t.id)} className="bg-red-600 text-xs px-2 py-1">Del</Button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {editing && <FormModal title={editing.id ? "Edit Transfer" : "Record Transfer"} onClose={() => setEditing(null)}>
                <TransferForm transfer={editing} players={players} teams={teams} onSave={handleSave} onCancel={() => setEditing(null)} error={error} />
            </FormModal>}
        </AdminSection>
    );
};

const TransferForm: React.FC<{ transfer: any, players: Player[], teams: Team[], onSave: any, onCancel: any, error: any }> = ({ transfer, players, teams, onSave, onCancel, error }) => {
    const [formData, setFormData] = useState({
        playerId: players[0]?.id,
        fromTeamId: null as number | null,
        toTeamId: null as number | null,
        transferDate: new Date().toISOString().split('T')[0],
        notes: '',
        ...transfer
    });

    // When player changes, if it's a new entry, default 'fromTeam' to current team
    useEffect(() => {
        if (!transfer.id && formData.playerId) {
            const p = players.find(player => player.id === Number(formData.playerId));
            if (p) {
                setFormData(prev => ({...prev, fromTeamId: p.teamId}));
            }
        }
    }, [formData.playerId, players, transfer.id]);

    return (
        <form onSubmit={e => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div>
                <Label>Player</Label>
                {/* Disable player selection if editing existing transfer to prevent confusion */}
                <Select value={formData.playerId} onChange={e => setFormData({...formData, playerId: Number(e.target.value)})} disabled={!!transfer.id}>
                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label>From Team</Label>
                    <Select value={formData.fromTeamId ?? ''} onChange={e => setFormData({...formData, fromTeamId: e.target.value ? Number(e.target.value) : null})}>
                        <option value="">Free Agent</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                </div>
                <div>
                    <Label>To Team</Label>
                    <Select value={formData.toTeamId ?? ''} onChange={e => setFormData({...formData, toTeamId: e.target.value ? Number(e.target.value) : null})}>
                        <option value="">Free Agent</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                </div>
            </div>
            <div><Label>Date</Label><Input type="date" value={formData.transferDate} onChange={e => setFormData({...formData, transferDate: e.target.value})} required /></div>
            <div><Label>Notes</Label><Textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} /></div>
            
            <div className="flex justify-end gap-2">
                <Button onClick={onCancel} className="bg-gray-600">Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

// --- FIXTURES ---
const FixturesAdmin = () => {
    const { fixtures, tournaments, teams, addFixture, updateFixture, deleteFixture, bulkAddFixtures } = useSports();
    const [editing, setEditing] = useState<Fixture | Partial<Fixture> | null>(null);
    const [filterTournament, setFilterTournament] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (fixture: any) => {
        setError(null);
        try { fixture.id ? await updateFixture(fixture) : await addFixture(fixture); setEditing(null); } catch(e: any) { setError(e.message); }
    };
    const handleDelete = async (id: number) => { if(window.confirm('Delete fixture?')) try { await deleteFixture(id); } catch(e: any) { alert(e.message); } };
    
    const filtered = useMemo(() => {
        let list = fixtures;
        if (filterTournament) list = list.filter(f => f.tournamentId === Number(filterTournament));
        return list.sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    }, [fixtures, filterTournament]);

    const handleExport = () => {
        // Export currently filtered view
        const exportData = filtered.map(f => {
            const t = tournaments.find(tr => tr.id === f.tournamentId);
            const t1 = teams.find(tm => tm.id === f.team1Id);
            const t2 = teams.find(tm => tm.id === f.team2Id);
            
            // Split ISO string into separate Date (YYYY-MM-DD) and Time (HH:mm) for easier CSV editing
            // Convert to Local Time first for user convenience
            const localDateObj = new Date(f.dateTime);
            const localDateStr = localDateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD
            const localTimeStr = localDateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});

            return {
                Tournament: t?.name || '',
                Division: t?.division || '',
                Team1: t1?.name || '',
                Team2: t2?.name || '',
                Date: localDateStr,
                Time: localTimeStr,
                Ground: f.ground,
                Stage: f.stage || '',
                Referee: f.referee || ''
            };
        });
        
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'fixtures_export.csv';
        link.click();
    };

    const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const rawData = results.data as any[];
                    if (rawData.length === 0) throw new Error("CSV file is empty.");

                    const newFixtures: Omit<Fixture, 'id' | 'score'>[] = [];
                    const normalize = (s: string) => s ? s.trim().toLowerCase() : '';
                    
                    // Create maps for fast lookup
                    const tournamentMap = new Map(tournaments.map(t => [normalize(t.name), t.id]));
                    const teamMap = new Map(teams.map(t => [normalize(t.name), t.id]));

                    let rowCount = 0;
                    for (const r of rawData) {
                        rowCount++;
                        const tourName = r.Tournament || r.tournament;
                        const t1Name = r.Team1 || r.team1;
                        const t2Name = r.Team2 || r.team2;
                        const dateStr = r.Date || r.date;
                        const timeStr = r.Time || r.time;
                        const ground = r.Ground || r.ground || 'TBD';
                        
                        if (!tourName || !t1Name || !t2Name || !dateStr) {
                             console.warn(`Skipping row ${rowCount}: Missing required fields (Tournament, Team1, Team2, Date)`);
                             continue;
                        }
                        
                        const tournamentId = tournamentMap.get(normalize(tourName));
                        const team1Id = teamMap.get(normalize(t1Name));
                        const team2Id = teamMap.get(normalize(t2Name));
                        
                        if (!tournamentId) throw new Error(`Row ${rowCount}: Tournament "${tourName}" not found.`);
                        if (!team1Id) throw new Error(`Row ${rowCount}: Team "${t1Name}" not found.`);
                        if (!team2Id) throw new Error(`Row ${rowCount}: Team "${t2Name}" not found.`);

                        // Combine Date and Time into ISO String
                        // Assumption: Date is YYYY-MM-DD, Time is HH:mm
                        // We treat input as Local Time and convert to UTC
                        const timeComponent = timeStr ? timeStr : '00:00';
                        const combinedStr = `${dateStr}T${timeComponent}`;
                        const dateObj = new Date(combinedStr);
                        
                        if (isNaN(dateObj.getTime())) throw new Error(`Row ${rowCount}: Invalid Date/Time format. Use YYYY-MM-DD and HH:mm.`);

                        newFixtures.push({
                            tournamentId,
                            team1Id,
                            team2Id,
                            ground,
                            dateTime: dateObj.toISOString(), // Convert to UTC for DB
                            status: 'upcoming',
                            stage: r.Stage || r.stage || undefined,
                            referee: r.Referee || r.referee || undefined
                        });
                    }
                    
                    if (newFixtures.length > 0) {
                        await bulkAddFixtures(newFixtures);
                        alert(`Successfully imported ${newFixtures.length} fixtures.`);
                    } else {
                        alert("No valid fixtures found to import.");
                    }

                } catch (err: any) {
                    alert(`Import Failed: ${err.message}`);
                }
                // Reset input
                e.target.value = '';
            }
        });
    };

    return (
        <AdminSection title="Manage Fixtures">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <Select value={filterTournament} onChange={e => setFilterTournament(e.target.value)} className="!w-64 !mt-0">
                    <option value="">All Tournaments</option>
                    {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
                <div className="flex gap-2">
                    <Button onClick={handleExport} className="bg-green-600 hover:bg-green-500">Export CSV</Button>
                    <label className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer">
                        Bulk Upload CSV <input type="file" className="hidden" accept=".csv" onChange={handleBulkUpload} />
                    </label>
                    <Button onClick={() => setEditing({})}>Add Fixture</Button>
                </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filtered.map(f => {
                     const t1 = teams.find(t => t.id === f.team1Id);
                     const t2 = teams.find(t => t.id === f.team2Id);
                     return (
                        <div key={f.id} className="p-3 bg-accent rounded text-sm flex flex-col sm:flex-row justify-between gap-2">
                            <div>
                                <p className="font-bold text-white">{t1?.name} vs {t2?.name}</p>
                                <p className="text-xs text-text-secondary">{new Date(f.dateTime).toLocaleString()} - {f.ground} - <span className={f.status === 'completed' ? 'text-green-400' : f.status === 'live' ? 'text-red-400' : 'text-yellow-400'}>{f.status.toUpperCase()}</span></p>
                                {f.score && <p className="text-xs text-highlight">Score: {f.score.team1Score} - {f.score.team2Score}</p>}
                            </div>
                            <div className="flex gap-2 self-start">
                                <Button onClick={() => setEditing(f)} className="bg-blue-600 text-xs px-2 py-1">Edit</Button>
                                <Button onClick={() => handleDelete(f.id)} className="bg-red-600 text-xs px-2 py-1">Del</Button>
                            </div>
                        </div>
                     );
                })}
            </div>
            {editing && <FormModal title={editing.id ? "Edit Fixture" : "Add Fixture"} onClose={() => setEditing(null)}><FixtureForm fixture={editing} teams={teams} tournaments={tournaments} onSave={handleSave} onCancel={() => setEditing(null)} error={error} /></FormModal>}
        </AdminSection>
    );
};

const FixtureForm: React.FC<{ fixture: any, teams: Team[], tournaments: Tournament[], onSave: any, onCancel: any, error: any }> = ({ fixture, teams, tournaments, onSave, onCancel, error }) => {
    const { players } = useSports();
    
    // Helper: Convert UTC ISO string to Local Date Time String (YYYY-MM-DDTHH:mm) for input[type="datetime-local"]
    const toLocalInputString = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        return localDate.toISOString().slice(0, 16);
    };

    // Helper: Get current local time string for default value
    const getNowLocalString = () => {
        const now = new Date();
        const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        return localDate.toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState({
        tournamentId: tournaments[0]?.id, team1Id: teams[0]?.id, team2Id: teams[1]?.id,
        ground: 'Main Court', 
        status: 'upcoming', referee: '', score: { team1Score: 0, team2Score: 0, sets: [], resultMessage: '' },
        manOfTheMatchId: null as number | null,
        ...fixture,
        dateTime: fixture?.dateTime ? toLocalInputString(fixture.dateTime) : getNowLocalString()
    });

    // New State for Referee Dropdown Logic
    const [refereeSelection, setRefereeSelection] = useState<string>(() => {
        const currentRef = fixture?.referee;
        if (!currentRef) return '';
        const isKnownTeam = teams.some(t => t.name === currentRef);
        return isKnownTeam ? currentRef : '__manual__';
    });

    const selectedTournament = useMemo(() => tournaments.find(t => t.id === Number(formData.tournamentId)), [tournaments, formData.tournamentId]);

    const availableTeams = useMemo(() => {
        if (!selectedTournament) return teams;
        return teams.filter(t => t.division === selectedTournament.division).sort((a, b) => a.name.localeCompare(b.name));
    }, [teams, selectedTournament]);
    
    // Eligible Players for MOTM: Filter players from Team 1 or Team 2
    const eligiblePlayers = useMemo(() => {
        if (!formData.team1Id || !formData.team2Id) return [];
        return players
            .filter(p => p.teamId === formData.team1Id || p.teamId === formData.team2Id)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [players, formData.team1Id, formData.team2Id]);

    const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newId = Number(e.target.value);
        const newTourney = tournaments.find(t => t.id === newId);
        let update: any = { tournamentId: newId };
        
        if (newTourney) {
            const relevantTeams = teams.filter(t => t.division === newTourney.division).sort((a, b) => a.name.localeCompare(b.name));
            const t1Exists = relevantTeams.find(t => t.id === formData.team1Id);
            const t2Exists = relevantTeams.find(t => t.id === formData.team2Id);
            
            if (!t1Exists && relevantTeams.length > 0) {
                update.team1Id = relevantTeams[0].id;
            }
             if (!t2Exists && relevantTeams.length > 1) {
                update.team2Id = relevantTeams[1].id;
            } else if (!t2Exists && relevantTeams.length > 0) {
                update.team2Id = relevantTeams[0].id;
            }
        }
        setFormData({ ...formData, ...update });
    };
    
    const handleRefereeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setRefereeSelection(val);
        if (val === '__manual__') {
             // Keep existing if switching to manual, or blank if empty
             setFormData(prev => ({ ...prev, referee: prev.referee || '' })); 
        } else if (val === '') {
             setFormData(prev => ({ ...prev, referee: '' }));
        } else {
            setFormData(prev => ({ ...prev, referee: val }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const localDate = new Date(formData.dateTime);
        const utcDate = localDate.toISOString();
        onSave({ ...formData, dateTime: utcDate });
    };

    const updateSet = (index: number, field: 'team1Points' | 'team2Points', value: string) => {
        const newSets: { team1Points: number; team2Points: number }[] = [...(formData.score?.sets || [])];
        if (!newSets[index]) newSets[index] = { team1Points: 0, team2Points: 0 };
        const currentSet = newSets[index];
        newSets[index] = { ...currentSet, [field]: Number(value) };
        setFormData({ ...formData, score: { ...formData.score, sets: newSets } });
    };
    const addSet = () => setFormData({ ...formData, score: { ...formData.score, sets: [...(formData.score?.sets || []), { team1Points: 0, team2Points: 0 }] } });
    const removeSet = (index: number) => {
        const newSets = [...(formData.score?.sets || [])];
        newSets.splice(index, 1);
        setFormData({ ...formData, score: { ...formData.score, sets: newSets } });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div>
                <Label>Tournament</Label>
                <Select value={formData.tournamentId} onChange={handleTournamentChange}>
                    {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.division})</option>)}
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label>Team 1</Label>
                    <Select value={formData.team1Id} onChange={e => setFormData({...formData, team1Id: Number(e.target.value)})}>
                        {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                </div>
                <div>
                    <Label>Team 2</Label>
                    <Select value={formData.team2Id} onChange={e => setFormData({...formData, team2Id: Number(e.target.value)})}>
                         {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                </div>
            </div>
            {availableTeams.length === 0 && <p className="text-xs text-red-400">No teams found for this division. Please add teams to {selectedTournament?.division} first.</p>}

            <div className="grid grid-cols-2 gap-2">
                <div><Label>Date & Time</Label><Input type="datetime-local" value={formData.dateTime} onChange={e => setFormData({...formData, dateTime: e.target.value})} /></div>
                <div><Label>Ground</Label><Input value={formData.ground} onChange={e => setFormData({...formData, ground: e.target.value})} /></div>
            </div>
            <div><Label>Status</Label><Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option></Select></div>
            
            {/* UPDATED REFEREE SECTION */}
            <div>
                <Label>Referee / Officiating Team</Label>
                <Select value={refereeSelection} onChange={handleRefereeChange}>
                    <option value="">-- Select Officiating Team --</option>
                    {teams.sort((a, b) => a.name.localeCompare(b.name)).map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                    <option value="__manual__">Other / Manual Entry</option>
                </Select>
                {refereeSelection === '__manual__' && (
                    <Input 
                        placeholder="Enter Referee Name" 
                        value={formData.referee || ''} 
                        onChange={e => setFormData({...formData, referee: e.target.value})}
                        className="mt-2" 
                    />
                )}
            </div>

            {formData.status === 'completed' && (
                <div className="border-t border-accent pt-4">
                    <h4 className="font-bold text-white mb-2">Score Details</h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                         <div><Label>Team 1 Sets Won</Label><Input type="number" value={formData.score.team1Score} onChange={e => setFormData({...formData, score: {...formData.score, team1Score: Number(e.target.value)}})} /></div>
                         <div><Label>Team 2 Sets Won</Label><Input type="number" value={formData.score.team2Score} onChange={e => setFormData({...formData, score: {...formData.score, team2Score: Number(e.target.value)}})} /></div>
                    </div>
                    <div><Label>Result Message</Label><Input value={formData.score.resultMessage} onChange={e => setFormData({...formData, score: {...formData.score, resultMessage: e.target.value}})} placeholder="e.g. Team A won 2-1" /></div>
                    
                    <div className="mt-2">
                        <Label>Set Scores</Label>
                        {formData.score.sets?.map((set: any, i: number) => (
                            <div key={i} className="flex gap-2 items-center mt-1">
                                <span className="text-xs text-text-secondary w-8">S{i+1}</span>
                                <Input type="number" placeholder="T1" value={set.team1Points} onChange={e => updateSet(i, 'team1Points', e.target.value)} className="!mt-0" />
                                <Input type="number" placeholder="T2" value={set.team2Points} onChange={e => updateSet(i, 'team2Points', e.target.value)} className="!mt-0" />
                                <button type="button" onClick={() => removeSet(i)} className="text-red-500 font-bold px-2">x</button>
                            </div>
                        ))}
                        <Button onClick={addSet} className="bg-accent text-xs mt-2">Add Set</Button>
                    </div>

                    <div className="mt-4 border-t border-accent pt-4">
                        <Label>Man of the Match</Label>
                        <Select 
                            value={formData.manOfTheMatchId ?? ''} 
                            onChange={e => setFormData({...formData, manOfTheMatchId: e.target.value ? Number(e.target.value) : null})}
                        >
                            <option value="">-- Select Player --</option>
                            {eligiblePlayers.map(p => {
                                const teamName = teams.find(t => t.id === p.teamId)?.shortName || '';
                                return <option key={p.id} value={p.id}>{p.name} ({teamName})</option>;
                            })}
                        </Select>
                        {eligiblePlayers.length === 0 && <p className="text-xs text-yellow-400 mt-1">No players found in Team 1 or Team 2 rosters.</p>}
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2"><Button onClick={onCancel} className="bg-gray-600">Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

// --- SPONSORS ---
const SponsorsAdmin = () => {
    const { sponsors, addSponsor, updateSponsor, deleteSponsor, toggleSponsorShowInFooter } = useSports();
    const [editing, setEditing] = useState<Sponsor | Partial<Sponsor> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (sponsor: any) => {
        setError(null);
        try { sponsor.id ? await updateSponsor(sponsor) : await addSponsor(sponsor); setEditing(null); } catch(e: any) { setError(e.message); }
    };
    const handleDelete = async (id: number) => { if(window.confirm('Delete sponsor?')) try { await deleteSponsor(id); } catch(e: any) { alert(e.message); } };

    return (
        <AdminSection title="Manage Sponsors">
            <div className="flex justify-end mb-4"><Button onClick={() => setEditing({})}>Add Sponsor</Button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sponsors.map(s => (
                    <div key={s.id} className="bg-accent p-3 rounded flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             {s.logoUrl ? <img src={s.logoUrl} className="w-8 h-8 object-contain bg-white rounded" alt="" /> : <div className="w-8 h-8 bg-primary rounded" />}
                             <div>
                                 <p className="font-bold">{s.name}</p>
                                 <p className="text-xs text-text-secondary">{s.website}</p>
                             </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                             <label className="text-xs flex items-center gap-1 cursor-pointer">
                                 <input type="checkbox" checked={s.showInFooter} onChange={() => toggleSponsorShowInFooter(s)} /> Footer
                             </label>
                             <div className="flex gap-1 mt-1">
                                 <Button onClick={() => setEditing(s)} className="bg-blue-600 text-xs px-2 py-1">Edit</Button>
                                 <Button onClick={() => handleDelete(s.id)} className="bg-red-600 text-xs px-2 py-1">Del</Button>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
            {editing && <FormModal title={editing.id ? "Edit Sponsor" : "Add Sponsor"} onClose={() => setEditing(null)}><SponsorForm sponsor={editing} onSave={handleSave} onCancel={() => setEditing(null)} error={error} /></FormModal>}
        </AdminSection>
    );
};

const SponsorForm: React.FC<{ sponsor: any, onSave: any, onCancel: any, error: any }> = ({ sponsor, onSave, onCancel, error }) => {
    const [formData, setFormData] = useState({ name: '', website: '', showInFooter: false, logoUrl: '', ...sponsor });
    const [file, setFile] = useState<File | null>(null);
    return (
        <form onSubmit={e => { e.preventDefault(); onSave({ ...formData, logoFile: file }); }} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
            <div><Label>Website</Label><Input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} /></div>
            <div><label className="flex items-center gap-2 text-text-primary"><input type="checkbox" checked={formData.showInFooter} onChange={e => setFormData({...formData, showInFooter: e.target.checked})} /> Show in Footer</label></div>
            <ImageUploadOrUrl 
                label="Logo" 
                urlValue={formData.logoUrl || ''} 
                onUrlChange={(val) => setFormData({...formData, logoUrl: val})}
                onFileChange={setFile}
            />
            <div className="flex justify-end gap-2"><Button onClick={onCancel} className="bg-gray-600">Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

// --- NOTICES ---
const NoticesAdmin = () => {
    const { notices, addNotice, deleteNotice } = useSports();
    const [editing, setEditing] = useState<Partial<Notice> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (notice: any) => {
        setError(null);
        try { await addNotice(notice); setEditing(null); } catch(e: any) { setError(e.message); }
    };
    const handleDelete = async (id: number) => { if(window.confirm('Delete notice?')) try { await deleteNotice(id); } catch(e: any) { alert(e.message); } };

    return (
        <AdminSection title="Manage Notices">
             <div className="flex justify-end mb-4"><Button onClick={() => setEditing({ level: 'Information', expiresAt: new Date(Date.now() + 86400000 * 7).toISOString().slice(0,10) })}>Add Notice</Button></div>
             <div className="space-y-2">
                 {notices.map(n => (
                     <div key={n.id} className="bg-accent p-3 rounded flex justify-between items-start">
                         <div>
                             <p className="font-bold text-white"><span className={`text-xs px-1 rounded mr-2 ${n.level === 'Urgent' ? 'bg-red-500' : n.level === 'Warning' ? 'bg-yellow-500 text-black' : 'bg-blue-500'}`}>{n.level}</span>{n.title}</p>
                             <p className="text-sm text-text-primary">{n.message}</p>
                             <p className="text-xs text-text-secondary mt-1">Expires: {new Date(n.expiresAt).toLocaleDateString()}</p>
                         </div>
                         <Button onClick={() => handleDelete(n.id)} className="bg-red-600 text-xs px-2 py-1">Del</Button>
                     </div>
                 ))}
             </div>
             {editing && <FormModal title="Add Notice" onClose={() => setEditing(null)}><NoticeForm notice={editing} onSave={handleSave} onCancel={() => setEditing(null)} error={error} /></FormModal>}
        </AdminSection>
    );
};

const NoticeForm: React.FC<{ notice: any, onSave: any, onCancel: any, error: any }> = ({ notice, onSave, onCancel, error }) => {
    const [formData, setFormData] = useState({ title: '', message: '', level: 'Information', expiresAt: '', ...notice });
    return (
        <form onSubmit={e => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div><Label>Title</Label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
            <div><Label>Message</Label><Textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required rows={3} /></div>
            <div><Label>Level</Label><Select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}><option>Information</option><option>Warning</option><option>Urgent</option></Select></div>
            <div><Label>Expires At</Label><Input type="date" value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} required /></div>
            <div className="flex justify-end gap-2"><Button onClick={onCancel} className="bg-gray-600">Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

// --- MAIN ADMIN VIEW ---
export const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'tournaments' | 'clubs' | 'teams' | 'players' | 'transfers' | 'fixtures' | 'sponsors' | 'notices'>('tournaments');
    const { userProfile } = useAuth();

    const tabs = [
        { id: 'tournaments', label: 'Tournaments' },
        { id: 'clubs', label: 'Clubs' },
        { id: 'teams', label: 'Teams' },
        { id: 'players', label: 'Players' },
        { id: 'transfers', label: 'Transfers' },
        { id: 'fixtures', label: 'Fixtures' },
        { id: 'sponsors', label: 'Sponsors' },
        { id: 'notices', label: 'Notices' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-secondary p-4 rounded-lg shadow-lg text-center">
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-text-secondary">Welcome back, {userProfile?.fullName || 'Admin'}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 border-b border-accent pb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-highlight text-white' : 'bg-primary text-text-secondary hover:text-white'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div>
                {activeTab === 'tournaments' && <TournamentsAdmin />}
                {activeTab === 'clubs' && <ClubsAdmin />}
                {activeTab === 'teams' && <TeamsAdmin />}
                {activeTab === 'players' && <PlayersAdmin />}
                {activeTab === 'transfers' && <TransfersAdmin />}
                {activeTab === 'fixtures' && <FixturesAdmin />}
                {activeTab === 'sponsors' && <SponsorsAdmin />}
                {activeTab === 'notices' && <NoticesAdmin />}
            </div>
        </div>
    );
};
