import React, { useState } from 'react';
import { useSports } from '../../context/SportsDataContext';
import type { Sponsor } from '../../types';
import { AdminSection, Button, Input, Label, FormModal, ErrorMessage } from './AdminUI';

const SponsorForm: React.FC<{ sponsor: Sponsor | Partial<Sponsor>, onSave: (s: any) => void, onCancel: () => void, error: string | null, loading: boolean }> = ({ sponsor, onSave, onCancel, error, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        website: '',
        isGlobal: false,
        ...sponsor
    });
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

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
            
            <div className="flex items-center space-x-3 bg-primary p-3 rounded-md">
                <input
                    id="isGlobal"
                    name="isGlobal"
                    type="checkbox"
                    checked={formData.isGlobal || false}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-accent bg-secondary text-highlight focus:ring-highlight"
                />
                <div>
                    <Label htmlFor="isGlobal">Global Sponsor</Label>
                    <p className="text-xs text-text-secondary">Show this sponsor in the footer on all pages.</p>
                </div>
            </div>

            <div className="flex justify-end space-x-2">
                <Button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
            </div>
        </form>
    );
};

export const SponsorsAdmin = () => {
    const { sponsors, addSponsor, updateSponsor, deleteSponsor } = useSports();
    const [editing, setEditing] = useState<Sponsor | Partial<Sponsor> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSave = async (sponsor: Sponsor | Partial<Sponsor> & { logoFile?: File }) => {
        setError(null);
        setLoading(true);
        try {
            if (sponsor.id) {
                await updateSponsor(sponsor as Sponsor & { logoFile?: File });
            } else {
                await addSponsor(sponsor as Omit<Sponsor, 'id'> & { logoFile?: File });
            }
            setEditing(null);
        } catch (err: any) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this sponsor? This will also remove them from any tournaments they are linked to.')) {
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
                        {s.isGlobal && <p className="text-xs text-highlight font-semibold">Global</p>}
                         <div className="mt-2 space-x-2">
                            <Button onClick={() => setEditing(s)} className="bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1">Edit</Button>
                            <Button onClick={() => handleDelete(s.id)} className="bg-red-600 hover:bg-red-500 text-xs px-3 py-1">Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
             {editing && (
                <FormModal title={editing.id ? "Edit Sponsor" : "Add Sponsor"} onClose={() => { setEditing(null); setError(null); }}>
                    <SponsorForm sponsor={editing} onSave={handleSave} onCancel={() => { setEditing(null); setError(null); }} error={error} loading={loading} />
                </FormModal>
            )}
        </AdminSection>
    );
};