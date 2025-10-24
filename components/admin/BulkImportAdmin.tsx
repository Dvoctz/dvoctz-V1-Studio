import React, { useState } from 'react';
import { parse } from 'papaparse';
import { useSports, CsvTeam, CsvPlayer } from '../../context/SportsDataContext';
import { AdminSection, Input, Label } from './AdminUI';

export const BulkImportAdmin = () => {
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
