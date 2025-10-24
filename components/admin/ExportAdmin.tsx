import React from 'react';
import { unparse } from 'papaparse';
import { useSports } from '../../context/SportsDataContext';
import { AdminSection, Button } from './AdminUI';

export const ExportAdmin = () => {
    const { teams, players, getTeamById } = useSports();

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
        const data = teams.map(t => ({
            name: t.name,
            shortName: t.shortName,
            division: t.division,
            logoUrl: t.logoUrl || '',
        }));
        const csv = unparse(data);
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
        const csv = unparse(data);
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
