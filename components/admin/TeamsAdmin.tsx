import React, { useState } from 'react';
import { useSports } from '../../context/SportsDataContext';
import type { Team } from '../../types';
import { AdminSection, Button, Input, Select, Label, FormModal, ErrorMessage } from './AdminUI';

const TeamForm: React.FC<{ team: Team | Partial<Team>, onSave: (t: any) => void, onCancel: () => void, error: string | null, loading: boolean }> = ({ team, onSave, onCancel, error, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        shortName: '',
        division: 'Division 1',
        ...team
    });
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
                <Button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
            </div>
        </form>
    );
};

export const TeamsAdmin = () => {
    const { teams, addTeam, updateTeam, deleteTeam } = useSports();
    const [editing, setEditing] = useState<Team | Partial<Team> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSave = async (team: Team | Partial<Team> & { logoFile?: File }) => {
        setError(null);
        setLoading(true);
        try {
            if ('id' in team && team.id) {
                await updateTeam(team as Team & { logoFile?: File });
            } else {
                await addTeam(team as Omit<Team, 'id'> & { logoFile?: File });
            }
            setEditing(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
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
                    <TeamForm team={editing} onSave={handleSave} onCancel={() => { setEditing(null); setError(null); }} error={error} loading={loading} />
                </FormModal>
            )}
        </AdminSection>
    );
};