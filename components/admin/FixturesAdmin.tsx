import React, { useState, useEffect } from 'react';
import { useSports } from '../../context/SportsDataContext';
import type { Fixture, Team, Tournament, Score } from '../../types';
import { AdminSection, Button, Input, Select, Label, FormModal, ErrorMessage } from './AdminUI';

const ScoreUpdateModal: React.FC<{ fixture: Fixture, onSave: (f: Fixture) => Promise<void>, onClose: () => void }> = ({ fixture, onSave, onClose }) => {
    const { getTeamById } = useSports();
    const [scoreData, setScoreData] = useState<Score>(fixture.score || {
        team1Score: 0,
        team2Score: 0,
        sets: [{ team1Points: 0, team2Points: 0 }],
        resultMessage: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const team1 = getTeamById(fixture.team1Id);
    const team2 = getTeamById(fixture.team2Id);

    useEffect(() => {
        let t1SetsWon = 0;
        let t2SetsWon = 0;
        scoreData.sets.forEach(set => {
            if (set.team1Points > set.team2Points) t1SetsWon++;
            else if (set.team2Points > set.team1Points) t2SetsWon++;
        });
        setScoreData(prev => ({ ...prev, team1Score: t1SetsWon, team2Score: t2SetsWon }));
    }, [scoreData.sets]);

    const handleSetChange = (index: number, teamField: 'team1Points' | 'team2Points', value: string) => {
        const newSets = [...scoreData.sets];
        newSets[index] = { ...newSets[index], [teamField]: parseInt(value, 10) || 0 };
        setScoreData({ ...scoreData, sets: newSets });
    };

    const addSet = () => {
        setScoreData({ ...scoreData, sets: [...scoreData.sets, { team1Points: 0, team2Points: 0 }] });
    };
    
    const removeSet = (index: number) => {
        if (scoreData.sets.length > 1) {
            const newSets = scoreData.sets.filter((_, i) => i !== index);
            setScoreData({ ...scoreData, sets: newSets });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!team1 || !team2) return;
        setLoading(true);
        setError(null);
        try {
            const resultMessage = `${team1.name} won ${scoreData.team1Score}-${scoreData.team2Score}`;
            const finalScoreData = { ...scoreData, resultMessage };
            await onSave({ ...fixture, score: finalScoreData });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!team1 || !team2) return null;

    return (
        <FormModal title={`Update Score: ${team1.shortName} vs ${team2.shortName}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <ErrorMessage message={error} />}
                <div className="bg-accent p-4 rounded-lg text-center">
                    <p className="text-text-secondary">Final Score (Sets Won)</p>
                    <p className="text-3xl font-bold text-white">{scoreData.team1Score} - {scoreData.team2Score}</p>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {scoreData.sets.map((set, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Label>Set {index + 1}</Label>
                            <Input type="number" placeholder={team1.shortName} value={set.team1Points} onChange={(e) => handleSetChange(index, 'team1Points', e.target.value)} />
                             <span className="text-text-secondary">-</span>
                            <Input type="number" placeholder={team2.shortName} value={set.team2Points} onChange={(e) => handleSetChange(index, 'team2Points', e.target.value)} />
                             <button type="button" onClick={() => removeSet(index)} disabled={scoreData.sets.length <= 1} className="text-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                             </button>
                        </div>
                    ))}
                </div>
                <Button type="button" onClick={addSet} className="w-full bg-gray-600 hover:bg-gray-500">Add Set</Button>
                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Score'}</Button>
                </div>
            </form>
        </FormModal>
    );
};

const FixtureForm: React.FC<{ fixture: Fixture | Partial<Fixture>, onSave: (f: any) => void, onCancel: () => void, teams: Team[], tournaments: Tournament[], error: string | null, loading: boolean }> = ({ fixture, onSave, onCancel, teams, tournaments, error, loading }) => {
    const toInputDateTimeString = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    };
    
    const [formData, setFormData] = useState({
        status: 'upcoming',
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
                <Button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
            </div>
        </form>
    )
};

export const FixturesAdmin = () => {
    const { fixtures, teams, tournaments, addFixture, updateFixture, deleteFixture, getTeamById } = useSports();
    const [editing, setEditing] = useState<Fixture | Partial<Omit<Fixture, 'score'>> | null>(null);
    const [scoringFixture, setScoringFixture] = useState<Fixture | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const handleSave = async (fixture: Fixture) => {
        setError(null);
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };
    
    const handleScoreUpdate = async (fixtureWithScore: Fixture) => {
        await updateFixture(fixtureWithScore);
        setScoringFixture(null); // Close modal on success
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
                            <p className="font-bold">{getTeamById(f.team1Id)?.shortName || 'N/A'} vs {getTeamById(f.team2Id)?.shortName || 'N/A'}</p>
                            <span className="text-xs font-semibold uppercase">{f.status}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{new Date(f.dateTime).toLocaleString()}</p>
                        <div className="mt-2 text-right space-x-2">
                            <Button
                                onClick={() => setScoringFixture(f)}
                                className="bg-green-600 hover:bg-green-500 disabled:bg-gray-500"
                                disabled={f.status !== 'completed'}
                            >
                                Score
                            </Button>
                             <Button onClick={() => setEditing(f)} className="bg-blue-600 hover:bg-blue-500">Edit</Button>
                            <Button onClick={() => handleDelete(f.id)} className="bg-red-600 hover:bg-red-500">Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
             {editing && (
                <FormModal title={editing.id ? "Edit Fixture" : "Add Fixture"} onClose={() => { setEditing(null); setError(null); }}>
                    <FixtureForm fixture={editing} onSave={handleSave} onCancel={() => { setEditing(null); setError(null); }} teams={teams} tournaments={tournaments} error={error} loading={loading} />
                </FormModal>
            )}
            {scoringFixture && (
                <ScoreUpdateModal 
                    fixture={scoringFixture} 
                    onSave={handleScoreUpdate} 
                    onClose={() => setScoringFixture(null)} 
                />
            )}
        </AdminSection>
    );
};