import React, { useState, useEffect } from 'react';
import { useSports } from '../context/SportsDataContext';
import { useAuth } from '../context/AuthContext';
import type { Fixture, Score, Player, Team, Tournament, Sponsor } from '../types';

const playerRoles: Player['role'][] = ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite Hitter', 'Libero'];
const divisions: Team['division'][] = ['Division 1', 'Division 2'];

// Generic input component
const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
        <input {...props} className="w-full bg-primary p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight read-only:bg-accent" />
    </div>
);

// Generic select component
const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
        <select {...props} className="w-full bg-primary p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight">
            {children}
        </select>
    </div>
);
// Base form component
const FormContainer: React.FC<{ onSave: (e: React.FormEvent) => void; onCancel: () => void; children: React.ReactNode; title: string }> = ({ onSave, onCancel, children, title }) => (
    <form onSubmit={onSave} className="bg-accent p-4 rounded-lg space-y-4 mb-3">
        <h3 className="text-lg font-semibold text-white text-center">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children}
        </div>
        <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-600 transition-colors">Cancel</button>
            <button type="submit" className="bg-highlight text-white px-4 py-2 rounded-md font-semibold hover:bg-teal-400 transition-colors">Save</button>
        </div>
    </form>
);


// Tournament Form
const TournamentForm: React.FC<{ tournament?: Tournament; onSave: (data: Tournament | Omit<Tournament, 'id'>) => void; onCancel: () => void; }> = ({ tournament, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: tournament?.name || '',
        division: tournament?.division || 'Division 1',
    });
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return alert('Name is required');
        onSave(tournament ? { ...tournament, ...formData } : formData);
    };
    return (
        <FormContainer onSave={handleSave} onCancel={onCancel} title={tournament ? 'Edit Tournament' : 'Add Tournament'}>
            <FormInput label="Tournament Name" name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required/>
            <FormSelect label="Division" name="division" value={formData.division} onChange={e => setFormData({ ...formData, division: e.target.value as Team['division'] })}>
                {divisions.map(d => <option key={d} value={d}>{d}</option>)}
            </FormSelect>
        </FormContainer>
    );
};

// Team Form
const TeamForm: React.FC<{ team?: Team; onSave: (data: Team | Omit<Team, 'id'>) => void; onCancel: () => void; }> = ({ team, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: team?.name || '',
        shortName: team?.shortName || '',
        logoUrl: team?.logoUrl || '',
        division: team?.division || 'Division 1',
    });
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.shortName) return alert('Name and short name are required');
        onSave(team ? { ...team, ...formData } : formData);
    };
    return (
        <FormContainer onSave={handleSave} onCancel={onCancel} title={team ? 'Edit Team' : 'Add Team'}>
            <FormInput label="Team Name" name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required/>
            <FormInput label="Short Name" name="shortName" value={formData.shortName} onChange={e => setFormData({ ...formData, shortName: e.target.value })} required/>
            <FormInput label="Logo URL" name="logoUrl" value={formData.logoUrl} onChange={e => setFormData({ ...formData, logoUrl: e.target.value })} />
            <FormSelect label="Division" name="division" value={formData.division} onChange={e => setFormData({ ...formData, division: e.target.value as Team['division'] })}>
                {divisions.map(d => <option key={d} value={d}>{d}</option>)}
            </FormSelect>
        </FormContainer>
    );
};

// Player Form
const PlayerForm: React.FC<{ player?: Player; onSave: (data: Player | Omit<Player, 'id'>) => void; onCancel: () => void; }> = ({ player, onSave, onCancel }) => {
    const { teams } = useSports();
    const [formData, setFormData] = useState({
        name: player?.name || '',
        photoUrl: player?.photoUrl || '',
        teamId: player?.teamId || teams[0]?.id || 0,
        role: player?.role || 'Setter',
        stats: player?.stats || { matches: 0, aces: 0, kills: 0, blocks: 0 }
    });
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.teamId) return alert('Name and team are required');
        onSave(player ? { ...player, ...formData } : formData);
    };
    const handleStatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, stats: { ...formData.stats, [e.target.name]: parseInt(e.target.value) || 0 }});
    };
    return (
        <FormContainer onSave={handleSave} onCancel={onCancel} title={player ? 'Edit Player' : 'Add Player'}>
            <FormInput label="Player Name" name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required/>
            <FormInput label="Photo URL" name="photoUrl" value={formData.photoUrl} onChange={e => setFormData({ ...formData, photoUrl: e.target.value })} />
            <FormSelect label="Team" name="teamId" value={formData.teamId} onChange={e => setFormData({ ...formData, teamId: parseInt(e.target.value) })}>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </FormSelect>
            <FormSelect label="Role" name="role" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as Player['role'] })}>
                {playerRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </FormSelect>
            <FormInput label="Matches" name="matches" type="number" value={formData.stats.matches} onChange={handleStatChange} />
            <FormInput label="Aces" name="aces" type="number" value={formData.stats.aces} onChange={handleStatChange} />
            <FormInput label="Kills" name="kills" type="number" value={formData.stats.kills} onChange={handleStatChange} />
            <FormInput label="Blocks" name="blocks" type="number" value={formData.stats.blocks} onChange={handleStatChange} />
        </FormContainer>
    );
};

