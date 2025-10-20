import React, { useState } from 'react';
import { parse } from 'papaparse';
import { useSports, CsvTeam, CsvPlayer } from '../context/SportsDataContext';
import type { Tournament, Team, Player, Fixture, Sponsor } from '../types';

// Reusable UI Components
const AdminSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-secondary p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        {children}
    </div>
);

const Button: React.FC<{ onClick?: () => void; children: React.ReactNode; className?: string; disabled?: boolean; type?: 'button' | 'submit' }> = ({ onClick, children, className = 'bg-highlight hover:bg-teal-400', disabled = false, type = "button" }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors duration-300 ${className} disabled:bg-gray-500 disabled:cursor-not-allowed`}
    >
        {children}
    </button>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full bg-primary mt-1 p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight" />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props} className="w-full bg-primary mt-1 p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight" />
);

const Label: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-text-secondary">{children}</label>
);

const FormModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-accent flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
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

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md mb-4 text-sm">
        <strong>Error:</strong> {message}
    </div>
);

// Admin Panels for each section

// Tournaments
const TournamentsAdmin = () => {
    const { tournaments, addTournament, updateTournament, deleteTournament } = useSports();
    const [editing, setEditing] = useState<Tournament | Partial<Tournament> | null>(null);
    const [error, setError] = useState<string | null>(null);

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
        if (window.confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
            try {
                await deleteTournament(id);
            } catch (err: any) {
                alert(`Deletion failed: ${err.message}`);
            }
        }
    };

    return (
        <AdminSection title="Manage Tournaments">
            <Button onClick={() => setEditing({})}>Add New Tournament</Button>
            <div className="mt-4 space-y-2">
                {tournaments.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-accent rounded-md">
                        <div>
                            <p className="font-bold">{t.name}</p>
                            <p className="text-sm text-highlight">{t.division}</p>
                        </div>
                        <div className="space-x-2">
                            <Button onClick={() => setEditing(t)} className="bg-blue-600 hover:bg-blue-500">Edit</Button>
                            <Button onClick={() => handleDelete(t.id)} className="bg-red-600 hover:bg-red-500">Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
            {editing && (
                <FormModal title={editing.id ? "Edit Tournament" : "Add Tournament"} onClose={() => { setEditing(null); setError(null); }}>
                    <TournamentForm tournament={editing} onSave={handleSave} onCancel={() => { setEditing(null); setError(null); }} error={error} />
                </FormModal>
            )}
        </AdminSection>
    );
};

const TournamentForm: React.FC<{ tournament: Tournament | Partial<Tournament>, onSave: (t: any) => void, onCancel: () => void, error: string | null }> = ({ tournament, onSave, onCancel, error }) => {
    const [formData, setFormData] = useState(tournament);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div>
                <Label htmlFor="name">Tournament Name</Label>
                <Input id="name" name="name" type="text" value={formData.name || ''} onChange={handleChange} required />
            </div>
            <div>
                <Label htmlFor="division">Division</Label>
                <Select id="division" name="division" value={formData.division || 'Division 1'} onChange={handleChange} required>
                    <option>Division 1</option>
                    <option>Division 2</option>
                </Select>
            </div>
            <div className="flex justify-end space-x-2">
                <Button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

// Teams
const TeamsAdmin = () => {
    const { teams, addTeam, updateTeam, deleteTeam } = useSports();
    const [editing, setEditing] = useState<Team | Partial<Team> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (team: Team | Partial<Team> & { logoFile?: File }) => {
        setError(null);
        try {
            if ('id' in team && team.id) {
                await updateTeam(team as Team & { logoFile?: File });
            } else {
                await addTeam(team as Omit<Team, 'id'> & { logoFile?: File });
            }
            setEditing(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this team?')) {
            try {
                await deleteTeam(id);
            } catch (err: any) {
                alert(`Deletion failed: ${err.message}`);
            }
        }
    };

    return (
        <AdminSection title="Manage Teams">
            <Button onClick={() => setEditing({})}>Add New Team</Button>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(t => (
                    <div key={t.id} className="p-3 bg-accent rounded-md text-center">
                         {t.logoUrl ? (
                            <img src={t.logoUrl} alt={t.name} className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-primary object-cover" />
                         ) : (
                            <div className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-primary bg-primary flex items-center justify-center text-text-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197" /></svg>
                            </div>
                         )}
                        <p className="font-bold">{t.name} ({t.shortName})</p>
                        <p className="text-sm text-highlight">{t.division}</p>
                        <div className="mt-2 space-x-2">
                            <Button onClick={() => setEditing(t)} className="bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1">Edit</Button>
                            <Button onClick={() => handleDelete(t.id)} className="bg-red-600 hover:bg-red-500 text-xs px-3 py-1">Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
            {editing && (
                <FormModal title={editing.id ? "Edit Team" : "Add Team"} onClose={() => { setEditing(null); setError(null); }}>
                    <TeamForm team={editing} onSave={handleSave} onCancel={() => { setEditing(null); setError(null); }} error={error} />
                </FormModal>
            )}
        </AdminSection>
    );
};

const TeamForm: React.FC<{ team: Team | Partial<Team>, onSave: (t: any) => void, onCancel: () => void, error: string | null }> = ({ team, onSave, onCancel, error }) => {
    const [formData, setFormData] = useState(team);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState(team.logoUrl);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemoveLogo = () => {
        setPreviewUrl(null);
        setLogoFile(null);
        setFormData({ ...formData, logoUrl: null });
        const fileInput = document.getElementById('logoFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, logoFile });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div>
                <Label htmlFor="name">Team Name</Label>
                <Input id="name" name="name" type="text" value={formData.name || ''} onChange={handleChange} required />
            </div>
            <div>
                <Label htmlFor="shortName">Short Name (3 letters)</Label>
                <Input id="shortName" name="shortName" type="text" value={formData.shortName || ''} onChange={handleChange} required maxLength={3} />
            </div>
             <div>
                <Label>Logo Image (Optional)</Label>
                <div className="mt-2 flex items-center gap-4">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Logo preview" className="w-20 h-20 rounded-full object-cover bg-primary" />
                    ) : (
                         <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-text-secondary">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197" /></svg>
                         </div>
                    )}
                    <div className="flex-grow">
                        <Input id="logoFile" name="logoFile" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="text-sm" />
                        {previewUrl && <Button type="button" onClick={handleRemoveLogo} className="bg-gray-600 hover:bg-gray-500 text-xs mt-2">Remove Logo</Button>}
                    </div>
                </div>
            </div>
            <div>
                <Label htmlFor="division">Division</Label>
                <Select id="division" name="division" value={formData.division || 'Division 1'} onChange={handleChange} required>
                    <option>Division 1</option>
                    <option>Division 2</option>
                </Select>
            </div>
            <div className="flex justify-end space-x-2">
                <Button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

// Players
const PlayersAdmin = () => {
    const { players, teams, addPlayer, updatePlayer, deletePlayer } = useSports();
    const [editing, setEditing] = useState<Player | Partial<Player> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (player: Player | Partial<Player> & { photoFile?: File }) => {
        setError(null);
        try {
            const payload = { ...player, stats: player.stats || { matches: 0, aces: 0, kills: 0, blocks: 0 }};
            if ('id' in payload && payload.id) {
                await updatePlayer(payload as Player & { photoFile?: File });
            } else {
                await addPlayer(payload as Omit<Player, 'id'> & { photoFile?: File });
            }
            setEditing(null);
        } catch(err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this player?')) {
            try {
                await deletePlayer(id);
            } catch (err: any) {
                alert(`Deletion failed: ${err.message}`);
            }
        }
    };

    return (
        <AdminSection title="Manage Players">
            <Button onClick={() => setEditing({})} disabled={teams.length === 0}>Add New Player</Button>
            {teams.length === 0 && <p className="text-sm text-yellow-400 mt-2">Please add a team before adding players.</p>}
            <div className="mt-4 space-y-2">
                {players.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-accent rounded-md">
                        <div className="flex items-center">
                            {p.photoUrl ? (
                                <img src={p.photoUrl} alt={p.name} className="w-10 h-10 rounded-full mr-3 object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full mr-3 bg-primary flex items-center justify-center text-text-secondary">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                            )}
                            <div>
                                <p className="font-bold">{p.name}</p>
                                <p className="text-sm text-highlight">{p.role}</p>
                            </div>
                        </div>
                        <div className="space-x-2">
                            <Button onClick={() => setEditing(p)} className="bg-blue-600 hover:bg-blue-500">Edit</Button>
                            <Button onClick={() => handleDelete(p.id)} className="bg-red-600 hover:bg-red-500">Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
            {editing && (
                <FormModal title={editing.id ? "Edit Player" : "Add Player"} onClose={() => { setEditing(null); setError(null); }}>
                    <PlayerForm player={editing} onSave={handleSave} onCancel={() => { setEditing(null); setError(null); }} teams={teams} error={error} />
                </FormModal>
            )}
        </AdminSection>
    );
};

const PlayerForm: React.FC<{ player: Player | Partial<Player>, onSave: (p: any) => void, onCancel: () => void, teams: Team[], error: string | null }> = ({ player, onSave, onCancel, teams, error }) => {
    const [formData, setFormData] = useState({...player});
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState(player.photoUrl);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemovePhoto = () => {
        setPreviewUrl(null);
        setPhotoFile(null);
        setFormData({ ...formData, photoUrl: null });
        const fileInput = document.getElementById('photoFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleStatsChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, stats: { ...formData.stats, [e.target.name]: parseInt(e.target.value, 10) || 0 }});
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({...formData, teamId: parseInt(formData.teamId as any, 10), photoFile });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
             <div>
                <Label htmlFor="name">Player Name</Label>
                <Input id="name" name="name" type="text" value={formData.name || ''} onChange={handleChange} required />
            </div>
             <div>
                <Label>Photo (Optional)</Label>
                <div className="mt-2 flex items-center gap-4">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Photo preview" className="w-20 h-20 rounded-full object-cover bg-primary" />
                    ) : (
                         <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-text-secondary">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                         </div>
                    )}
                    <div className="flex-grow">
                        <Input id="photoFile" name="photoFile" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="text-sm" />
                        {previewUrl && <Button type="button" onClick={handleRemovePhoto} className="bg-gray-600 hover:bg-gray-500 text-xs mt-2">Remove Photo</Button>}
                    </div>
                </div>
            </div>
             <div>
                <Label htmlFor="teamId">Team</Label>
                <Select id="teamId" name="teamId" value={formData.teamId || ''} onChange={handleChange} required>
                    <option value="" disabled>Select a team</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
            </div>
             <div>
                <Label htmlFor="role">Role</Label>
                <Select id="role" name="role" value={formData.role || 'Setter'} onChange={handleChange} required>
                    <option>Setter</option>
                    <option>Outside Hitter</option>
                    <option>Middle Blocker</option>
                    <option>Opposite Hitter</option>
                    <option>Libero</option>
                </Select>
            </div>
            <fieldset className="border border-accent p-4 rounded-md">
                <legend className="px-2 text-text-secondary">Stats (Optional)</legend>
                <div className="grid grid-cols-2 gap-4">
                     <div><Label htmlFor="matches">Matches</Label><Input id="matches" name="matches" type="number" value={formData.stats?.matches || 0} onChange={handleStatsChange} /></div>
                     <div><Label htmlFor="aces">Aces</Label><Input id="aces" name="aces" type="number" value={formData.stats?.aces || 0} onChange={handleStatsChange} /></div>
                     <div><Label htmlFor="kills">Kills</Label><Input id="kills" name="kills" type="number" value={formData.stats?.kills || 0} onChange={handleStatsChange} /></div>
                     <div><Label htmlFor="blocks">Blocks</Label><Input id="blocks" name="blocks" type="number" value={formData.stats?.blocks || 0} onChange={handleStatsChange} /></div>
                </div>
            </fieldset>
            <div className="flex justify-end space-x-2">
                <Button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};


// Fixtures
const FixturesAdmin = () => {
    const { fixtures, teams, tournaments, addFixture, updateFixture, deleteFixture } = useSports();
    const [editing, setEditing] = useState<Fixture | Partial<Omit<Fixture, 'score'>> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getTeam = (id: number) => teams.find(t => t.id === id)?.shortName || 'N/A';
    
    const handleSave = async (fixture: Fixture) => {
        setError(null);
        try {
            if (fixture.id) {
                const existingFixture = fixtures.find(f => f.id === fixture.id)!;
                await updateFixture({ ...existingFixture, ...fixture });
            } else {
                await addFixture(fixture);
            }
            setEditing(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this fixture?')) {
            try {
                await deleteFixture(id);
            } catch (err: any) {
                alert(`Deletion failed: ${err.message}`);
            }
        }
    };

    return (
        <AdminSection title="Manage Fixtures">
            <Button onClick={() => setEditing({})} disabled={teams.length < 2 || tournaments.length === 0}>Add New Fixture</Button>
            {(teams.length < 2 || tournaments.length === 0) && <p className="text-sm text-yellow-400 mt-2">Add at least 2 teams and 1 tournament to create fixtures.</p>}
            <div className="mt-4 space-y-2">
                {fixtures.map(f => (
                    <div key={f.id} className="p-3 bg-accent rounded-md">
                        <div className="flex items-center justify-between">
                            <p className="font-bold">{getTeam(f.team1Id)} vs {getTeam(f.team2Id)}</p>
                            <span className="text-xs font-semibold uppercase">{f.status}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{new Date(f.dateTime).toLocaleString()}</p>
                        <div className="mt-2 text-right space-x-2">
                             <Button onClick={() => setEditing(f)} className="bg-blue-600 hover:bg-blue-500">Edit</Button>
                            <Button onClick={() => handleDelete(f.id)} className="bg-red-600 hover:bg-red-500">Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
             {editing && (
                <FormModal title={editing.id ? "Edit Fixture" : "Add Fixture"} onClose={() => { setEditing(null); setError(null); }}>
                    <FixtureForm fixture={editing} onSave={handleSave} onCancel={() => { setEditing(null); setError(null); }} teams={teams} tournaments={tournaments} error={error} />
                </FormModal>
            )}
        </AdminSection>
    );
};

const FixtureForm: React.FC<{ fixture: Fixture | Partial<Fixture>, onSave: (f: any) => void, onCancel: () => void, teams: Team[], tournaments: Tournament[], error: string | null }> = ({ fixture, onSave, onCancel, teams, tournaments, error }) => {
    const toInputDateTimeString = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    };
    
    const [formData, setFormData] = useState({
        ...fixture,
        dateTime: toInputDateTimeString(fixture.dateTime)
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            dateTime: new Date(formData.dateTime!).toISOString(),
            tournamentId: parseInt(formData.tournamentId as any, 10),
            team1Id: parseInt(formData.team1Id as any, 10),
            team2Id: parseInt(formData.team2Id as any, 10),
        };
        if (payload.team1Id === payload.team2Id) {
            alert("A team cannot play against itself.");
            return;
        }
        onSave(payload);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div>
                <Label>Tournament</Label>
                <Select name="tournamentId" value={formData.tournamentId || ''} onChange={handleChange} required>
                    <option value="" disabled>Select tournament</option>
                    {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label>Team 1</Label>
                    <Select name="team1Id" value={formData.team1Id || ''} onChange={handleChange} required>
                        <option value="" disabled>Select Team 1</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                </div>
                 <div>
                    <Label>Team 2</Label>
                    <Select name="team2Id" value={formData.team2Id || ''} onChange={handleChange} required>
                        <option value="" disabled>Select Team 2</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                </div>
            </div>
            <div><Label>Ground</Label><Input name="ground" value={formData.ground || ''} onChange={handleChange} required /></div>
            <div><Label>Date & Time</Label><Input name="dateTime" type="datetime-local" value={formData.dateTime} onChange={handleChange} required /></div>
            <div>
                <Label>Status</Label>
                <Select name="status" value={formData.status || 'upcoming'} onChange={handleChange} required>
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                </Select>
            </div>
            <div><Label>Referee (Optional)</Label><Input name="referee" value={formData.referee || ''} onChange={handleChange} /></div>
            <div className="flex justify-end space-x-2">
                <Button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    )
};


// Sponsors
const SponsorsAdmin = () => {
    const { sponsors, addSponsor, updateSponsor, deleteSponsor } = useSports();
    const [editing, setEditing] = useState<Sponsor | Partial<Sponsor> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (sponsor: Sponsor | Partial<Sponsor> & { logoFile?: File }) => {
        setError(null);
        try {
            if (sponsor.id) {
                await updateSponsor(sponsor as Sponsor & { logoFile?: File });
            } else {
                await addSponsor(sponsor as Omit<Sponsor, 'id'> & { logoFile?: File });
            }
            setEditing(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this sponsor?')) {
            try {
                await deleteSponsor(id);
            } catch (err: any) {
                alert(`Deletion failed: ${err.message}`);
            }
        }
    };

    return (
        <AdminSection title="Manage Sponsors">
            <Button onClick={() => setEditing({})}>Add New Sponsor</Button>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {sponsors.map(s => (
                    <div key={s.id} className="p-3 bg-accent rounded-md text-center">
                        {s.logoUrl ? (
                            <img src={s.logoUrl} alt={s.name} className="h-12 max-w-[150px] object-contain mx-auto mb-2" />
                        ) : (
                             <div className="h-12 w-full flex items-center justify-center text-text-secondary mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             </div>
                        )}
                        <p className="font-bold text-sm">{s.name}</p>
                         <div className="mt-2 space-x-2">
                            <Button onClick={() => setEditing(s)} className="bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1">Edit</Button>
                            <Button onClick={() => handleDelete(s.id)} className="bg-red-600 hover:bg-red-500 text-xs px-3 py-1">Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
             {editing && (
                <FormModal title={editing.id ? "Edit Sponsor" : "Add Sponsor"} onClose={() => { setEditing(null); setError(null); }}>
                    <SponsorForm sponsor={editing} onSave={handleSave} onCancel={() => { setEditing(null); setError(null); }} error={error} />
                </FormModal>
            )}
        </AdminSection>
    );
};

const SponsorForm: React.FC<{ sponsor: Sponsor | Partial<Sponsor>, onSave: (s: any) => void, onCancel: () => void, error: string | null }> = ({ sponsor, onSave, onCancel, error }) => {
    const [formData, setFormData] = useState(sponsor);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState(sponsor.logoUrl);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemoveLogo = () => {
        setPreviewUrl(null);
        setLogoFile(null);
        setFormData({ ...formData, logoUrl: null });
        const fileInput = document.getElementById('logoFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, logoFile });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div><Label>Sponsor Name</Label><Input name="name" value={formData.name || ''} onChange={handleChange} required /></div>
            <div>
                <Label>Logo Image (Optional)</Label>
                <div className="mt-2 flex items-center gap-4">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Logo preview" className="w-20 h-20 rounded-md object-contain bg-primary" />
                    ) : (
                         <div className="w-20 h-20 rounded-md bg-primary flex items-center justify-center text-text-secondary">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         </div>
                    )}
                    <div className="flex-grow">
                        <Input id="logoFile" name="logoFile" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="text-sm" />
                        {previewUrl && <Button type="button" onClick={handleRemoveLogo} className="bg-gray-600 hover:bg-gray-500 text-xs mt-2">Remove Logo</Button>}
                    </div>
                </div>
            </div>
            <div><Label>Website</Label><Input name="website" type="url" value={formData.website || ''} onChange={handleChange} required /></div>
            <div className="flex justify-end space-x-2">
                <Button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};


// Bulk Import
const BulkImportAdmin = () => {
    const { bulkAddOrUpdateTeams, bulkAddOrUpdatePlayers } = useSports();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const parseCSV = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length) {
                        const firstError = results.errors[0];
                        reject(new Error(`CSV parsing error on row ${firstError.row}: ${firstError.message}`));
                    } else {
                        resolve(results.data);
                    }
                },
                error: (error: Error) => {
                    reject(error);
                }
            });
        });
    };

    const handleFileUpload = (type: 'teams' | 'players') => async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const data = await parseCSV(file);

            if (type === 'teams') {
                const requiredColumns = ['name', 'shortName', 'division'];
                for (let i = 0; i < data.length; i++) {
                    const row = data[i] as CsvTeam;
                    for (const col of requiredColumns) {
                        if (!row[col as keyof CsvTeam] || String(row[col as keyof CsvTeam]).trim() === '') {
                             throw new Error(`Validation failed at CSV row ${i + 2}. Column '${col}' cannot be empty.`);
                        }
                    }
                     if (row.division !== 'Division 1' && row.division !== 'Division 2') {
                        throw new Error(`Validation failed at CSV row ${i + 2}. Division must be exactly 'Division 1' or 'Division 2'.`);
                    }
                }
                await bulkAddOrUpdateTeams(data as CsvTeam[]);
                setSuccess(`${data.length} teams imported successfully!`);
            } else {
                 const requiredColumns = ['name', 'teamName', 'role'];
                 for (let i = 0; i < data.length; i++) {
                    const row = data[i] as CsvPlayer;
                    for (const col of requiredColumns) {
                        if (!row[col as keyof CsvPlayer] || String(row[col as keyof CsvPlayer]).trim() === '') {
                             throw new Error(`Validation failed at CSV row ${i + 2}. Column '${col}' cannot be empty.`);
                        }
                    }
                }
                await bulkAddOrUpdatePlayers(data as CsvPlayer[]);
                setSuccess(`${data.length} players imported successfully!`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred during import.");
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset file input
        }
    };

    return (
        <AdminSection title="Bulk Import Data">
            <p className="text-text-secondary mb-4">Upload CSV files to add or update teams and players in bulk. Ensure column headers match the required format.</p>
            {error && <p className="text-red-500 mb-4 p-3 bg-red-900/50 rounded-md"><strong>Error:</strong> {error}</p>}
            {success && <p className="text-green-500 mb-4 p-3 bg-green-900/50 rounded-md"><strong>Success:</strong> {success}</p>}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-accent p-4 rounded-md">
                    <h3 className="font-bold mb-2">Import Teams</h3>
                    <p className="text-xs text-text-secondary mb-2">Required columns: `name`, `shortName`, `division`. Optional: `logoUrl`</p>
                    <Label htmlFor="teams-csv">Upload Teams CSV</Label>
                    <Input id="teams-csv" type="file" accept=".csv" onChange={handleFileUpload('teams')} disabled={loading} />
                </div>
                 <div className="bg-accent p-4 rounded-md">
                    <h3 className="font-bold mb-2">Import Players</h3>
                    <p className="text-xs text-text-secondary mb-2">Required: `name`, `teamName`, `role`. Optional: `photoUrl`, `matches`, `aces`, `kills`, `blocks`</p>
                     <Label htmlFor="players-csv">Upload Players CSV</Label>
                    <Input id="players-csv" type="file" accept=".csv" onChange={handleFileUpload('players')} disabled={loading} />
                </div>
            </div>
             {loading && <p className="mt-4 text-center animate-pulse">Importing data, please wait...</p>}
        </AdminSection>
    );
};



// Main View
export const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('tournaments');

    const renderContent = () => {
        switch (activeTab) {
            case 'tournaments': return <TournamentsAdmin />;
            case 'teams': return <TeamsAdmin />;
            case 'players': return <PlayersAdmin />;
            case 'fixtures': return <FixturesAdmin />;
            case 'sponsors': return <SponsorsAdmin />;
            case 'bulk-import': return <BulkImportAdmin />;
            default: return null;
        }
    };

    const TabButton = ({ tab, label }: { tab: string; label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-300 whitespace-nowrap ${activeTab === tab
                    ? 'bg-secondary text-white'
                    : 'text-text-secondary hover:bg-accent hover:text-text-primary'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <h1 className="text-4xl font-extrabold text-center mb-8">Admin Panel</h1>
            <div className="border-b border-accent mb-6">
                <div className="flex overflow-x-auto">
                    <TabButton tab="tournaments" label="Tournaments" />
                    <TabButton tab="teams" label="Teams" />
                    <TabButton tab="players" label="Players" />
                    <TabButton tab="fixtures" label="Fixtures" />
                    <TabButton tab="sponsors" label="Sponsors" />
                    <TabButton tab="bulk-import" label="Bulk Import" />
                </div>
            </div>
            <div>{renderContent()}</div>
        </div>
    );
};