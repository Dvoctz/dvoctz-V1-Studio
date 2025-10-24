import React, { useState, useEffect } from 'react';
import { useSports } from '../../context/SportsDataContext';
import type { Tournament, Sponsor } from '../../types';
import { AdminSection, Button, Input, Select, Label, FormModal, ErrorMessage } from './AdminUI';

const TournamentForm: React.FC<{ 
    tournament: Tournament | Partial<Tournament>, 
    onSave: (t: any, s: number[]) => void, 
    onCancel: () => void, 
    error: string | null,
    loading: boolean,
    sponsors: Sponsor[],
    getSponsorsForTournament: (id: number) => Sponsor[]
}> = ({ tournament, onSave, onCancel, error, loading, sponsors, getSponsorsForTournament }) => {
    const [formData, setFormData] = useState({
        name: '',
        division: 'Division 1',
        ...tournament
    });
    const [linkedSponsorIds, setLinkedSponsorIds] = useState<number[]>([]);

    useEffect(() => {
        if (tournament.id) {
            const currentSponsors = getSponsorsForTournament(tournament.id);
            setLinkedSponsorIds(currentSponsors.map(s => s.id));
        }
    }, [tournament, getSponsorsForTournament]);

    const linkedSponsors = sponsors.filter(s => linkedSponsorIds.includes(s.id));
    const availableSponsors = sponsors.filter(s => !linkedSponsorIds.includes(s.id));

    const handleAddSponsor = (sponsorId: number) => {
        setLinkedSponsorIds(prev => [...prev, sponsorId]);
    };

    const handleRemoveSponsor = (sponsorId: number) => {
        setLinkedSponsorIds(prev => prev.filter(id => id !== sponsorId));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, linkedSponsorIds);
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
            
            <fieldset className="border border-accent p-4 rounded-md">
                <legend className="px-2 text-text-secondary">Manage Sponsors</legend>
                 <div className="space-y-3">
                    <Label>Add Sponsor</Label>
                    <div className="flex gap-2">
                        <Select
                            value=""
                            onChange={(e) => handleAddSponsor(parseInt(e.target.value, 10))}
                            disabled={availableSponsors.length === 0}
                        >
                            <option value="" disabled>
                                {availableSponsors.length === 0 ? "No available sponsors" : "Select a sponsor to add"}
                            </option>
                            {availableSponsors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </div>

                    <Label>Linked Sponsors</Label>
                    {linkedSponsors.length > 0 ? (
                        <div className="space-y-2">
                            {linkedSponsors.map(s => (
                                <div key={s.id} className="flex justify-between items-center bg-primary p-2 rounded">
                                    <span>{s.name}</span>
                                    <button type="button" onClick={() => handleRemoveSponsor(s.id)} className="text-red-500 hover:text-red-400 text-xs">REMOVE</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary">No sponsors linked to this tournament.</p>
                    )}
                </div>
            </fieldset>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Tournament'}</Button>
            </div>
        </form>
    );
};

export const TournamentsAdmin = () => {
    const { tournaments, addTournament, updateTournament, deleteTournament, sponsors, getSponsorsForTournament, updateSponsorsForTournament } = useSports();
    const [editing, setEditing] = useState<Tournament | Partial<Tournament> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSave = async (tournament: Tournament | Partial<Tournament>, sponsorIds: number[]) => {
        setError(null);
        setLoading(true);
        try {
            let savedTournament: Tournament;
            if ('id' in tournament && tournament.id) {
                savedTournament = await updateTournament(tournament as Tournament);
            } else {
                savedTournament = await addTournament(tournament as Omit<Tournament, 'id'>);
            }
            await updateSponsorsForTournament(savedTournament.id, sponsorIds);
            setEditing(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this tournament? This will also remove all its fixtures and sponsor links.')) {
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
                    <TournamentForm 
                        tournament={editing} 
                        onSave={handleSave} 
                        onCancel={() => { setEditing(null); setError(null); }} 
                        error={error} 
                        loading={loading}
                        sponsors={sponsors}
                        getSponsorsForTournament={getSponsorsForTournament}
                    />
                </FormModal>
            )}
        </AdminSection>
    );
};
