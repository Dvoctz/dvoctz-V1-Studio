import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { useSports, CsvTeam, CsvPlayer } from '../context/SportsDataContext';
import { useAuth } from '../context/AuthContext';
import type { Tournament, Team, Player, Fixture, Sponsor, Score, PlayerRole, UserRole, Club, PlayerTransfer, Notice, NoticeLevel } from '../types';

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

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`w-full bg-primary mt-1 p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight ${className || ''}`} />
);


const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props} className="w-full bg-primary mt-1 p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight disabled:bg-gray-800 disabled:cursor-not-allowed" />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className={`w-full bg-primary mt-1 p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight ${props.className || ''}`} />
);


// FIX: Updated the Label component to accept a `className` prop to resolve the type error.
const Label: React.FC<{ children: React.ReactNode; htmlFor?: string; className?: string; }> = ({ children, htmlFor, className }) => (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-text-secondary ${className || ''}`.trim()}>{children}</label>
);

const FormModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-accent flex justify-between items-center">
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

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md mb-4 text-sm">
        <strong>Error:</strong> {message}
    </div>
);

// Admin Panels for each section

// Tournaments
const TournamentsAdmin = () => {
    const { tournaments, addTournament, updateTournament, deleteTournament, fixtures, concludeLeaguePhase } = useSports();
    const [editing, setEditing] = useState<Tournament | Partial<Tournament> | null>(null);
    const [managingSponsorsFor, setManagingSponsorsFor] = useState<Tournament | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isConcluding, setIsConcluding] = useState<number | null>(null);
    const [managingDrawFor, setManagingDrawFor] = useState<Tournament | null>(null);
    const [managingFinalFor, setManagingFinalFor] = useState<Tournament | null>(null);

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
    
    const handleConclude = async (id: number) => {
        setIsConcluding(id);
        setError(null);
        if (window.confirm('Are you sure you want to conclude the league phase? This will generate knockout fixtures and cannot be undone.')) {
            try {
                await concludeLeaguePhase(id);
            } catch (err: any) {
                alert(`Failed to conclude phase: ${err.message}`);
            }
        }
        setIsConcluding(null);
    };

    const canManageDraw = (tournament: Tournament): boolean => {
        if (tournament.division !== 'Division 1' || tournament.phase !== 'knockout') return false;
        const quarterFinals = fixtures.filter(f => f.tournamentId === tournament.id && f.stage === 'quarter-final');
        const semis = fixtures.filter(f => f.tournamentId === tournament.id && f.stage === 'semi-final');
        if (quarterFinals.length !== 4 || semis.length > 0) return false;
        return quarterFinals.every(f => f.status === 'completed');
    };

    const canManageFinal = (tournament: Tournament): boolean => {
        if (tournament.phase !== 'knockout') return false;
        const semis = fixtures.filter(f => f.tournamentId === tournament.id && f.stage === 'semi-final');
        if (semis.length !== 2) return false;
        if (!semis.every(f => f.status === 'completed')) return false;
        const final = fixtures.find(f => f.tournamentId === tournament.id && f.stage === 'final');
        if (final) return false;
        return true;
    };


    const filteredTournaments = useMemo(() => tournaments.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())), [tournaments, searchTerm]);

    return (
        <AdminSection title="Manage Tournaments">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div className="relative w-full sm:w-auto sm:max-w-xs flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    </span>
                    <Input
                        type="text"
                        placeholder="Search tournaments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 !mt-0"
                    />
                </div>
                <Button onClick={() => setEditing({})}>Add New Tournament</Button>
            </div>
            <div className="mt-4 space-y-2">
                {filteredTournaments.length > 0 ? filteredTournaments.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-accent rounded-md">
                        <div>
                            <p className="font-bold">{t.name}</p>
                            <p className="text-sm text-highlight">{t.division}</p>
                        </div>
                        <div className="space-x-2 flex-shrink-0">
                            {t.phase === 'round-robin' && (
                                <Button onClick={() => handleConclude(t.id)} className="bg-green-600 hover:bg-green-500" disabled={isConcluding === t.id}>
                                    {isConcluding === t.id ? 'Processing...' : 'Conclude League'}
                                </Button>
                            )}
                            {canManageDraw(t) && (
                                <Button onClick={() => setManagingDrawFor(t)} className="bg-yellow-600 hover:bg-yellow-500">
                                    Manage Semis
                                </Button>
                            )}
                            {canManageFinal(t) && (
                                <Button onClick={() => setManagingFinalFor(t)} className="bg-yellow-500 hover:bg-yellow-400">
                                    Manage Final
                                </Button>
                            )}
                            <Button onClick={() => setManagingSponsorsFor(t)} className="bg-green-600 hover:bg-green-500">Sponsors</Button>
                            <Button onClick={() => setEditing(t)} className="bg-blue-600 hover:bg-blue-500">Edit</Button>
                            <Button onClick={() => handleDelete(t.id)} className="bg-red-600 hover:bg-red-500">Delete</Button>
                        </div>
                    </div>
                )) : <p className="text-text-secondary text-center py-4">No tournaments found.</p>}
            </div>
            {editing && (
                <FormModal title={editing.id ? "Edit Tournament" : "Add Tournament"} onClose={() => { setEditing(null); setError(null); }}>
                    <TournamentForm tournament={editing} onSave={handleSave} onCancel={() => { setEditing(null); setError(null); }} error={error} />
                </FormModal>
            )}
            {managingSponsorsFor && (
                <TournamentSponsorsModal tournament={managingSponsorsFor} onClose={() => setManagingSponsorsFor(null)} />
            )}
            {managingDrawFor && (
                <SemifinalDrawModal tournament={managingDrawFor} onClose={() => setManagingDrawFor(null)} />
            )}
            {managingFinalFor && (
                <FinalDrawModal tournament={managingFinalFor} onClose={() => setManagingFinalFor(null)} />
            )}
        </AdminSection>
    );
};

const TournamentForm: React.FC<{ tournament: Tournament | Partial<Tournament>, onSave: (t: any) => void, onCancel: () => void, error: string | null }> = ({ tournament, onSave, onCancel, error }) => {
    const [formData, setFormData] = useState({
        name: '',
        division: 'Division 1',
        ...tournament
    });
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

const FinalDrawModal: React.FC<{ tournament: Tournament, onClose: () => void }> = ({ tournament, onClose }) => {
    const { fixtures, getTeamById, addFixture } = useSports();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const winners = useMemo(() => {
        const semis = fixtures.filter(f => f.tournamentId === tournament.id && f.stage === 'semi-final' && f.status === 'completed');
        if (semis.length !== 2) return [];

        return semis.map(f => {
            if (!f.score) return null;
            // The winner is the one with the higher set score
            return f.score.team1Score > f.score.team2Score ? f.team1Id : f.team2Id;
        }).filter((id): id is number => id !== null); // Type guard to filter out nulls
    }, [fixtures, tournament.id]);

    const team1 = winners.length > 0 ? getTeamById(winners[0]) : null;
    const team2 = winners.length > 1 ? getTeamById(winners[1]) : null;

    const handleCreateFinal = async () => {
        if (!team1 || !team2) {
            setError("Could not determine both final participants from semi-final results.");
            return;
        }

        setLoading(true);
        setError('');
        try {
            const now = new Date().toISOString();
            const finalFixture: Omit<Fixture, 'id' | 'score'> = {
                tournamentId: tournament.id,
                team1Id: team1.id,
                team2Id: team2.id,
                ground: 'TBD',
                dateTime: now,
                status: 'upcoming',
                stage: 'final',
            };
            await addFixture(finalFixture);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormModal title={`Set Final for ${tournament.name}`} onClose={onClose}>
            <div className="space-y-4">
                {error && <ErrorMessage message={error} />}
                <p className="text-text-secondary">The following teams have won their semi-final matches. Confirm to create the final fixture.</p>
                
                <div className="bg-accent p-4 rounded-md text-center space-y-2">
                    <p className="text-xl font-bold text-white">{team1?.name || 'Winner 1 TBD'}</p>
                    <p className="text-lg text-text-secondary">vs</p>
                    <p className="text-xl font-bold text-white">{team2?.name || 'Winner 2 TBD'}</p>
                </div>

                <div className="flex justify-end space-x-2">
                    <Button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                    <Button onClick={handleCreateFinal} disabled={loading || !team1 || !team2}>
                        {loading ? "Creating..." : "Create Final Fixture"}
                    </Button>
                </div>
            </div>
        </FormModal>
    );
};

const SemifinalDrawModal: React.FC<{ tournament: Tournament, onClose: () => void }> = ({ tournament, onClose }) => {
    const { fixtures, getTeamById, addFixture } = useSports();
    const [matchup1, setMatchup1] = useState<{ team1?: number; team2?: number }>({});
    const [matchup2, setMatchup2] = useState<{ team1?: number; team2?: number }>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const winners = useMemo(() => {
        const quarterFinals = fixtures.filter(f => f.tournamentId === tournament.id && f.stage === 'quarter-final' && f.status === 'completed');
        const winnerIds = new Set<number>();
        quarterFinals.forEach(f => {
            if (f.score) {
                const winnerId = f.score.team1Score > f.score.team2Score ? f.team1Id : f.team2Id;
                winnerIds.add(winnerId);
            }
        });
        return Array.from(winnerIds);
    }, [fixtures, tournament.id]);

    const availableForMatchup1Team2 = useMemo(() => {
        return winners.filter(id => id !== matchup1.team1);
    }, [winners, matchup1.team1]);

    const handleSave = async () => {
        if (!matchup1.team1 || !matchup1.team2 || !matchup2.team1 || !matchup2.team2) {
            setError("Please define both semifinal matchups.");
            return;
        }

        setLoading(true);
        setError('');
        try {
            const now = new Date().toISOString();
            const semiFinals: Omit<Fixture, 'id' | 'score'>[] = [
                { tournamentId: tournament.id, team1Id: matchup1.team1, team2Id: matchup1.team2, ground: 'TBD', dateTime: now, status: 'upcoming', stage: 'semi-final' },
                { tournamentId: tournament.id, team1Id: matchup2.team1, team2Id: matchup2.team2, ground: 'TBD', dateTime: now, status: 'upcoming', stage: 'semi-final' }
            ];
            await Promise.all(semiFinals.map(f => addFixture(f)));
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        const selected = new Set([matchup1.team1, matchup1.team2]);
        const remaining = winners.filter(id => !selected.has(id));
        if (remaining.length === 2) {
            setMatchup2({ team1: remaining[0], team2: remaining[1] });
        } else {
            setMatchup2({});
        }
    }, [matchup1, winners]);

    return (
        <FormModal title={`Set Semifinal Draw for ${tournament.name}`} onClose={onClose}>
            <div className="space-y-4">
                {error && <ErrorMessage message={error} />}
                <p className="text-text-secondary">Create the two semifinal matches from the quarterfinal winners.</p>
                <fieldset className="border border-accent p-3 rounded-md">
                    <legend className="px-2 text-sm text-text-secondary">Semifinal 1</legend>
                    <div className="grid grid-cols-2 gap-4">
                        <Select value={matchup1.team1 || ''} onChange={(e) => setMatchup1({ team1: Number(e.target.value) })}>
                            <option disabled value="">Select Team</option>
                            {winners.map(id => <option key={id} value={id}>{getTeamById(id)?.name}</option>)}
                        </Select>
                        <Select value={matchup1.team2 || ''} onChange={(e) => setMatchup1(m => ({ ...m, team2: Number(e.target.value) }))} disabled={!matchup1.team1}>
                            <option disabled value="">Select Opponent</option>
                            {availableForMatchup1Team2.map(id => <option key={id} value={id}>{getTeamById(id)?.name}</option>)}
                        </Select>
                    </div>
                </fieldset>
                <fieldset className="border border-accent p-3 rounded-md bg-primary">
                     <legend className="px-2 text-sm text-text-secondary">Semifinal 2</legend>
                     <div className="grid grid-cols-2 gap-4">
                         <p className="p-2 text-center text-text-primary">{getTeamById(matchup2.team1)?.name || 'TBD'}</p>
                         <p className="p-2 text-center text-text-primary">{getTeamById(matchup2.team2)?.name || 'TBD'}</p>
                     </div>
                </fieldset>

                <div className="flex justify-end space-x-2">
                    <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Create Fixtures"}</Button>
                </div>
            </div>
        </FormModal>
    )
};


const TournamentSponsorsModal: React.FC<{ tournament: Tournament, onClose: () => void }> = ({ tournament, onClose }) => {
    const { sponsors, getSponsorsForTournament, updateSponsorsForTournament } = useSports();
    const currentSponsorIds = getSponsorsForTournament(tournament.id).map(s => s.id);
    const [selectedSponsorIds, setSelectedSponsorIds] = useState<Set<number>>(new Set(currentSponsorIds));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleToggle = (sponsorId: number) => {
        const newSet = new Set(selectedSponsorIds);
        if (newSet.has(sponsorId)) {
            newSet.delete(sponsorId);
        } else {
            newSet.add(sponsorId);
        }
        setSelectedSponsorIds(newSet);
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            await updateSponsorsForTournament(tournament.id, Array.from(selectedSponsorIds));
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormModal title={`Manage Sponsors for ${tournament.name}`} onClose={onClose}>
            <div className="space-y-4">
                {error && <ErrorMessage message={error} />}
                <p className="text-text-secondary">Select the sponsors for this tournament.</p>
                <div className="max-h-64 overflow-y-auto space-y-2 border border-accent p-3 rounded-md">
                    {sponsors.length > 0 ? sponsors.map(sponsor => (
                        <div key={sponsor.id} className="flex items-center bg-primary p-2 rounded-md">
                            <input
                                type="checkbox"
                                id={`sponsor-${sponsor.id}`}
                                checked={selectedSponsorIds.has(sponsor.id)}
                                onChange={() => handleToggle(sponsor.id)}
                                className="h-4 w-4 rounded border-gray-300 text-highlight focus:ring-highlight"
                            />
                            <label htmlFor={`sponsor-${sponsor.id}`} className="ml-3 text-sm text-text-primary">{sponsor.name}</label>
                        </div>
                    )) : <p className="text-center text-text-secondary">No sponsors have been added to the master list yet.</p>}
                </div>
                <div className="flex justify-end space-x-2">
                    <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save Associations"}</Button>
                </div>
            </div>
        </FormModal>
    );
};

// Clubs
const ClubsAdmin = () => {
    const { clubs, addClub, updateClub, deleteClub } = useSports();
    const [editing, setEditing] = useState<Club | Partial<Club> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = async (club: Club | Partial<Club> & { logoFile?: File }) => {
        setError(null);
        try {
            if ('id' in club && club.id) {
                await updateClub(club as Club & { logoFile?: File });
            } else {
                await addClub(club as Omit<Club, 'id'> & { logoFile?: File });
            }
            setEditing(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this club? This will not delete its teams but will unlink them.')) {
            try {
                await deleteClub(id);
            } catch (err: any) {
                alert(`Deletion failed: ${err.message}`);
            }
        }
    };

    const filteredClubs = useMemo(() => clubs.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())), [clubs, searchTerm]);

    return (
        <AdminSection title="Manage Clubs">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                 <div className="relative w-full sm:w-auto sm:max-w-xs flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    </span>
                    <Input
                        type="text"
                        placeholder="Search clubs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 !mt-0"
                    />
                </div>
                <Button onClick={() => setEditing({})}>Add New Club</Button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClubs.map(c => (
                    <div key={c.id} className="p-3 bg-accent rounded-md text-center">
                         {c.logoUrl ? (
                            <img src={c.logoUrl} alt={c.name} className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-primary object-cover" />
                         ) : (
                            <div className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-primary bg-primary flex items-center justify-center text-text-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                         )}
                        <p className="font-bold">{c.name}</p>
                        <div className="mt-2 space-x-2">
                            <Button onClick={() => setEditing(c)} className="bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1">Edit</Button>
                            <Button onClick={() => handleDelete(c.id)} className="bg-red-600 hover:bg-red-500 text-xs px-3 py-1">Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
            {editing && (
                <FormModal title={editing.id ? "Edit Club" : "Add Club"} onClose={() => { setEditing(null); setError(null); }}>
                    <ClubForm club={editing} onSave={handleSave} onCancel={() => { setEditing(null); setError(null); }} error={error} />
                </FormModal>
            )}
        </AdminSection>
    );
};

const ClubForm: React.FC<{ club: Club | Partial<Club>, onSave: (c: any) => void, onCancel: () => void, error: string | null }> = ({ club, onSave, onCancel, error }) => {
    const [formData, setFormData] = useState({ name: '', ...club });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState(club.logoUrl);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result as string);
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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, logoFile });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div>
                <Label htmlFor="name">Club Name</Label>
                <Input id="name" name="name" type="text" value={formData.name || ''} onChange={handleChange} required />
            </div>
            <div>
                <Label>Logo Image (Optional)</Label>
                <div className="mt-2 flex items-center gap-4">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Logo preview" className="w-20 h-20 rounded-full object-cover bg-primary" />
                    ) : (
                         <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-text-secondary">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                         </div>
                    )}
                    <div className="flex-grow">
                        <Input id="logoFile" name="logoFile" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="text-sm" />
                        {previewUrl && <Button type="button" onClick={handleRemoveLogo} className="bg-gray-600 hover:bg-gray-500 text-xs mt-2">Remove Logo</Button>}
                    </div>
                </div>
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
    const { teams, clubs, addTeam, updateTeam, deleteTeam } = useSports();
    const [editing, setEditing] = useState<Team | Partial<Team> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredTeams = useMemo(() => teams.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.shortName.toLowerCase().includes(searchTerm.toLowerCase())
    ), [teams, searchTerm]);

    return (
        <AdminSection title="Manage Teams">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div className="relative w-full sm:w-auto sm:max-w-xs flex-grow">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    </span>
                    <Input
                        type="text"
                        placeholder="Search by name or short name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 !mt-0"
                    />
                </div>
                <Button onClick={() => setEditing({})} disabled={clubs.length === 0}>Add New Team</Button>
            </div>
            {clubs.length === 0 && <p className="text-sm text-yellow-400 mt-2">Please add a club before adding teams.</p>}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeams.length > 0 ? filteredTeams.map(t => (
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
                )) : <p className="text-text-secondary text-center py-4 md:col-span-2 lg:col-span-3">No teams found.</p>}
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
    const { clubs } = useSports();
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, clubId: parseInt(formData.clubId as any, 10), logoFile });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div>
                <Label htmlFor="clubId">Club</Label>
                <Select id="clubId" name="clubId" value={formData.clubId || ''} onChange={handleChange} required>
                    <option value="" disabled>Select a club</option>
                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
            </div>
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
    const { players, teams, addPlayer, updatePlayer, deletePlayer, getTeamById } = useSports();
    const [editing, setEditing] = useState<Player | Partial<Player> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredPlayers = useMemo(() => players.filter(p => {
        const team = getTeamById(p.teamId);
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
            p.name.toLowerCase().includes(lowerSearchTerm) ||
            (team && team.name.toLowerCase().includes(lowerSearchTerm))
        );
    }), [players, getTeamById, searchTerm]);

    return (
        <AdminSection title="Manage Players">
             <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div className="relative w-full sm:w-auto sm:max-w-xs flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    </span>
                    <Input
                        type="text"
                        placeholder="Search by player or team name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 !mt-0"
                    />
                </div>
                <Button onClick={() => setEditing({})} disabled={teams.length === 0}>Add New Player</Button>
            </div>

            {teams.length === 0 && <p className="text-sm text-yellow-400 mt-2">Please add a team before adding players.</p>}
            <div className="mt-4 space-y-2">
                {filteredPlayers.length > 0 ? filteredPlayers.map(p => (
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
                )) : <p className="text-text-secondary text-center py-4">No players found.</p>}
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
    const playerRoles: PlayerRole[] = ['Main Netty', 'Left Front', 'Right Front', 'Net Center', 'Back Center', 'Left Back', 'Right Back', 'Right Netty', 'Left Netty', 'Service Man'];
    
    const [formData, setFormData] = useState({
        name: '',
        role: 'Main Netty' as PlayerRole,
        ...player,
        stats: player.stats || { matches: 0, aces: 0, kills: 0, blocks: 0 },
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
        // FIX: The original check `formData.teamId === ''` caused a type error because teamId could be a number.
        // Using `?? ''` safely converts null/undefined to an empty string for comparison, resolving the type error.
        const teamIdValue = (formData.teamId ?? '') === '' ? null : parseInt(String(formData.teamId!), 10);
        onSave({...formData, teamId: teamIdValue, photoFile });
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
                <Select id="teamId" name="teamId" value={formData.teamId ?? ''} onChange={handleChange}>
                    <option value="">-- Unassigned / Free Agent --</option>
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
                <Button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};


// Score Update Modal
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
        <FormModal title={`Update Score: ${team1.name} vs ${team2.name}`} onClose={onClose}>
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


// Fixtures
const FixturesAdmin = () => {
    const { fixtures, teams, tournaments, addFixture, updateFixture, deleteFixture, getTeamById } = useSports();
    const [editing, setEditing] = useState<Fixture | Partial<Omit<Fixture, 'score'>> | null>(null);
    const [scoringFixture, setScoringFixture] = useState<Fixture | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
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

    const filteredFixtures = useMemo(() => fixtures.filter(f => {
        const team1 = getTeamById(f.team1Id);
        const team2 = getTeamById(f.team2Id);
        const tournament = tournaments.find(t => t.id === f.tournamentId);
        const lowerSearchTerm = searchTerm.toLowerCase();

        return (
            (team1 && team1.name.toLowerCase().includes(lowerSearchTerm)) ||
            (team2 && team2.name.toLowerCase().includes(lowerSearchTerm)) ||
            (tournament && tournament.name.toLowerCase().includes(lowerSearchTerm)) ||
            f.ground.toLowerCase().includes(lowerSearchTerm)
        );
    }), [fixtures, getTeamById, tournaments, searchTerm]);

    return (
        <AdminSection title="Manage Fixtures">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div className="relative w-full sm:w-auto sm:max-w-xs flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    </span>
                    <Input
                        type="text"
                        placeholder="Search by team, tournament, ground..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 !mt-0"
                    />
                </div>
                <Button onClick={() => setEditing({})} disabled={teams.length < 2 || tournaments.length === 0}>Add New Fixture</Button>
            </div>
            {(teams.length < 2 || tournaments.length === 0) && <p className="text-sm text-yellow-400 mt-2">Add at least 2 teams and 1 tournament to create fixtures.</p>}
            <div className="mt-4 space-y-2">
                {filteredFixtures.length > 0 ? filteredFixtures.map(f => (
                    <div key={f.id} className="p-3 bg-accent rounded-md">
                        <div className="flex items-center justify-between">
                            <p className="font-bold">{getTeamById(f.team1Id)?.name || 'N/A'} vs {getTeamById(f.team2Id)?.name || 'N/A'}</p>
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
                )) : <p className="text-text-secondary text-center py-4">No fixtures found.</p>}
            </div>
             {editing && (
                <FormModal title={editing.id ? "Edit Fixture" : "Add Fixture"} onClose={() => { setEditing(null); setError(null); }}>
                    <FixtureForm fixture={editing} onSave={handleSave} onCancel={() => { setEditing(null); setError(null); }} teams={teams} tournaments={tournaments} error={error} />
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

const FixtureForm: React.FC<{ fixture: Fixture | Partial<Fixture>, onSave: (f: any) => void, onCancel: () => void, teams: Team[], tournaments: Tournament[], error: string | null }> = ({ fixture, onSave, onCancel, teams, tournaments, error }) => {
    const toInputDateTimeString = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    };
    
    const [formData, setFormData] = useState<Partial<Fixture & { dateTime: string }>>({
        status: 'upcoming',
        ...fixture,
        dateTime: toInputDateTimeString(fixture.dateTime)
    });

    const eligibleTeams = React.useMemo(() => {
        if (!formData.tournamentId) {
            return [];
        }
        const selectedTournamentId = Number(formData.tournamentId);
        const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);
        return selectedTournament ? teams.filter(team => team.division === selectedTournament.division) : [];
    }, [formData.tournamentId, tournaments, teams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'tournamentId') {
                newState.team1Id = undefined;
                newState.team2Id = undefined;
            }
            return newState;
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.team1Id || !formData.team2Id) {
            alert("Please select both teams.");
            return;
        }
        if (formData.team1Id === formData.team2Id) {
            alert("A team cannot play against itself.");
            return;
        }
        const payload = {
            ...formData,
            dateTime: new Date(formData.dateTime!).toISOString(),
            tournamentId: Number(formData.tournamentId),
            team1Id: Number(formData.team1Id),
            team2Id: Number(formData.team2Id),
        };
        onSave(payload);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div>
                <Label>Tournament</Label>
                <Select name="tournamentId" value={formData.tournamentId || ''} onChange={handleChange} required>
                    <option value="" disabled>Select tournament</option>
                    {tournaments
                        .sort((a,b) => a.name.localeCompare(b.name))
                        .map(t => <option key={t.id} value={t.id}>{t.name} ({t.division})</option>)}
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label>Team 1</Label>
                    <Select name="team1Id" value={formData.team1Id || ''} onChange={handleChange} required disabled={!formData.tournamentId}>
                        <option value="" disabled>Select Team 1</option>
                        {eligibleTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                </div>
                 <div>
                    <Label>Team 2</Label>
                    <Select name="team2Id" value={formData.team2Id || ''} onChange={handleChange} required disabled={!formData.tournamentId}>
                        <option value="" disabled>Select Team 2</option>
                        {eligibleTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
    const { sponsors, addSponsor, updateSponsor, deleteSponsor, toggleSponsorShowInFooter } = useSports();
    const [editing, setEditing] = useState<Sponsor | Partial<Sponsor> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredSponsors = useMemo(() => sponsors.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())), [sponsors, searchTerm]);

    return (
        <AdminSection title="Manage Master Sponsor List">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div className="relative w-full sm:w-auto sm:max-w-xs flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    </span>
                    <Input
                        type="text"
                        placeholder="Search sponsors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 !mt-0"
                    />
                </div>
                <Button onClick={() => setEditing({})}>Add New Sponsor</Button>
            </div>
            <div className="mt-4 space-y-2">
                {filteredSponsors.length > 0 ? filteredSponsors.map(s => (
                     <div key={s.id} className="flex items-center justify-between p-3 bg-accent rounded-md flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                            {s.logoUrl && <img src={s.logoUrl} alt={s.name} className="h-8 object-contain" />}
                            <p className="font-bold">{s.name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <label htmlFor={`footer-toggle-${s.id}`} className="flex items-center cursor-pointer">
                                <span className="text-xs text-text-secondary mr-2">Show in Footer</span>
                                <div className="relative">
                                    <input id={`footer-toggle-${s.id}`} type="checkbox" className="sr-only" checked={s.showInFooter} onChange={() => toggleSponsorShowInFooter(s)} />
                                    <div className="block bg-primary w-10 h-6 rounded-full"></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${s.showInFooter ? 'transform translate-x-full bg-highlight' : ''}`}></div>
                                </div>
                            </label>
                            <div className="space-x-2">
                                <Button onClick={() => setEditing(s)} className="bg-blue-600 hover:bg-blue-500">Edit</Button>
                                <Button onClick={() => handleDelete(s.id)} className="bg-red-600 hover:bg-red-500">Delete</Button>
                            </div>
                        </div>
                    </div>
                )) : <p className="text-text-secondary text-center py-4">No sponsors found.</p>}
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
    const [formData, setFormData] = useState({
        name: '',
        website: '',
        showInFooter: false,
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, logoFile });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div>
                <Label htmlFor="sponsor-name">Sponsor Name</Label>
                <Input id="sponsor-name" name="name" value={formData.name || ''} onChange={handleChange} required />
            </div>
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
            <div>
                <Label htmlFor="sponsor-website">Website</Label>
                <Input id="sponsor-website" name="website" type="text" value={formData.website || ''} onChange={handleChange} required />
            </div>
            <div>
                <div className="flex items-center mt-4">
                    <input
                        id="showInFooter"
                        name="showInFooter"
                        type="checkbox"
                        checked={!!formData.showInFooter}
                        onChange={(e) => setFormData({ ...formData, showInFooter: e.target.checked })}
                        className="h-4 w-4 rounded border-accent bg-primary text-highlight focus:ring-highlight"
                    />
                    <Label htmlFor="showInFooter" className="ml-3 !block">Show in main site footer</Label>
                </div>
            </div>
            <div className="flex justify-end space-x-2">
                <Button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

