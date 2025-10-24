import React, { useState } from 'react';
import { useSports } from '../../context/SportsDataContext';
import type { Player, Team, PlayerRole } from '../../types';
import { AdminSection, Button, Input, Select, Label, FormModal, ErrorMessage } from './AdminUI';

const PlayerForm: React.FC<{ player: Player | Partial<Player>, onSave: (p: any) => void, onCancel: () => void, teams: Team[], error: string | null }> = ({ player, onSave, onCancel, teams, error }) => {
    const playerRoles: PlayerRole[] = ['Main Netty', 'Left Front', 'Right Front', 'Net Center', 'Back Center', 'Left Back', 'Right Back', 'Right Netty', 'Left Netty', 'Service Man'];
    
    const [formData, setFormData] = useState({
        name: '',
        role: 'Main Netty' as PlayerRole,
        ...player
    });
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
                <Select id="role" name="role" value={formData.role || 'Main Netty'} onChange={handleChange} required>
                    {playerRoles.map(r => <option key={r} value={r}>{r}</option>)}
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
                <Button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

export const PlayersAdmin = () => {
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