// Fixture Add Form
const FixtureAddForm: React.FC<{ onSave: (data: Omit<Fixture, 'id'>) => void; onCancel: () => void; }> = ({ onSave, onCancel }) => {
    const { teams, tournaments } = useSports();
    const [formData, setFormData] = useState({
        tournamentId: tournaments[0]?.id || 0,
        team1Id: teams[0]?.id || 0,
        team2Id: teams[1]?.id || 0,
        ground: '',
        dateTime: new Date().toISOString().slice(0, 16),
        status: 'upcoming' as const,
        referee: '',
    });
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.ground || formData.team1Id === formData.team2Id) {
            return alert('Ground is required and teams must be different.');
        }
        onSave(formData);
    };
    return (
        <FormContainer onSave={handleSave} onCancel={onCancel} title="Add New Fixture">
            <FormSelect label="Tournament" name="tournamentId" value={formData.tournamentId} onChange={e => setFormData({...formData, tournamentId: parseInt(e.target.value)})}>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </FormSelect>
             <FormInput label="Ground" name="ground" value={formData.ground} onChange={e => setFormData({ ...formData, ground: e.target.value })} required/>
            <FormSelect label="Team 1" name="team1Id" value={formData.team1Id} onChange={e => setFormData({...formData, team1Id: parseInt(e.target.value)})}>
                 {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </FormSelect>
            <FormSelect label="Team 2" name="team2Id" value={formData.team2Id} onChange={e => setFormData({...formData, team2Id: parseInt(e.target.value)})}>
                 {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </FormSelect>
             <FormInput label="Date & Time" name="dateTime" type="datetime-local" value={formData.dateTime} onChange={e => setFormData({ ...formData, dateTime: e.target.value })} required/>
             <FormInput label="Referee" name="referee" value={formData.referee || ''} onChange={e => setFormData({ ...formData, referee: e.target.value })} placeholder="Appoint a referee" />
        </FormContainer>
    );
};

// Sponsor Form
const SponsorForm: React.FC<{ sponsor?: Sponsor; onSave: (data: Sponsor | Omit<Sponsor, 'id'>) => void; onCancel: () => void; }> = ({ sponsor, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: sponsor?.name || '',
        logoUrl: sponsor?.logoUrl || '',
        website: sponsor?.website || '#',
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('File is too large. Please select an image under 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.logoUrl) return alert('Name and Logo are required');
        onSave(sponsor ? { ...sponsor, ...formData } : formData);
    };

    return (
        <FormContainer onSave={handleSave} onCancel={onCancel} title={sponsor ? 'Edit Sponsor' : 'Add Sponsor'}>
            <FormInput label="Sponsor Name" name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required/>
            <FormInput label="Website URL" name="website" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1">Sponsor Logo (PNG, JPG)</label>
                <div className="mt-1 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 p-2 bg-primary border border-accent rounded-md">
                    {formData.logoUrl ?
                        <img src={formData.logoUrl} alt="Sponsor Logo Preview" className="h-12 w-auto max-w-xs object-contain rounded-md bg-white p-1" /> :
                        <div className="h-12 w-24 flex items-center justify-center bg-gray-700 rounded-md text-xs text-text-secondary">No Image</div>
                    }
                    <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleLogoChange}
                        className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-highlight file:text-white hover:file:bg-teal-400 cursor-pointer"
                    />
                </div>
            </div>
        </FormContainer>
    );
};


const ManagementSection: React.FC<{ title: string; children: React.ReactNode; onAdd?: () => void; isAdding: boolean }> = ({ title, children, onAdd, isAdding }) => (
    <div className="bg-secondary p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            {onAdd && (
                <button onClick={onAdd} disabled={isAdding} className="bg-highlight text-white px-4 py-2 rounded-md font-semibold hover:bg-teal-400 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                    Add New
                </button>
            )}
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {children}
        </div>
    </div>
);