// Player Transfers
const PlayerTransfersAdmin = () => {
    const { playerTransfers, players, teams, addPlayerTransfer, updatePlayerTransfer, deletePlayerTransfer, getTeamById } = useSports();
    const [editing, setEditing] = useState<PlayerTransfer | Partial<Omit<PlayerTransfer, 'id' | 'isAutomated'>> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = async (transfer: PlayerTransfer | Partial<Omit<PlayerTransfer, 'id' | 'isAutomated'>>) => {
        setError(null);
        try {
            // FIX: Replaced an incorrect type assertion with a proper 'in' operator type guard.
            // This correctly narrows the type to `PlayerTransfer` for existing records.
            if ('id' in transfer && transfer.id) {
                await updatePlayerTransfer(transfer);
            } else {
                await addPlayerTransfer(transfer as Omit<PlayerTransfer, 'id' | 'isAutomated'>);
            }
            setEditing(null);
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this transfer record? This action is permanent.')) {
            try {
                await deletePlayerTransfer(id);
            } catch (err: any) {
                alert(`Deletion failed: ${err.message}`);
            }
        }
    };
    
    const filteredTransfers = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return playerTransfers
            .map(t => ({...t, player: players.find(p => p.id === t.playerId)}))
            .filter(t => t.player && t.player.name.toLowerCase().includes(lowerSearch))
            .sort((a,b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime())
    }, [playerTransfers, players, searchTerm]);

    return (
        <AdminSection title="Manage Player Transfers">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div className="relative w-full sm:w-auto sm:max-w-xs flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    </span>
                    <Input
                        type="text"
                        placeholder="Search by player name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 !mt-0"
                    />
                </div>
                <Button onClick={() => setEditing({})}>Add Manual Transfer</Button>
            </div>
            <div className="mt-4 space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {filteredTransfers.map(t => (
                    <div key={t.id} className="p-3 bg-accent rounded-md">
                        <div className="flex items-center justify-between">
                            <p className="font-bold">{t.player?.name || 'Unknown Player'}</p>
                             <div className="space-x-2">
                                <Button onClick={() => setEditing(t)} className="bg-blue-600 hover:bg-blue-500 text-xs px-2 py-1">Edit</Button>
                                <Button onClick={() => handleDelete(t.id)} className="bg-red-600 hover:bg-red-500 text-xs px-2 py-1">Delete</Button>
                            </div>
                        </div>
                        <div className="text-sm text-text-secondary mt-1 flex items-center gap-2">
                            <span>{getTeamById(t.fromTeamId)?.name || 'Free Agent'}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-highlight" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            <span>{getTeamById(t.toTeamId)?.name || 'Free Agent'}</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1">{new Date(t.transferDate).toLocaleDateString()}</p>
                        {t.notes && <p className="text-xs italic text-text-secondary mt-2 p-2 bg-primary rounded-md">Notes: {t.notes}</p>}
                    </div>
                ))}
            </div>
             {editing && (
                <FormModal title={editing.id ? "Edit Transfer Record" : "Add Manual Transfer"} onClose={() => { setEditing(null); setError(null); }}>
                    <PlayerTransferForm transfer={editing} onSave={handleSave} onCancel={() => { setEditing(null); setError(null); }} error={error} />
                </FormModal>
            )}
        </AdminSection>
    );
};

