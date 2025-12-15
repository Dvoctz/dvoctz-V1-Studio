
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { useSports, CsvTeam, CsvPlayer } from '../context/SportsDataContext';
import { useAuth } from '../context/AuthContext';
import type { Tournament, Team, Player, Fixture, Sponsor, Score, PlayerRole, UserRole, Club, PlayerTransfer, Notice, NoticeLevel } from '../types';
import { LiveScorerView } from './LiveScorerView';

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

const AddAwardForm: React.FC<{ tournamentId: number, players: Player[], onSuccess: () => void, onCancel: () => void, addTournamentAward: any }> = ({ tournamentId, players, onSuccess, onCancel, addTournamentAward }) => {
    const [awardName, setAwardName] = useState('');
    const [recipientType, setRecipientType] = useState<'player' | 'manual'>('player');
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
    const [manualName, setManualName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sortedPlayers = useMemo(() => [...players].sort((a,b) => a.name.localeCompare(b.name)), [players]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            if (recipientType === 'player') {
                const player = players.find(p => p.id === Number(selectedPlayerId));
                if (!player) throw new Error("Please select a player.");
                
                await addTournamentAward({
                    tournamentId,
                    awardName,
                    recipientName: player.name,
                    playerId: player.id,
                    imageUrl,
                    imageFile: file || undefined
                });
            } else {
                if (!manualName.trim()) throw new Error("Please enter recipient name(s).");
                
                // Bulk entry logic: split by comma or newline
                const names = manualName.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
                
                if (names.length === 0) throw new Error("Please enter at least one name.");

                const promises = names.map(name => addTournamentAward({
                    tournamentId,
                    awardName,
                    recipientName: name,
                    playerId: null,
                    imageUrl, // They share the same image (e.g. logo) if provided
                    imageFile: file || undefined
                }));

                await Promise.all(promises);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div>
                <Label>Award Name</Label>
                <Input value={awardName} onChange={e => setAwardName(e.target.value)} placeholder="e.g. Most Valuable Player" required />
            </div>
            
            <div>
                <Label>Recipient Type</Label>
                <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={recipientType === 'player'} onChange={() => setRecipientType('player')} className="text-highlight focus:ring-highlight" />
                        <span className="text-white">Registered Player</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={recipientType === 'manual'} onChange={() => setRecipientType('manual')} className="text-highlight focus:ring-highlight" />
                        <span className="text-white">External / Other (Bulk)</span>
                    </label>
                </div>
            </div>

            {recipientType === 'player' ? (
                <div>
                    <Label>Select Player</Label>
                    <Select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)}>
                        <option value="">-- Choose Player --</option>
                        {sortedPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                </div>
            ) : (
                <div>
                    <Label>Recipient Name(s)</Label>
                    <Textarea 
                        value={manualName} 
                        onChange={e => setManualName(e.target.value)} 
                        placeholder="Enter names separated by commas or new lines for bulk entry. e.g. John Doe, Jane Smith" 
                        rows={4}
                    />
                    <p className="text-xs text-text-secondary mt-1">Separate multiple names with commas (,) or new lines to create multiple awards at once.</p>
                </div>
            )}

            <ImageUploadOrUrl label="Award Image / Trophy Photo (Optional)" urlValue={imageUrl} onUrlChange={setImageUrl} onFileChange={setFile} />

            <div className="flex justify-end gap-2 pt-4">
                <Button onClick={onCancel} className="bg-gray-600">Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Award(s)'}</Button>
            </div>
        </form>
    );
};


const FixtureForm: React.FC<{ fixture: any, teams: Team[], tournaments: Tournament[], onSave: any, onCancel: any, error: any }> = ({ fixture, teams, tournaments, onSave, onCancel, error }) => {
    const { players } = useSports();
    const toLocalInputString = (dateStr: string) => { if (!dateStr) return ''; const date = new Date(dateStr); const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)); return localDate.toISOString().slice(0, 16); };
    const getNowLocalString = () => { const now = new Date(); const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)); return localDate.toISOString().slice(0, 16); };

    const [formData, setFormData] = useState({
        tournamentId: tournaments[0]?.id, team1Id: teams[0]?.id, team2Id: teams[1]?.id, ground: 'Main Court', status: 'upcoming', referee: '', score: { team1Score: 0, team2Score: 0, sets: [], resultMessage: '' }, manOfTheMatchId: null as number | null, stage: '', ...fixture, dateTime: fixture?.dateTime ? toLocalInputString(fixture.dateTime) : getNowLocalString()
    });
    const [refereeSelection, setRefereeSelection] = useState<string>(() => { const currentRef = fixture?.referee; if (!currentRef) return ''; const isKnownTeam = teams.some(t => t.name === currentRef); return isKnownTeam ? currentRef : '__manual__'; });

    const selectedTournament = useMemo(() => tournaments.find(t => t.id === Number(formData.tournamentId)), [tournaments, formData.tournamentId]);
    const availableTeams = useMemo(() => { if (!selectedTournament) return teams; return teams.filter(t => t.division === selectedTournament.division).sort((a, b) => a.name.localeCompare(b.name)); }, [teams, selectedTournament]);
    const eligiblePlayers = useMemo(() => { if (!formData.team1Id || !formData.team2Id) return []; return players.filter(p => p.teamId === formData.team1Id || p.teamId === formData.team2Id).sort((a, b) => a.name.localeCompare(b.name)); }, [players, formData.team1Id, formData.team2Id]);

    const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const newId = Number(e.target.value); const newTourney = tournaments.find(t => t.id === newId); let update: any = { tournamentId: newId }; if (newTourney) { const relevantTeams = teams.filter(t => t.division === newTourney.division).sort((a, b) => a.name.localeCompare(b.name)); const t1Exists = relevantTeams.find(t => t.id === formData.team1Id); const t2Exists = relevantTeams.find(t => t.id === formData.team2Id); if (!t1Exists && relevantTeams.length > 0) update.team1Id = relevantTeams[0].id; if (!t2Exists && relevantTeams.length > 1) update.team2Id = relevantTeams[1].id; else if (!t2Exists && relevantTeams.length > 0) update.team2Id = relevantTeams[0].id; } setFormData({ ...formData, ...update }); };
    const handleRefereeChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const val = e.target.value; setRefereeSelection(val); if (val === '__manual__') setFormData(prev => ({ ...prev, referee: prev.referee || '' })); else setFormData(prev => ({ ...prev, referee: val === '' ? '' : val })); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const localDate = new Date(formData.dateTime); const utcDate = localDate.toISOString(); onSave({ ...formData, dateTime: utcDate }); };

    const updateSet = (index: number, field: 'team1Points' | 'team2Points', value: string) => {
        const newSets: any[] = [...(formData.score?.sets || [])];
        if (!newSets[index]) newSets[index] = { team1Points: 0, team2Points: 0 };
        const currentSet = newSets[index];
        newSets[index] = { ...currentSet, [field]: Number(value) };
        if (field === 'team1Points' || field === 'team2Points') { if (newSets[index].team1Points !== newSets[index].team2Points) { delete newSets[index].winner; } }
        setFormData({ ...formData, score: { ...formData.score, sets: newSets } });
    };
    
    const setSetWinner = (index: number, winner: 'team1' | 'team2' | undefined) => { const newSets: any[] = [...(formData.score?.sets || [])]; if (!newSets[index]) newSets[index] = { team1Points: 0, team2Points: 0 }; if (winner) newSets[index].winner = winner; else delete newSets[index].winner; setFormData({ ...formData, score: { ...formData.score, sets: newSets } }); };
    const addSet = () => setFormData({ ...formData, score: { ...formData.score, sets: [...(formData.score?.sets || []), { team1Points: 0, team2Points: 0 }] } });
    const removeSet = (index: number) => { const newSets = [...(formData.score?.sets || [])]; newSets.splice(index, 1); setFormData({ ...formData, score: { ...formData.score, sets: newSets } }); };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div><Label>Tournament</Label><Select value={formData.tournamentId} onChange={handleTournamentChange}>{tournaments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.division})</option>)}</Select></div>
            <div><Label>Stage</Label><Select value={formData.stage || ''} onChange={e => setFormData({...formData, stage: e.target.value})}><option value="">League / Group Stage</option><option value="quarter-final">Quarter Final</option><option value="semi-final">Semi Final</option><option value="final">Final</option></Select></div>
            <div className="grid grid-cols-2 gap-2"><div><Label>Team 1</Label><Select value={formData.team1Id} onChange={e => setFormData({...formData, team1Id: Number(e.target.value)})}>{availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></div><div><Label>Team 2</Label><Select value={formData.team2Id} onChange={e => setFormData({...formData, team2Id: Number(e.target.value)})}>{availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></div></div>
            <div className="grid grid-cols-2 gap-2"><div><Label>Date</Label><Input type="datetime-local" value={formData.dateTime} onChange={e => setFormData({...formData, dateTime: e.target.value})} /></div><div><Label>Ground</Label><Input value={formData.ground} onChange={e => setFormData({...formData, ground: e.target.value})} /></div></div>
            <div><Label>Status</Label><Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option></Select></div>
            <div><Label>Referee</Label><Select value={refereeSelection} onChange={handleRefereeChange}><option value="">-- Select Team --</option>{teams.sort((a, b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}<option value="__manual__">Manual Entry</option></Select>{refereeSelection === '__manual__' && <Input placeholder="Referee Name" value={formData.referee || ''} onChange={e => setFormData({...formData, referee: e.target.value})} className="mt-2" />}</div>
            {formData.status === 'completed' && (<div className="border-t border-accent pt-4"><h4 className="font-bold text-white mb-2">Score Details</h4><div className="grid grid-cols-2 gap-2 mb-2"><div><Label>T1 Sets Won</Label><Input type="number" value={formData.score.team1Score} onChange={e => setFormData({...formData, score: {...formData.score, team1Score: Number(e.target.value)}})} /></div><div><Label>T2 Sets Won</Label><Input type="number" value={formData.score.team2Score} onChange={e => setFormData({...formData, score: {...formData.score, team2Score: Number(e.target.value)}})} /></div></div><div><Label>Result Message</Label><Input value={formData.score.resultMessage} onChange={e => setFormData({...formData, score: {...formData.score, resultMessage: e.target.value}})} placeholder="e.g. Team A won 2-1" /></div><div className="mt-2"><Label>Set Scores</Label>{formData.score.sets?.map((set: any, i: number) => (<div key={i} className="mb-2 p-2 border border-accent rounded bg-primary/30"><div className="flex gap-2 items-center"><span className="text-xs text-text-secondary w-6">S{i+1}</span><Input type="number" placeholder="T1" value={set.team1Points} onChange={e => updateSet(i, 'team1Points', e.target.value)} className="!mt-0" /><Input type="number" placeholder="T2" value={set.team2Points} onChange={e => updateSet(i, 'team2Points', e.target.value)} className="!mt-0" /><button type="button" onClick={() => removeSet(i)} className="text-red-500 font-bold px-2">x</button></div>{set.team1Points === set.team2Points && (<div className="flex items-center gap-2 mt-2 text-xs"><span className="text-text-secondary font-bold">Tie Game Winner:</span><button type="button" onClick={() => setSetWinner(i, set.winner === 'team1' ? undefined : 'team1')} className={`px-2 py-1 rounded ${set.winner === 'team1' ? 'bg-green-600 text-white' : 'bg-accent text-text-secondary'}`}>Team 1</button><button type="button" onClick={() => setSetWinner(i, set.winner === 'team2' ? undefined : 'team2')} className={`px-2 py-1 rounded ${set.winner === 'team2' ? 'bg-green-600 text-white' : 'bg-accent text-text-secondary'}`}>Team 2</button></div>)}</div>))}<Button onClick={addSet} className="bg-accent text-xs mt-2">Add Set</Button></div><div className="mt-4 border-t border-accent pt-4"><Label>Man of the Match</Label><Select value={formData.manOfTheMatchId ?? ''} onChange={e => setFormData({...formData, manOfTheMatchId: e.target.value ? Number(e.target.value) : null})}><option value="">-- Select Player --</option>{eligiblePlayers.map(p => { const teamName = teams.find(t => t.id === p.teamId)?.shortName || ''; return <option key={p.id} value={p.id}>{p.name} ({teamName})</option>; })}</Select></div></div>)}
            <div className="flex justify-end gap-2"><Button onClick={onCancel} className="bg-gray-600">Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

const SponsorsAdmin = () => {
    const { sponsors, addSponsor, updateSponsor, deleteSponsor, toggleSponsorShowInFooter } = useSports();
    const [editing, setEditing] = useState<Sponsor | Partial<Sponsor> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const handleSave = async (sponsor: any) => { setError(null); try { sponsor.id ? await updateSponsor(sponsor) : await addSponsor(sponsor); setEditing(null); } catch(e: any) { setError(e.message); } };
    const handleDelete = async (id: number) => { if(window.confirm('Delete sponsor?')) try { await deleteSponsor(id); } catch(e: any) { alert(e.message); } };

    return (
        <AdminSection title="Manage Sponsors">
            <div className="flex justify-end mb-4"><Button onClick={() => setEditing({})}>Add Sponsor</Button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sponsors.map(s => (
                    <div key={s.id} className="bg-accent p-3 rounded flex items-center justify-between">
                        <div className="flex items-center gap-2">{s.logoUrl ? <img src={s.logoUrl} className="w-8 h-8 object-contain bg-white rounded" alt="" /> : <div className="w-8 h-8 bg-primary rounded" />}<div><p className="font-bold">{s.name}</p><p className="text-xs text-text-secondary">{s.website}</p></div></div>
                        <div className="flex flex-col gap-1 items-end"><label className="text-xs flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={s.showInFooter} onChange={() => toggleSponsorShowInFooter(s)} /> Footer</label><div className="flex gap-1 mt-1"><Button onClick={() => setEditing(s)} className="bg-blue-600 text-xs px-2 py-1">Edit</Button><Button onClick={() => handleDelete(s.id)} className="bg-red-600 text-xs px-2 py-1">Del</Button></div></div>
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
            <ImageUploadOrUrl label="Logo" urlValue={formData.logoUrl || ''} onUrlChange={(val) => setFormData({...formData, logoUrl: val})} onFileChange={setFile} />
            <div className="flex justify-end gap-2"><Button onClick={onCancel} className="bg-gray-600">Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

const NoticesAdmin = () => {
    const { notices, addNotice, deleteNotice } = useSports();
    const [editing, setEditing] = useState<Partial<Notice> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const handleSave = async (notice: any) => { setError(null); try { await addNotice(notice); setEditing(null); } catch(e: any) { setError(e.message); } };
    const handleDelete = async (id: number) => { if(window.confirm('Delete notice?')) try { await deleteNotice(id); } catch(e: any) { alert(e.message); } };

    return (
        <AdminSection title="Manage Notices">
             <div className="flex justify-end mb-4"><Button onClick={() => setEditing({ level: 'Information', expiresAt: new Date(Date.now() + 86400000 * 7).toISOString().slice(0,10) })}>Add Notice</Button></div>
             <div className="space-y-2">{notices.map(n => (<div key={n.id} className="bg-accent p-3 rounded flex justify-between items-start"><div><p className="font-bold text-white"><span className={`text-xs px-1 rounded mr-2 ${n.level === 'Urgent' ? 'bg-red-500' : n.level === 'Warning' ? 'bg-yellow-500 text-black' : 'bg-blue-500'}`}>{n.level}</span>{n.title}</p><p className="text-sm text-text-primary">{n.message}</p><p className="text-xs text-text-secondary mt-1">Expires: {new Date(n.expiresAt).toLocaleDateString()}</p></div><Button onClick={() => handleDelete(n.id)} className="bg-red-600 text-xs px-2 py-1">Del</Button></div>))}</div>
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

const TournamentsAdmin = () => {
    const { tournaments, addTournament, updateTournament, deleteTournament, concludeLeaguePhase } = useSports();
    const [editing, setEditing] = useState<Tournament | Partial<Tournament> | null>(null);
    const [managingSponsorsFor, setManagingSponsorsFor] = useState<Tournament | null>(null);
    const [managingSquadsFor, setManagingSquadsFor] = useState<Tournament | null>(null);
    const [managingTeamsFor, setManagingTeamsFor] = useState<Tournament | null>(null);
    const [managingAwardsFor, setManagingAwardsFor] = useState<Tournament | null>(null);
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
                            <Button onClick={() => setManagingAwardsFor(t)} className="bg-yellow-600 hover:bg-yellow-500 text-xs">Awards</Button>
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
            {managingAwardsFor && <TournamentAwardsModal tournament={managingAwardsFor} onClose={() => setManagingAwardsFor(null)} />}
        </AdminSection>
    );
};

const TournamentForm: React.FC<{ tournament: any, onSave: any, onCancel: any, error: any }> = ({ tournament, onSave, onCancel, error }) => {
    // Default showChampionBanner to true if not present
    const [formData, setFormData] = useState({ 
        name: '', 
        division: 'Division 1', 
        showChampionBanner: true, 
        ...tournament 
    });
    
    return (
        <form onSubmit={e => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
            <div><Label>Division</Label><Select value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})}><option>Division 1</option><option>Division 2</option></Select></div>
            
             <div className="flex items-center gap-2 bg-primary p-3 rounded border border-accent">
                <input 
                    type="checkbox" 
                    id="showBanner"
                    checked={formData.showChampionBanner} 
                    onChange={e => setFormData({...formData, showChampionBanner: e.target.checked})}
                    className="h-5 w-5 text-highlight rounded focus:ring-highlight bg-secondary border-gray-600"
                />
                <label htmlFor="showBanner" className="text-white font-medium cursor-pointer">Show Champion Banner on Dashboard</label>
            </div>

            <div className="flex justify-end gap-2"><Button onClick={onCancel} className="bg-gray-600">Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

const TournamentAwardsModal: React.FC<{ tournament: Tournament, onClose: () => void }> = ({ tournament, onClose }) => {
    const { getAwardsByTournament, addTournamentAward, deleteTournamentAward, players } = useSports();
    const [awards, setAwards] = useState(getAwardsByTournament(tournament.id));
    const [isAdding, setIsAdding] = useState(false);
    
    useEffect(() => {
        setAwards(getAwardsByTournament(tournament.id));
    }, [getAwardsByTournament, tournament.id]);

    const handleDelete = async (id: number) => {
        if(window.confirm('Remove this award?')) {
            await deleteTournamentAward(id);
            setAwards(getAwardsByTournament(tournament.id));
        }
    };

    return (
        <FormModal title={`Awards: ${tournament.name}`} onClose={onClose}>
            {!isAdding ? (
                <>
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => setIsAdding(true)}>Add New Award</Button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {awards.length > 0 ? (
                            awards.map(award => (
                                <div key={award.id} className="bg-primary p-3 rounded flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        {award.imageUrl ? (
                                            <img src={award.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                                        ) : (
                                            <div className="w-10 h-10 bg-accent rounded flex items-center justify-center">🏆</div>
                                        )}
                                        <div>
                                            <p className="font-bold text-white">{award.awardName}</p>
                                            <p className="text-sm text-text-secondary">{award.recipientName}</p>
                                        </div>
                                    </div>
                                    <Button onClick={() => handleDelete(award.id)} className="bg-red-600 hover:bg-red-500 text-xs px-2 py-1">Delete</Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-text-secondary text-center py-4">No awards recorded yet.</p>
                        )}
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button onClick={onClose} className="bg-gray-600">Close</Button>
                    </div>
                </>
            ) : (
                <AddAwardForm 
                    tournamentId={tournament.id} 
                    players={players} 
                    onSuccess={() => { setIsAdding(false); setAwards(getAwardsByTournament(tournament.id)); }} 
                    onCancel={() => setIsAdding(false)} 
                    addTournamentAward={addTournamentAward}
                />
            )}
        </FormModal>
    );
};

const TournamentSponsorsModal: React.FC<{ tournament: Tournament, onClose: () => void }> = ({ tournament, onClose }) => {
    const { sponsors, tournamentSponsors, updateSponsorsForTournament } = useSports();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        const current = tournamentSponsors.filter(ts => ts.tournament_id === tournament.id).map(ts => ts.sponsor_id);
        setSelectedIds(current);
    }, [tournamentSponsors, tournament.id]);

    const handleToggle = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSave = async () => {
        await updateSponsorsForTournament(tournament.id, selectedIds);
        onClose();
    };

    return (
        <FormModal title={`Sponsors for ${tournament.name}`} onClose={onClose}>
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                {sponsors.map(s => (
                    <label key={s.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer">
                        <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => handleToggle(s.id)} className="rounded text-highlight focus:ring-highlight" />
                        <span className="text-white">{s.name}</span>
                    </label>
                ))}
            </div>
            <div className="flex justify-end gap-2">
                <Button onClick={onClose} className="bg-gray-600">Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>
        </FormModal>
    );
};

const TournamentTeamsModal: React.FC<{ tournament: Tournament, onClose: () => void }> = ({ tournament, onClose }) => {
    const { teams, tournamentTeams, updateTournamentTeams } = useSports();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        const current = tournamentTeams.filter(tt => tt.tournamentId === tournament.id).map(tt => tt.teamId);
        setSelectedIds(current);
    }, [tournamentTeams, tournament.id]);

    const relevantTeams = useMemo(() => teams.filter(t => t.division === tournament.division), [teams, tournament.division]);

    const handleToggle = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
    
    const handleSelectAll = () => {
        if (selectedIds.length === relevantTeams.length) setSelectedIds([]);
        else setSelectedIds(relevantTeams.map(t => t.id));
    };

    const handleSave = async () => {
        await updateTournamentTeams(tournament.id, selectedIds);
        onClose();
    };

    return (
        <FormModal title={`Teams in ${tournament.name}`} onClose={onClose}>
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-text-secondary">{selectedIds.length} selected</span>
                <button onClick={handleSelectAll} className="text-xs text-highlight hover:underline">Select All / None</button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                {relevantTeams.map(t => (
                    <label key={t.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer">
                        <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => handleToggle(t.id)} className="rounded text-highlight focus:ring-highlight" />
                        <span className="text-white">{t.name}</span>
                    </label>
                ))}
            </div>
            <div className="flex justify-end gap-2">
                <Button onClick={onClose} className="bg-gray-600">Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>
        </FormModal>
    );
}

const TournamentSquadsModal: React.FC<{ tournament: Tournament, onClose: () => void }> = ({ tournament, onClose }) => {
    const { teams, players, tournamentRosters, updateTournamentSquad } = useSports();
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
    
    const divTeams = useMemo(() => teams.filter(t => t.division === tournament.division), [teams, tournament.division]);

    useEffect(() => {
        if (selectedTeamId) {
            const currentRoster = tournamentRosters
                .filter(tr => tr.tournamentId === tournament.id && tr.teamId === selectedTeamId)
                .map(tr => tr.playerId);
            
            if (currentRoster.length === 0) {
                 const teamPlayers = players.filter(p => p.teamId === selectedTeamId).map(p => p.id);
                 setSelectedPlayerIds(teamPlayers);
            } else {
                setSelectedPlayerIds(currentRoster);
            }
        }
    }, [selectedTeamId, tournament.id, tournamentRosters, players]);

    const handleToggle = (id: number) => {
        setSelectedPlayerIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSave = async () => {
        if (selectedTeamId) {
            await updateTournamentSquad(tournament.id, selectedTeamId, selectedPlayerIds);
            alert('Squad updated!');
        }
    };
    
    const availablePlayers = useMemo(() => {
        if (!selectedTeamId) return [];
        return players.filter(p => p.teamId === selectedTeamId || selectedPlayerIds.includes(p.id)).sort((a,b) => a.name.localeCompare(b.name));
    }, [players, selectedTeamId, selectedPlayerIds]);

    return (
        <FormModal title={`Squads for ${tournament.name}`} onClose={onClose}>
            <div className="mb-4">
                <Label>Select Team</Label>
                <Select value={selectedTeamId || ''} onChange={e => setSelectedTeamId(Number(e.target.value))}>
                    <option value="">-- Choose Team --</option>
                    {divTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
            </div>
            
            {selectedTeamId && (
                <>
                    <div className="flex justify-between items-center mb-2">
                        <Label>Select Players for Squad</Label>
                         <span className="text-xs text-text-secondary">{selectedPlayerIds.length} selected</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto mb-4 border border-accent rounded p-2">
                        {availablePlayers.map(p => (
                            <label key={p.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer">
                                <input type="checkbox" checked={selectedPlayerIds.includes(p.id)} onChange={() => handleToggle(p.id)} className="rounded text-highlight focus:ring-highlight" />
                                <span className="text-white">{p.name}</span>
                                <span className="text-xs text-text-secondary">({p.role})</span>
                            </label>
                        ))}
                         {availablePlayers.length === 0 && <p className="text-text-secondary text-sm text-center">No players found for this team.</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                         <Button onClick={handleSave}>Save Squad</Button>
                    </div>
                </>
            )}
            
            <div className="flex justify-end mt-4 pt-4 border-t border-accent">
                <Button onClick={onClose} className="bg-gray-600">Close</Button>
            </div>
        </FormModal>
    );
}

const ClubsAdmin = () => {
    const { clubs, addClub, updateClub, deleteClub } = useSports();
    const [editing, setEditing] = useState<Club | Partial<Club> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const handleSave = async (club: any) => { setError(null); try { club.id ? await updateClub(club) : await addClub(club); setEditing(null); } catch(e: any) { setError(e.message); } };
    const handleDelete = async (id: number) => { if(window.confirm('Delete club?')) try { await deleteClub(id); } catch(e: any) { alert(e.message); } };
    return (
        <AdminSection title="Manage Clubs">
            <div className="flex justify-end mb-4"><Button onClick={() => setEditing({})}>Add Club</Button></div>
            <div className="grid grid-cols-2 gap-4">{clubs.map(c => (<div key={c.id} className="bg-accent p-3 rounded flex justify-between items-center"><span>{c.name}</span><div><Button onClick={() => setEditing(c)} className="mr-2 text-xs">Edit</Button><Button onClick={() => handleDelete(c.id)} className="bg-red-600 text-xs">Del</Button></div></div>))}</div>
            {editing && <FormModal title={editing.id ? "Edit Club" : "Add Club"} onClose={() => setEditing(null)}><ClubForm club={editing} onSave={handleSave} onCancel={() => setEditing(null)} error={error} /></FormModal>}
        </AdminSection>
    );
}
const ClubForm = ({ club, onSave, onCancel, error }: any) => {
    const [formData, setFormData] = useState({ name: '', logoUrl: '', ...club });
    const [file, setFile] = useState<File | null>(null);
    return (<form onSubmit={e => { e.preventDefault(); onSave({ ...formData, logoFile: file }); }} className="space-y-4">{error && <ErrorMessage message={error} />}<div><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div><ImageUploadOrUrl label="Logo" urlValue={formData.logoUrl} onUrlChange={v => setFormData({...formData, logoUrl: v})} onFileChange={setFile} /><div className="flex justify-end gap-2"><Button onClick={onCancel} className="bg-gray-600">Cancel</Button><Button type="submit">Save</Button></div></form>);
}

const TeamsAdmin = () => {
    const { teams, addTeam, updateTeam, deleteTeam, clubs, bulkAddOrUpdateTeams } = useSports();
    const [editing, setEditing] = useState<Team | Partial<Team> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const handleSave = async (team: any) => { setError(null); try { team.id ? await updateTeam(team) : await addTeam(team); setEditing(null); } catch(e: any) { setError(e.message); } };
    const handleDelete = async (id: number) => { if(window.confirm('Delete team?')) try { await deleteTeam(id); } catch(e: any) { alert(e.message); } };
    
    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        Papa.parse(file, {
            header: true, skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const csvTeams: CsvTeam[] = results.data.map((row: any) => ({ name: row.name, shortName: row.shortName || row.name.substring(0,3).toUpperCase(), division: row.division || 'Division 1', logoUrl: row.logoUrl || '', clubName: row.clubName }));
                    await bulkAddOrUpdateTeams(csvTeams); alert('Teams imported successfully!');
                } catch(e: any) { alert('Import failed: ' + e.message); }
            }
        });
    };

    return (
        <AdminSection title="Manage Teams">
            <div className="flex justify-between mb-4"><div className="text-sm"><Label>Bulk Import CSV</Label><input type="file" accept=".csv" onChange={handleCsvUpload} className="text-text-secondary" /></div><Button onClick={() => setEditing({})}>Add Team</Button></div>
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">{teams.map(t => (<div key={t.id} className="bg-accent p-3 rounded flex justify-between items-center"><div><p className="font-bold">{t.name}</p><p className="text-xs">{t.division}</p></div><div><Button onClick={() => setEditing(t)} className="mr-2 text-xs">Edit</Button><Button onClick={() => handleDelete(t.id)} className="bg-red-600 text-xs">Del</Button></div></div>))}</div>
            {editing && <FormModal title={editing.id ? "Edit Team" : "Add Team"} onClose={() => setEditing(null)}><TeamForm team={editing} clubs={clubs} onSave={handleSave} onCancel={() => setEditing(null)} error={error} /></FormModal>}
        </AdminSection>
    );
}
const TeamForm = ({ team, clubs, onSave, onCancel, error }: any) => {
    const [formData, setFormData] = useState({ name: '', shortName: '', division: 'Division 1', clubId: clubs[0]?.id, logoUrl: '', ...team });
    const [file, setFile] = useState<File | null>(null);
    return (<form onSubmit={e => { e.preventDefault(); onSave({ ...formData, logoFile: file }); }} className="space-y-4">{error && <ErrorMessage message={error} />}<div><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div><div><Label>Short Name</Label><Input value={formData.shortName} onChange={e => setFormData({...formData, shortName: e.target.value})} required /></div><div><Label>Division</Label><Select value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})}><option>Division 1</option><option>Division 2</option></Select></div><div><Label>Club</Label><Select value={formData.clubId} onChange={e => setFormData({...formData, clubId: Number(e.target.value)})}>{clubs.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div><ImageUploadOrUrl label="Logo" urlValue={formData.logoUrl} onUrlChange={v => setFormData({...formData, logoUrl: v})} onFileChange={setFile} /><div className="flex justify-end gap-2"><Button onClick={onCancel} className="bg-gray-600">Cancel</Button><Button type="submit">Save</Button></div></form>);
}

const PlayersAdmin = () => {
    const { players, addPlayer, updatePlayer, deletePlayer, deleteAllPlayers, teams, clubs, bulkAddOrUpdatePlayers } = useSports();
    const [editing, setEditing] = useState<Player | Partial<Player> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const handleSave = async (player: any) => { setError(null); try { player.id ? await updatePlayer(player) : await addPlayer(player); setEditing(null); } catch(e: any) { setError(e.message); } };
    const handleDelete = async (id: number) => { if(window.confirm('Delete player?')) try { await deletePlayer(id); } catch(e: any) { alert(e.message); } };
    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        Papa.parse(file, { header: true, skipEmptyLines: true, complete: async (results) => { try { await bulkAddOrUpdatePlayers(results.data as any); alert('Players imported!'); } catch(e: any) { alert('Import failed: ' + e.message); } } });
    };

    const filtered = players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <AdminSection title="Manage Players">
            <div className="flex justify-between mb-4 flex-wrap gap-4"><div className="text-sm"><Label>Bulk Import CSV</Label><input type="file" accept=".csv" onChange={handleCsvUpload} className="text-text-secondary" /></div><div className="flex gap-2"><Button onClick={() => { if(window.confirm('Delete ALL players? This cannot be undone.')) deleteAllPlayers(); }} className="bg-red-800">Delete All</Button><Button onClick={() => setEditing({})}>Add Player</Button></div></div>
            <Input placeholder="Search players..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mb-4" />
            <div className="space-y-2 max-h-96 overflow-y-auto">{filtered.map(p => (<div key={p.id} className="bg-accent p-3 rounded flex justify-between items-center"><div><p className="font-bold">{p.name}</p><p className="text-xs text-text-secondary">{p.role}</p></div><div><Button onClick={() => setEditing(p)} className="mr-2 text-xs">Edit</Button><Button onClick={() => handleDelete(p.id)} className="bg-red-600 text-xs">Del</Button></div></div>))}</div>
            {editing && <FormModal title={editing.id ? "Edit Player" : "Add Player"} onClose={() => setEditing(null)}><PlayerForm player={editing} teams={teams} clubs={clubs} onSave={handleSave} onCancel={() => setEditing(null)} error={error} /></FormModal>}
        </AdminSection>
    );
}
const PlayerForm = ({ player, teams, clubs, onSave, onCancel, error }: any) => {
    // Helper to format ISO date to YYYY-MM-DD
    const toInputDate = (isoString?: string) => {
        if (!isoString) return '';
        return isoString.split('T')[0];
    };

    const [formData, setFormData] = useState({ 
        name: '', 
        role: 'Main Netty', 
        teamId: '' as string | number, 
        clubId: clubs[0]?.id, 
        photoUrl: '', 
        joinedAt: player?.joinedAt || new Date().toISOString(), // Initialize with existing or now
        stats: { matches: 0, aces: 0, kills: 0, blocks: 0 }, 
        ...player 
    });
    const [file, setFile] = useState<File | null>(null);

    return (
        <form onSubmit={e => { 
            e.preventDefault(); 
            onSave({ 
                ...formData, 
                teamId: formData.teamId ? Number(formData.teamId) : null, 
                clubId: Number(formData.clubId), 
                photoFile: file 
            }); 
        }} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div>
                <Label>Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            
            <div>
                <Label>Role</Label>
                <Select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    {['Main Netty', 'Left Front', 'Right Front', 'Net Center', 'Back Center', 'Left Back', 'Right Back', 'Right Netty', 'Left Netty', 'Service Man'].map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
            </div>
            
            <div>
                <Label>Joining Date (Registration)</Label>
                <Input 
                    type="date" 
                    value={toInputDate(formData.joinedAt)} 
                    onChange={e => {
                        // Create a date object from input value, ensuring it's treated as local time then converted to ISO
                        // Or simply append a time to make it a valid ISO string
                        const dateVal = e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString();
                        setFormData({...formData, joinedAt: dateVal});
                    }} 
                />
            </div>

            <div>
                <Label>Club</Label>
                <Select value={formData.clubId} onChange={e => setFormData({...formData, clubId: e.target.value})}>
                    {clubs.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
            </div>
            
            <div>
                <Label>Team</Label>
                <Select value={formData.teamId} onChange={e => setFormData({...formData, teamId: e.target.value})}>
                    <option value="">-- Unassigned (Club Pool) --</option>
                    {teams.filter((t: any) => t.clubId == formData.clubId).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
            </div>
            
            <ImageUploadOrUrl label="Photo" urlValue={formData.photoUrl} onUrlChange={v => setFormData({...formData, photoUrl: v})} onFileChange={setFile} />
            
            <div className="grid grid-cols-4 gap-2">
                <div><Label>Matches</Label><Input type="number" value={formData.stats.matches} onChange={e => setFormData({...formData, stats: {...formData.stats, matches: Number(e.target.value)}})} /></div>
                <div><Label>Aces</Label><Input type="number" value={formData.stats.aces} onChange={e => setFormData({...formData, stats: {...formData.stats, aces: Number(e.target.value)}})} /></div>
                <div><Label>Kills</Label><Input type="number" value={formData.stats.kills} onChange={e => setFormData({...formData, stats: {...formData.stats, kills: Number(e.target.value)}})} /></div>
                <div><Label>Blocks</Label><Input type="number" value={formData.stats.blocks} onChange={e => setFormData({...formData, stats: {...formData.stats, blocks: Number(e.target.value)}})} /></div>
            </div>
            
            <div className="flex justify-end gap-2">
                <Button onClick={onCancel} className="bg-gray-600">Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
}

const TransfersAdmin = () => {
    const { playerTransfers, addPlayerTransfer, updatePlayerTransfer, deletePlayerTransfer, players, teams } = useSports();
    const [editing, setEditing] = useState<PlayerTransfer | Partial<PlayerTransfer> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const handleSave = async (transfer: any) => { setError(null); try { transfer.id ? await updatePlayerTransfer(transfer) : await addPlayerTransfer(transfer); setEditing(null); } catch(e: any) { setError(e.message); } };
    const handleDelete = async (id: number) => { if(window.confirm('Delete transfer?')) try { await deletePlayerTransfer(id); } catch(e: any) { alert(e.message); } };
    return (
        <AdminSection title="Manage Transfers">
            <div className="flex justify-end mb-4"><Button onClick={() => setEditing({})}>Record Transfer</Button></div>
            <div className="space-y-2 max-h-96 overflow-y-auto">{playerTransfers.map(t => { const p = players.find(pl => pl.id === t.playerId); return (<div key={t.id} className="bg-accent p-3 rounded flex justify-between items-center"><div><p className="font-bold">{p?.name || 'Unknown'}</p><p className="text-xs">{t.transferDate}</p></div><div><Button onClick={() => setEditing(t)} className="mr-2 text-xs">Edit</Button><Button onClick={() => handleDelete(t.id)} className="bg-red-600 text-xs">Del</Button></div></div>)})}</div>
            {editing && <FormModal title={editing.id ? "Edit Transfer" : "Record Transfer"} onClose={() => setEditing(null)}><TransferForm transfer={editing} players={players} teams={teams} onSave={handleSave} onCancel={() => setEditing(null)} error={error} /></FormModal>}
        </AdminSection>
    );
}
const TransferForm = ({ transfer, players, teams, onSave, onCancel, error }: any) => {
    const { getTransfersByPlayerId } = useSports();
    const [formData, setFormData] = useState({ 
        playerId: players[0]?.id, 
        fromTeamId: '' as string | number, 
        toTeamId: '' as string | number, 
        transferDate: new Date().toISOString().slice(0,10), 
        notes: '', 
        forceOverride: false,
        ...transfer 
    });
    
    // Eligibility State
    const [validationStatus, setValidationStatus] = useState<{ status: 'allowed' | 'blocked' | 'internal', message?: string }>({ status: 'allowed' });

    // Derive clubs from selected teams
    const getClubIdForTeam = (teamId: string | number) => {
        const team = teams.find((t: any) => t.id === Number(teamId));
        return team ? team.clubId : null;
    }

    const fromClubId = getClubIdForTeam(formData.fromTeamId);
    const toClubId = getClubIdForTeam(formData.toTeamId);

    // Effect to run validation when selections change
    useEffect(() => {
        // Reset if basic info missing
        if (!formData.playerId || !formData.toTeamId) {
            setValidationStatus({ status: 'allowed' });
            return;
        }

        // 1. Check for Internal Movement
        if (fromClubId && toClubId && fromClubId === toClubId) {
            setValidationStatus({ 
                status: 'internal', 
                message: 'Internal club movement. No waiting period required.' 
            });
            return;
        }

        // 2. External Transfer Logic
        // Get player history
        const history = getTransfersByPlayerId(Number(formData.playerId));
        // Filter history for only external transfers (where fromClub != toClub)
        // Note: For historical data without club IDs, we assume external if we can't prove internal, 
        // but better to rely on what we have. If club IDs missing in history, we might fallback to timestamps.
        const externalTransfers = history.filter(t => {
             // If we have explicit club IDs in history (after update), use them
             if (t.fromClubId && t.toClubId) return t.fromClubId !== t.toClubId;
             // Fallback: assume all historical records might be transfers if not marked otherwise
             return true; 
        });

        const player = players.find((p: any) => p.id === Number(formData.playerId));
        const now = new Date();
        let eligibilityDate: Date;
        let reason = "";

        if (externalTransfers.length === 0) {
            // First Transfer Rule: 6 months from joinedAt
            const joinedDate = player?.joinedAt ? new Date(player.joinedAt) : new Date(0); // Default to long ago if unknown
            eligibilityDate = new Date(joinedDate);
            eligibilityDate.setMonth(eligibilityDate.getMonth() + 6);
            reason = "First transfer requires 6 months from registration.";
        } else {
            // Subsequent Transfer Rule: 1 year from last external transfer
            // Sort history desc
            const lastTransfer = externalTransfers[0]; // Already sorted in getTransfersByPlayerId
            const lastDate = new Date(lastTransfer.transferDate);
            eligibilityDate = new Date(lastDate);
            eligibilityDate.setFullYear(eligibilityDate.getFullYear() + 1);
            reason = "Subsequent transfers require 1 year from last club transfer.";
        }

        if (now < eligibilityDate) {
            setValidationStatus({
                status: 'blocked',
                message: `Restricted: ${reason} Eligible on ${eligibilityDate.toLocaleDateString()}.`
            });
        } else {
            setValidationStatus({ status: 'allowed' });
        }

    }, [formData.playerId, formData.fromTeamId, formData.toTeamId, fromClubId, toClubId, getTransfersByPlayerId, players]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prevent submission if blocked and not overridden
        if (validationStatus.status === 'blocked' && !formData.forceOverride) {
            return; // UI disables button, but just in case
        }

        onSave({ 
            ...formData, 
            fromTeamId: formData.fromTeamId ? Number(formData.fromTeamId) : null, 
            toTeamId: formData.toTeamId ? Number(formData.toTeamId) : null,
            // Include derived club IDs for the record
            fromClubId,
            toClubId
        }); 
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            
            <div>
                <Label>Player</Label>
                <Select value={formData.playerId} onChange={e => setFormData({...formData, playerId: Number(e.target.value)})}>
                    {players.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label>From Team</Label>
                    <Select value={formData.fromTeamId} onChange={e => setFormData({...formData, fromTeamId: e.target.value})}>
                        <option value="">Free Agent</option>
                        {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                </div>
                <div>
                    <Label>To Team</Label>
                    <Select value={formData.toTeamId} onChange={e => setFormData({...formData, toTeamId: e.target.value})}>
                        <option value="">Free Agent</option>
                        {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                </div>
            </div>

            {/* Validation Feedback */}
            {formData.toTeamId && (
                <div className={`p-3 rounded-md text-sm border ${
                    validationStatus.status === 'internal' ? 'bg-green-900/30 border-green-700 text-green-200' :
                    validationStatus.status === 'blocked' ? 'bg-red-900/30 border-red-700 text-red-200' :
                    'bg-gray-800 border-gray-700 text-gray-400'
                }`}>
                    {validationStatus.status === 'internal' && <span className="font-bold block mb-1">✅ Internal Movement</span>}
                    {validationStatus.status === 'blocked' && <span className="font-bold block mb-1">🚫 Transfer Restricted</span>}
                    {validationStatus.message || "Standard transfer checks apply."}
                </div>
            )}

            {validationStatus.status === 'blocked' && (
                <div className="flex items-center gap-2 mt-2 bg-red-900/20 p-2 rounded">
                    <input 
                        type="checkbox" 
                        id="override" 
                        checked={formData.forceOverride}
                        onChange={e => setFormData({...formData, forceOverride: e.target.checked})}
                        className="rounded text-red-500 focus:ring-red-500"
                    />
                    <label htmlFor="override" className="text-sm text-red-200 font-bold cursor-pointer">
                        Admin Override (Force Transfer)
                    </label>
                </div>
            )}

            <div><Label>Date</Label><Input type="date" value={formData.transferDate} onChange={e => setFormData({...formData, transferDate: e.target.value})} /></div>
            <div><Label>Notes</Label><Input value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            
            <div className="flex justify-end gap-2">
                <Button onClick={onCancel} className="bg-gray-600">Cancel</Button>
                <Button 
                    type="submit" 
                    disabled={validationStatus.status === 'blocked' && !formData.forceOverride}
                    className={validationStatus.status === 'blocked' && !formData.forceOverride ? 'opacity-50 cursor-not-allowed' : ''}
                >
                    Save
                </Button>
            </div>
        </form>
    );
}

const FixturesAdmin = () => {
    const { fixtures, addFixture, updateFixture, deleteFixture, teams, tournaments } = useSports();
    const [editing, setEditing] = useState<Fixture | Partial<Fixture> | null>(null);
    const [filterTourney, setFilterTourney] = useState<string>('all');
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (fixture: any) => { setError(null); try { fixture.id ? await updateFixture(fixture) : await addFixture(fixture); setEditing(null); } catch(e: any) { setError(e.message); } };
    const handleDelete = async (id: number) => { if(window.confirm('Delete fixture?')) try { await deleteFixture(id); } catch(e: any) { alert(e.message); } };
    
    const filtered = fixtures.filter(f => filterTourney === 'all' || f.tournamentId === Number(filterTourney)).sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    return (
        <AdminSection title="Manage Fixtures">
            <div className="flex justify-between mb-4"><Select value={filterTourney} onChange={e => setFilterTourney(e.target.value)} className="!w-48 !mt-0"><option value="all">All Tournaments</option>{tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select><Button onClick={() => setEditing({})}>Add Fixture</Button></div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">{filtered.map(f => { const t1 = teams.find(t => t.id === f.team1Id); const t2 = teams.find(t => t.id === f.team2Id); return (<div key={f.id} className="bg-accent p-3 rounded flex justify-between items-center text-sm"><div><p className="font-bold text-white">{t1?.name} vs {t2?.name}</p><p className="text-text-secondary">{new Date(f.dateTime).toLocaleString()} - {f.status}</p></div><div><Button onClick={() => setEditing(f)} className="mr-2 text-xs">Edit</Button><Button onClick={() => handleDelete(f.id)} className="bg-red-600 text-xs">Del</Button></div></div>); })}</div>
            {editing && <FormModal title={editing.id ? "Edit Fixture" : "Add Fixture"} onClose={() => setEditing(null)}><FixtureForm fixture={editing} teams={teams} tournaments={tournaments} onSave={handleSave} onCancel={() => setEditing(null)} error={error} /></FormModal>}
        </AdminSection>
    );
}

export const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('tournaments');
    const [liveScorerMode, setLiveScorerMode] = useState(false);
    const { userProfile } = useAuth();
    
    const isEditor = userProfile?.role === 'content_editor';
    const isFixtureManager = userProfile?.role === 'fixture_manager';
    const isTeamManager = userProfile?.role === 'team_manager';
    const isAdmin = userProfile?.role === 'admin';

    if (liveScorerMode) {
        return <LiveScorerView onExit={() => setLiveScorerMode(false)} />;
    }

    return (
        <div className="max-w-6xl mx-auto pb-10">
            <h1 className="text-4xl font-extrabold mb-8 text-center">Admin Panel</h1>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {(isAdmin || isFixtureManager) && <Button onClick={() => setActiveTab('tournaments')} className={activeTab === 'tournaments' ? 'bg-teal-600' : 'bg-secondary'}>Tournaments</Button>}
                {(isAdmin || isFixtureManager) && <Button onClick={() => setActiveTab('fixtures')} className={activeTab === 'fixtures' ? 'bg-teal-600' : 'bg-secondary'}>Fixtures</Button>}
                {(isAdmin || isTeamManager) && <Button onClick={() => setActiveTab('clubs')} className={activeTab === 'clubs' ? 'bg-teal-600' : 'bg-secondary'}>Clubs</Button>}
                {(isAdmin || isTeamManager) && <Button onClick={() => setActiveTab('teams')} className={activeTab === 'teams' ? 'bg-teal-600' : 'bg-secondary'}>Teams</Button>}
                {(isAdmin || isTeamManager) && <Button onClick={() => setActiveTab('players')} className={activeTab === 'players' ? 'bg-teal-600' : 'bg-secondary'}>Players</Button>}
                {(isAdmin || isTeamManager) && <Button onClick={() => setActiveTab('transfers')} className={activeTab === 'transfers' ? 'bg-teal-600' : 'bg-secondary'}>Transfers</Button>}
                {(isAdmin || isEditor) && <Button onClick={() => setActiveTab('sponsors')} className={activeTab === 'sponsors' ? 'bg-teal-600' : 'bg-secondary'}>Sponsors</Button>}
                {(isAdmin || isEditor) && <Button onClick={() => setActiveTab('notices')} className={activeTab === 'notices' ? 'bg-teal-600' : 'bg-secondary'}>Notices</Button>}
                
                {(isAdmin || isFixtureManager) && (
                    <Button 
                        onClick={() => setLiveScorerMode(true)} 
                        className="bg-red-600 hover:bg-red-500 animate-pulse ml-4 font-bold border-2 border-white"
                    >
                        LIVE SCORER MODE
                    </Button>
                )}
            </div>

            {activeTab === 'tournaments' && (isAdmin || isFixtureManager) && <TournamentsAdmin />}
            {activeTab === 'fixtures' && (isAdmin || isFixtureManager) && <FixturesAdmin />}
            {activeTab === 'clubs' && (isAdmin || isTeamManager) && <ClubsAdmin />}
            {activeTab === 'teams' && (isAdmin || isTeamManager) && <TeamsAdmin />}
            {activeTab === 'players' && (isAdmin || isTeamManager) && <PlayersAdmin />}
            {activeTab === 'transfers' && (isAdmin || isTeamManager) && <TransfersAdmin />}
            {activeTab === 'sponsors' && (isAdmin || isEditor) && <SponsorsAdmin />}
            {activeTab === 'notices' && (isAdmin || isEditor) && <NoticesAdmin />}
        </div>
    );
};