const ItemRow: React.FC<{ name: string; description?: string; onDelete?: () => void; onEdit?: () => void; imageUrl?: string; }> = ({ name, description, onDelete, onEdit, imageUrl }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-accent p-3 rounded-md gap-2">
        <div className="flex items-center space-x-3">
            {imageUrl && <img src={imageUrl} alt={name} className="w-10 h-10 rounded-md object-contain bg-white p-0.5" />}
            <div>
                <p className="font-semibold text-text-primary">{name}</p>
                {description && <p className="text-sm text-text-secondary">{description}</p>}
            </div>
        </div>
        {(onEdit || onDelete) && (
            <div className="space-x-2 flex-shrink-0 self-end sm:self-auto">
                {onEdit && <button onClick={onEdit} className="text-blue-400 hover:text-blue-300 font-semibold">Edit</button>}
                {onDelete && <button onClick={onDelete} className="text-red-500 hover:text-red-400 font-semibold">Delete</button>}
            </div>
        )}
    </div>
);


const FixtureEditForm: React.FC<{ fixture: Fixture; onSave: (updatedFixture: Fixture) => void; onCancel: () => void; }> = ({ fixture, onSave, onCancel }) => {
    const { getTeamById } = useSports();
    const [formData, setFormData] = useState<Fixture>(fixture);
    const team1 = getTeamById(formData.team1Id);
    const team2 = getTeamById(formData.team2Id);

    useEffect(() => {
        if (formData.status === 'completed' && formData.score?.sets) {
            let team1SetsWon = 0;
            let team2SetsWon = 0;
            formData.score.sets.forEach(set => {
                if (set.team1Points > set.team2Points) team1SetsWon++;
                else if (set.team2Points > set.team1Points) team2SetsWon++;
            });
            if (formData.score.team1Score !== team1SetsWon || formData.score.team2Score !== team2SetsWon) {
                 setFormData(prev => ({
                    ...prev,
                    score: { ...prev.score!, team1Score: team1SetsWon, team2Score: team2SetsWon }
                }));
            }
        }
    }, [formData.status, formData.score?.sets]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let newState = { ...formData, [name]: value };

        if (name === 'status' && value === 'completed' && !newState.score) {
            newState.score = {
                team1Score: 0,
                team2Score: 0,
                sets: [{ team1Points: 0, team2Points: 0 }, { team1Points: 0, team2Points: 0 }],
                resultMessage: '',
            };
        }
        setFormData(newState);
    };

    const handleSetPointChange = (index: number, team: 'team1Points' | 'team2Points', value: string) => {
        const newSets = [...(formData.score?.sets || [])];
        newSets[index] = { ...newSets[index], [team]: parseInt(value) || 0 };
        setFormData(prev => ({ ...prev, score: { ...prev.score!, sets: newSets }}));
    };

    const addSet = () => {
        const newSets = [...(formData.score?.sets || []), { team1Points: 0, team2Points: 0 }];
        setFormData(prev => ({ ...prev, score: { ...prev.score!, sets: newSets }}));
    };

    const removeSet = (index: number) => {
        const newSets = [...(formData.score?.sets || [])];
        newSets.splice(index, 1);
        setFormData(prev => ({ ...prev, score: { ...prev.score!, sets: newSets }}));
    };
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        let updatedFixture = { ...formData };
        if (updatedFixture.status === 'completed' && updatedFixture.score && team1 && team2) {
            const { team1Score, team2Score } = updatedFixture.score;
            let resultMessage = '';
            if (team1Score > team2Score) {
                resultMessage = `${team1.name} won ${team1Score}-${team2Score}`;
            } else if (team2Score > team1Score) {
                resultMessage = `${team2.name} won ${team2Score}-${team1Score}`;
            } else {
                resultMessage = `Match drawn ${team1Score}-${team2Score}`;
            }
            updatedFixture.score.resultMessage = resultMessage;
        } else if (updatedFixture.status !== 'completed') {
            delete updatedFixture.score;
        }
        onSave(updatedFixture);
    };

    return (
        <FormContainer onSave={handleSave} onCancel={onCancel} title={`${team1?.name} vs ${team2?.name}`}>
            <FormInput label="Ground" name="ground" value={formData.ground} onChange={handleInputChange} required/>
            <FormInput label="Referee" name="referee" value={formData.referee || ''} onChange={handleInputChange} placeholder="Appoint a referee" />
            <FormSelect label="Status" name="status" value={formData.status} onChange={handleInputChange}>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
            </FormSelect>
            <FormInput label="Date & Time" type="datetime-local" name="dateTime" value={new Date(formData.dateTime).toISOString().slice(0, 16)} onChange={handleInputChange} required/>
            {formData.status === 'completed' && (
                <>
                    <FormInput label={`${team1?.shortName} Final Score`} type="number" name="team1Score" value={formData.score?.team1Score || 0} readOnly />
                    <FormInput label={`${team2?.shortName} Final Score`} type="number" name="team2Score" value={formData.score?.team2Score || 0} readOnly />
                    <div className="md:col-span-2 space-y-2 pt-2 border-t border-primary">
                        <label className="block text-sm font-medium text-text-secondary">Set Breakdown</label>
                        {formData.score?.sets?.map((set, index) => (
                             <div key={index} className="flex items-center space-x-2 flex-wrap gap-y-2">
                                <span className="text-text-secondary font-medium w-16 flex-shrink-0">Set {index + 1}:</span>
                                <input className="flex-grow min-w-[60px] bg-primary p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight" type="number" value={set.team1Points} onChange={e => handleSetPointChange(index, 'team1Points', e.target.value)} />
                                <span className="text-text-secondary font-bold">-</span>
                                <input className="flex-grow min-w-[60px] bg-primary p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight" type="number" value={set.team2Points} onChange={e => handleSetPointChange(index, 'team2Points', e.target.value)} />
                                <button type="button" onClick={() => removeSet(index)} className="text-red-500 hover:text-red-400 p-2 rounded-full transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addSet} className="text-sm bg-highlight/80 text-white px-3 py-1 rounded-md font-semibold hover:bg-highlight transition-colors">
                            Add Set
                        </button>
                    </div>
                </>
            )}
        </FormContainer>
    );
};

const AdminUserForm: React.FC<{ onSave: (username: string, password_one: string, password_two: string) => void, onCancel: () => void }> = ({ onSave, onCancel }) => {
    const [username, setUsername] = useState('');
    const [passwordOne, setPasswordOne] = useState('');
    const [passwordTwo, setPasswordTwo] = useState('');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(username, passwordOne, passwordTwo);
    };

    return (
        <FormContainer onSave={handleSave} onCancel={onCancel} title="Add New Admin">
            <FormInput label="Username" type="text" value={username} onChange={e => setUsername(e.target.value)} required/>
            <div />
            <FormInput label="Password" type="password" value={passwordOne} onChange={e => setPasswordOne(e.target.value)} required/>
            <FormInput label="Confirm Password" type="password" value={passwordTwo} onChange={e => setPasswordTwo(e.target.value)} required/>
        </FormContainer>
    );
};

const AdminEditForm: React.FC<{ admin: { id: number; username: string }; onSave: (id: number, pass1: string, pass2: string) => void; onCancel: () => void; }> = ({ admin, onSave, onCancel }) => {
    const [passwordOne, setPasswordOne] = useState('');
    const [passwordTwo, setPasswordTwo] = useState('');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(admin.id, passwordOne, passwordTwo);
    };

    return (
        <FormContainer onSave={handleSave} onCancel={onCancel} title={`Edit Admin: ${admin.username}`}>
            <FormInput label="Username" type="text" value={admin.username} readOnly />
            <div />
            <FormInput label="New Password" type="password" value={passwordOne} onChange={e => setPasswordOne(e.target.value)} required placeholder="Enter new password" />
            <FormInput label="Confirm New Password" type="password" value={passwordTwo} onChange={e => setPasswordTwo(e.target.value)} required placeholder="Confirm new password" />
        </FormContainer>
    );
};