const PlayerTransferForm: React.FC<{ transfer: PlayerTransfer | Partial<Omit<PlayerTransfer, 'id' | 'isAutomated'>>, onSave: (t: any) => void, onCancel: () => void, error: string | null }> = ({ transfer, onSave, onCancel, error }) => {
    const { players, teams } = useSports();
    const [formData, setFormData] = useState({
        playerId: undefined,
        fromTeamId: 'unassigned',
        toTeamId: 'unassigned',
        transferDate: new Date().toISOString().split('T')[0],
        notes: '',
        ...transfer,
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.playerId) {
            alert("Please select a player.");
            return;
        }
        const payload = {
            ...formData,
            playerId: Number(formData.playerId),
            fromTeamId: formData.fromTeamId === 'unassigned' ? null : Number(formData.fromTeamId),
            toTeamId: formData.toTeamId === 'unassigned' ? null : Number(formData.toTeamId),
        };
        onSave(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div><Label>Player</Label><Select name="playerId" value={formData.playerId || ''} onChange={handleChange} required disabled={'id' in transfer}><option value="" disabled>Select a player...</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
            <div><Label>From Team</Label><Select name="fromTeamId" value={formData.fromTeamId || 'unassigned'} onChange={handleChange} required><option value="unassigned">Free Agent</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></div>
            <div><Label>To Team</Label><Select name="toTeamId" value={formData.toTeamId || 'unassigned'} onChange={handleChange} required><option value="unassigned">Free Agent</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></div>
            <div><Label>Transfer Date</Label><Input name="transferDate" type="date" value={formData.transferDate.split('T')[0]} onChange={handleChange} required /></div>
            <div><Label>Notes (Optional)</Label><Textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} /></div>
            <div className="flex justify-end space-x-2">
                <Button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                <Button type="submit">Save Transfer</Button>
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
            Papa.parse(file, {
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
                const requiredColumns = ['name', 'shortName', 'division', 'clubName'];
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
            <p className="text-text-secondary mb-4">Upload CSV files to add or update clubs, teams, and players in bulk. Ensure column headers match the required format. Clubs must exist before you can import teams that belong to them.</p>
            {error && <p className="text-red-500 mb-4 p-3 bg-red-900/50 rounded-md"><strong>Error:</strong> {error}</p>}
            {success && <p className="text-green-500 mb-4 p-3 bg-green-900/50 rounded-md"><strong>Success:</strong> {success}</p>}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-accent p-4 rounded-md">
                    <h3 className="font-bold mb-2">Import Teams</h3>
                    <p className="text-xs text-text-secondary mb-2">Required columns: `name`, `shortName`, `division`, `clubName`. Optional: `logoUrl`</p>
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

// Export Data
const ExportAdmin = () => {
    const { teams, players, getTeamById, getClubById } = useSports();

    const downloadCSV = (csvString: string, filename: string) => {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportTeams = () => {
        if (teams.length === 0) {
            alert("No teams to export.");
            return;
        }
        const data = teams.map(t => {
            const club = getClubById(t.clubId);
            return {
                name: t.name,
                shortName: t.shortName,
                division: t.division,
                clubName: club?.name || 'N/A',
                logoUrl: t.logoUrl || '',
            }
        });
        const csv = Papa.unparse(data);
        downloadCSV(csv, `dvoc_teams_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportPlayers = () => {
        if (players.length === 0) {
            alert("No players to export.");
            return;
        }
        const data = players.map(p => {
            const team = getTeamById(p.teamId);
            return {
                name: p.name,
                teamName: team?.name || 'N/A',
                role: p.role,
                photoUrl: p.photoUrl || '',
                matches: p.stats?.matches ?? 0,
                aces: p.stats?.aces ?? 0,
                kills: p.stats?.kills ?? 0,
                blocks: p.stats?.blocks ?? 0,
            };
        });
        const csv = Papa.unparse(data);
        downloadCSV(csv, `dvoc_players_${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <AdminSection title="Export Data">
            <p className="text-text-secondary mb-4">Download your current team and player data as CSV files.</p>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-accent p-4 rounded-md">
                    <h3 className="font-bold mb-2">Export All Teams</h3>
                    <p className="text-xs text-text-secondary mb-3">Downloads a CSV file with all teams in the database. The format is compatible with the bulk import.</p>
                    <Button onClick={handleExportTeams}>Export Teams CSV</Button>
                </div>
                <div className="bg-accent p-4 rounded-md">
                    <h3 className="font-bold mb-2">Export All Players</h3>
                    <p className="text-xs text-text-secondary mb-3">Downloads a CSV file with all players and their stats. The format is compatible with the bulk import.</p>
                    <Button onClick={handleExportPlayers}>Export Players CSV</Button>
                </div>
            </div>
        </AdminSection>
    );
};

const DangerZoneAdmin = () => {
    const { deleteAllPlayers } = useSports();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        try {
            await deleteAllPlayers();
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openModal = () => {
        setConfirmText('');
        setError('');
        setLoading(false);
        setIsModalOpen(true);
    };

    return (
        <>
            <AdminSection title="Danger Zone">
                <div className="border border-red-500/50 p-4 rounded-md bg-red-900/10">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h3 className="font-bold text-red-400">Delete All Players</h3>
                            <p className="text-sm text-text-secondary mt-1 max-w-lg">
                                This will permanently remove all player records and their associated transfer histories from the database. This action cannot be undone.
                            </p>
                        </div>
                        <Button onClick={openModal} className="bg-red-600 hover:bg-red-500">
                            Delete All Players
                        </Button>
                    </div>
                </div>
            </AdminSection>
            {isModalOpen && (
                <FormModal title="Confirm Permanent Deletion" onClose={() => setIsModalOpen(false)}>
                    <div className="space-y-4">
                        {error && <ErrorMessage message={error} />}
                        <p className="text-text-secondary">
                            You are about to delete <strong>all players</strong>. This is irreversible. To proceed, please type <strong className="text-red-400">DELETE</strong> into the box below.
                        </p>
                        <div>
                            <Label htmlFor="confirm-delete" className="sr-only">Confirmation Text</Label>
                            <Input
                                id="confirm-delete"
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="border-red-500 focus:border-red-400 focus:ring-red-400"
                                placeholder="Type DELETE to confirm"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-600 hover:bg-gray-500">Cancel</Button>
                            <Button
                                onClick={handleDelete}
                                disabled={confirmText !== 'DELETE' || loading}
                                className="bg-red-600 hover:bg-red-500"
                            >
                                {loading ? 'Deleting...' : 'I understand, delete all players'}
                            </Button>
                        </div>
                    </div>
                </FormModal>
            )}
        </>
    );
};

interface AdminTab {
    id: string;
    label: string;
    roles: UserRole[];
}

const availableTabs: AdminTab[] = [
    { id: 'tournaments', label: 'Tournaments', roles: ['admin'] },
    { id: 'clubs', label: 'Clubs', roles: ['admin', 'team_manager', 'content_editor'] },
    { id: 'teams', label: 'Teams', roles: ['admin', 'team_manager'] },
    { id: 'players', label: 'Players', roles: ['admin', 'team_manager'] },
    { id: 'transfers', label: 'Player Transfers', roles: ['admin'] },
    { id: 'fixtures', label: 'Fixtures', roles: ['admin', 'fixture_manager'] },
    { id: 'notice-board', label: 'Notice Board', roles: ['admin', 'content_editor'] },
    { id: 'sponsors', label: 'Sponsors', roles: ['admin', 'content_editor'] },
    { id: 'bulk-import', label: 'Bulk Import', roles: ['admin', 'team_manager'] },
    { id: 'export', label: 'Export Data', roles: ['admin'] },
];

// Main View
export const AdminView: React.FC = () => {
    const { userProfile } = useAuth();
    const userRole = userProfile?.role;

    // FIX: Memoize the accessibleTabs array. This prevents it from being a new
    // array on every render, which was causing an infinite loop in the useEffect hook below.
    const accessibleTabs = useMemo(() =>
        availableTabs.filter(tab => userRole && tab.roles.includes(userRole))
    , [userRole]);
    
    const [activeTab, setActiveTab] = useState<string | null>(null);

    useEffect(() => {
        // Set the initial active tab or update it if the current one is no longer accessible
        if (accessibleTabs.length > 0) {
            const currentTabIsValid = accessibleTabs.some(t => t.id === activeTab);
            if (!currentTabIsValid) {
                setActiveTab(accessibleTabs[0].id);
            }
        } else {
            setActiveTab(null);
        }
    }, [userRole, accessibleTabs, activeTab]);


    const renderContent = () => {
        switch (activeTab) {
            case 'tournaments': return <TournamentsAdmin />;
            case 'clubs': return <ClubsAdmin />;
            case 'teams': return <TeamsAdmin />;
            case 'players': return <PlayersAdmin />;
            case 'transfers': return <PlayerTransfersAdmin />;
            case 'fixtures': return <FixturesAdmin />;
            case 'notice-board': return <NoticeBoardAdmin />;
            case 'sponsors': return <SponsorsAdmin />;
            case 'bulk-import': return <BulkImportAdmin />;
            case 'export': return <ExportAdmin />;
            default: return <p className="text-center text-text-secondary">You do not have permission to view any sections.</p>;
        }
    };

    // FIX: Used React.FC to correctly type the component props, which resolves the TypeScript error related to the 'key' prop when mapping over elements.
    const TabButton: React.FC<{ tab: string; label: string }> = ({ tab, label }) => (
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
                    {accessibleTabs.map(tab => (
                        <TabButton key={tab.id} tab={tab.id} label={tab.label} />
                    ))}
                </div>
            </div>
            {activeTab ? <div>{renderContent()}</div> : null}
            {userProfile?.role === 'admin' && (
                <div className="mt-12">
                    <DangerZoneAdmin />
                </div>
            )}
        </div>
    );
};

const NoticeBoardAdmin = () => {
    const { notices, addNotice, deleteNotice } = useSports();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const activeNotices = useMemo(() => {
        const now = new Date();
        return notices
            .filter(n => new Date(n.expiresAt) > now)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [notices]);

    const handleSave = useCallback(async (notice: Omit<Notice, 'id' | 'createdAt'>) => {
        setError('');
        setIsSaving(true);
        try {
            await addNotice(notice);
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err.message || 'Failed to publish notice. Please try again.');
            // Re-throw the error to let the caller know it failed.
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [addNotice]);

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this notice immediately?')) {
            try {
                await deleteNotice(id);
            } catch (err: any) {
                alert(`Failed to delete notice: ${err.message}`);
            }
        }
    };

    return (
        <AdminSection title="Notice Board">
            <div className="flex justify-between items-center mb-4">
                <p className="text-text-secondary">Create or remove site-wide announcements.</p>
                <Button onClick={() => setIsModalOpen(true)}>Add New Notice</Button>
            </div>
            <div className="mt-4 space-y-3">
                {activeNotices.length > 0 ? activeNotices.map(notice => (
                    <div key={notice.id} className="p-4 bg-accent rounded-lg">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <p className="font-bold text-white">{notice.title}</p>
                                <p className="text-sm text-text-primary mt-1">{notice.message}</p>
                                <p className="text-xs text-text-secondary mt-2">
                                    Expires on: {new Date(notice.expiresAt).toLocaleDateString()}
                                </p>
                            </div>
                            <Button onClick={() => handleDelete(notice.id)} className="bg-red-600 hover:bg-red-500 flex-shrink-0">Delete</Button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-text-secondary py-4">There are no active notices.</p>
                )}
            </div>
            {isModalOpen && (
                <FormModal title="Add New Notice" onClose={() => setIsModalOpen(false)}>
                    <NoticeForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} error={error} isSaving={isSaving} />
                </FormModal>
            )}
        </AdminSection>
    );
};

const NoticeForm: React.FC<{ 
    onSave: (notice: Omit<Notice, 'id' | 'createdAt'>) => Promise<void>, 
    onCancel: () => void, 
    error: string | null, 
    isSaving: boolean 
}> = ({ onSave, onCancel, error, isSaving }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        level: 'Information' as NoticeLevel,
        expiresAt: tomorrow.toISOString().split('T')[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const expiryDate = new Date(formData.expiresAt);
        expiryDate.setHours(23, 59, 59, 999);
        try {
            await onSave({ ...formData, expiresAt: expiryDate.toISOString() });
        } catch (err) {
            // Error is already set in the parent component, so we don't need to do anything here.
            // The purpose of this try/catch is to prevent the form submission from crashing.
            console.error("Save operation failed:", err);
        }
    };
    
    const noticeLevels: NoticeLevel[] = ['Information', 'Warning', 'Urgent'];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" type="text" value={formData.title} onChange={handleChange} required disabled={isSaving}/>
            </div>
            <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={4} disabled={isSaving}/>
            </div>
             <div>
                <Label htmlFor="level">Notice Level</Label>
                <Select id="level" name="level" value={formData.level} onChange={handleChange} required disabled={isSaving}>
                    {noticeLevels.map(level => <option key={level} value={level}>{level}</option>)}
                </Select>
            </div>
             <div>
                <Label htmlFor="expiresAt">Expiration Date</Label>
                <Input id="expiresAt" name="expiresAt" type="date" value={formData.expiresAt} onChange={handleChange} required disabled={isSaving}/>
            </div>
            <div className="flex justify-end space-x-2">
                <Button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500" disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Publishing...' : 'Publish Notice'}
                </Button>
            </div>
        </form>
    );
};