type EditState = { type: 'player' | 'team' | 'tournament' | 'fixture' | 'sponsor' | 'admin' | null, id: number | null };
type AddState = 'player' | 'team' | 'tournament' | 'fixture' | 'sponsor' | 'admin' | null;

export const AdminView: React.FC = () => {
    const { players, teams, tournaments, fixtures, sponsors, dispatch, getTeamById } = useSports();
    const { admins, registerAdmin, currentUser, deleteAdmin, updateAdminPassword } = useAuth();
    const [editingState, setEditingState] = useState<EditState>({ type: null, id: null });
    const [addingType, setAddingType] = useState<AddState>(null);

    const handleSetAdding = (type: AddState) => {
        setAddingType(type);
        setEditingState({ type: null, id: null });
    }

    const handleSetEditing = (type: EditState['type'], id: number) => {
        setEditingState({ type, id });
        setAddingType(null);
    }
    
    const handleDelete = (type: 'PLAYER' | 'TEAM' | 'TOURNAMENT' | 'FIXTURE' | 'SPONSOR', id: number) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            dispatch({ type: `DELETE_${type}`, payload: id });
        }
    };

    const handleAddAdmin = (username: string, pass1: string, pass2: string) => {
        if (pass1 !== pass2) {
            alert("Passwords do not match.");
            return;
        }
        if (pass1.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }
        const success = registerAdmin(username, pass1);
        if (success) {
            handleSetAdding(null);
        } else {
            alert("Username already exists.");
        }
    };

    const handleDeleteAdmin = (id: number) => {
        if (window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
            const success = deleteAdmin(id);
            if (!success) {
                alert('Error: You cannot delete your own account.');
            }
        }
    };

    const handleUpdateAdmin = (id: number, pass1: string, pass2: string) => {
        if (pass1 !== pass2) {
            alert('Passwords do not match.');
            return;
        }
        if (pass1.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }
        const success = updateAdminPassword(id, pass1);
        if (success) {
            handleSetEditing(null, 0); // Close form
        } else {
            alert('Failed to update admin.');
        }
    };

    return (
        <div>
            <h1 className="text-4xl font-extrabold text-center mb-8">Admin Panel</h1>
            <p className="text-center text-text-secondary mb-8 -mt-6">Logged in as <span className="font-bold text-highlight">{currentUser?.username}</span></p>
            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
                <ManagementSection title="Manage Players" onAdd={() => handleSetAdding('player')} isAdding={addingType === 'player'}>
                    {addingType === 'player' && <PlayerForm onSave={p => { dispatch({ type: 'ADD_PLAYER', payload: p as Omit<Player, 'id'> }); handleSetAdding(null); }} onCancel={() => handleSetAdding(null)} />}
                    {players.map(player => editingState.type === 'player' && editingState.id === player.id ? (
                        <PlayerForm key={player.id} player={player} onSave={p => { dispatch({ type: 'UPDATE_PLAYER', payload: p as Player }); handleSetEditing(null, 0); }} onCancel={() => handleSetEditing(null, 0)} />
                    ) : (
                        <ItemRow key={player.id} name={player.name} description={`Team: ${getTeamById(player.teamId)?.name || 'N/A'}`} imageUrl={player.photoUrl} onEdit={() => handleSetEditing('player', player.id)} onDelete={() => handleDelete('PLAYER', player.id)} />
                    ))}
                </ManagementSection>

                <ManagementSection title="Manage Teams" onAdd={() => handleSetAdding('team')} isAdding={addingType === 'team'}>
                    {addingType === 'team' && <TeamForm onSave={t => { dispatch({ type: 'ADD_TEAM', payload: t as Omit<Team, 'id'> }); handleSetAdding(null); }} onCancel={() => handleSetAdding(null)} />}
                    {teams.map(team => editingState.type === 'team' && editingState.id === team.id ? (
                        <TeamForm key={team.id} team={team} onSave={t => { dispatch({ type: 'UPDATE_TEAM', payload: t as Team }); handleSetEditing(null, 0); }} onCancel={() => handleSetEditing(null, 0)} />
                    ) : (
                        <ItemRow key={team.id} name={team.name} description={team.division} imageUrl={team.logoUrl} onEdit={() => handleSetEditing('team', team.id)} onDelete={() => handleDelete('TEAM', team.id)} />
                    ))}
                </ManagementSection>

                <ManagementSection title="Manage Tournaments" onAdd={() => handleSetAdding('tournament')} isAdding={addingType === 'tournament'}>
                    {addingType === 'tournament' && <TournamentForm onSave={t => { dispatch({ type: 'ADD_TOURNAMENT', payload: t as Omit<Tournament, 'id'>}); handleSetAdding(null); }} onCancel={() => handleSetAdding(null)} />}
                    {tournaments.map(tournament => editingState.type === 'tournament' && editingState.id === tournament.id ? (
                         <TournamentForm key={tournament.id} tournament={tournament} onSave={t => { dispatch({ type: 'UPDATE_TOURNAMENT', payload: t as Tournament }); handleSetEditing(null, 0); }} onCancel={() => handleSetEditing(null, 0)} />
                    ) : (
                        <ItemRow key={tournament.id} name={tournament.name} description={tournament.division} onEdit={() => handleSetEditing('tournament', tournament.id)} onDelete={() => handleDelete('TOURNAMENT', tournament.id)} />
                    ))}
                </ManagementSection>

                <ManagementSection title="Manage Fixtures" onAdd={() => handleSetAdding('fixture')} isAdding={addingType === 'fixture'}>
                    {addingType === 'fixture' && <FixtureAddForm onSave={f => { dispatch({ type: 'ADD_FIXTURE', payload: f as Omit<Fixture, 'id'>}); handleSetAdding(null); }} onCancel={() => handleSetAdding(null)} />}
                     {fixtures.sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()).map(fixture => editingState.type === 'fixture' && editingState.id === fixture.id ? (
                        <FixtureEditForm key={fixture.id} fixture={fixture} onSave={f => { dispatch({ type: 'UPDATE_FIXTURE', payload: f }); handleSetEditing(null, 0); }} onCancel={() => handleSetEditing(null, 0)} />
                    ) : (
                        <ItemRow key={fixture.id} name={`${getTeamById(fixture.team1Id)?.name || 'N/A'} vs ${getTeamById(fixture.team2Id)?.name || 'N/A'}`} description={`${fixture.ground} - ${new Date(fixture.dateTime).toLocaleString()}${fixture.referee ? ` | Referee: ${fixture.referee}` : ''}`} onEdit={() => handleSetEditing('fixture', fixture.id)} onDelete={() => handleDelete('FIXTURE', fixture.id)} />
                    ))}
                </ManagementSection>

                <ManagementSection title="Manage Sponsors" onAdd={() => handleSetAdding('sponsor')} isAdding={addingType === 'sponsor'}>
                    {addingType === 'sponsor' && <SponsorForm onSave={s => { dispatch({ type: 'ADD_SPONSOR', payload: s as Omit<Sponsor, 'id'> }); handleSetAdding(null); }} onCancel={() => handleSetAdding(null)} />}
                    {sponsors.map(sponsor => editingState.type === 'sponsor' && editingState.id === sponsor.id ? (
                        <SponsorForm key={sponsor.id} sponsor={sponsor} onSave={s => { dispatch({ type: 'UPDATE_SPONSOR', payload: s as Sponsor }); handleSetEditing(null, 0); }} onCancel={() => handleSetEditing(null, 0)} />
                    ) : (
                        <ItemRow key={sponsor.id} name={sponsor.name} description={sponsor.website} imageUrl={sponsor.logoUrl} onEdit={() => handleSetEditing('sponsor', sponsor.id)} onDelete={() => handleDelete('SPONSOR', sponsor.id)} />
                    ))}
                </ManagementSection>

                <ManagementSection title="Manage Admins" onAdd={() => handleSetAdding('admin')} isAdding={addingType === 'admin'}>
                    {addingType === 'admin' && (
                        <AdminUserForm 
                            onSave={handleAddAdmin} 
                            onCancel={() => handleSetAdding(null)} 
                        />
                    )}
                    {admins.map(admin => (
                        editingState.type === 'admin' && editingState.id === admin.id ? (
                            <AdminEditForm
                                key={admin.id}
                                admin={admin}
                                onSave={handleUpdateAdmin}
                                onCancel={() => handleSetEditing(null, 0)}
                            />
                        ) : (
                            <ItemRow
                                key={admin.id}
                                name={admin.username}
                                description={admin.id === currentUser?.id ? '(You)' : undefined}
                                onEdit={() => handleSetEditing('admin', admin.id)}
                                onDelete={admin.id !== currentUser?.id ? () => handleDeleteAdmin(admin.id) : undefined}
                            />
                        )
                    ))}
                </ManagementSection>
            </div>
        </div>
    );
};