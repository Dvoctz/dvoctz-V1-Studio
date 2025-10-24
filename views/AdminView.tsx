import React, { useState } from 'react';
import { TournamentsAdmin } from '../components/admin/TournamentsAdmin';
import { TeamsAdmin } from '../components/admin/TeamsAdmin';
import { PlayersAdmin } from '../components/admin/PlayersAdmin';
import { FixturesAdmin } from '../components/admin/FixturesAdmin';
import { SponsorsAdmin } from '../components/admin/SponsorsAdmin';
import { BulkImportAdmin } from '../components/admin/BulkImportAdmin';
import { ExportAdmin } from '../components/admin/ExportAdmin';

// Main View
export const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('tournaments');

    const renderContent = () => {
        switch (activeTab) {
            case 'tournaments': return <TournamentsAdmin />;
            case 'teams': return <TeamsAdmin />;
            case 'players': return <PlayersAdmin />;
            case 'fixtures': return <FixturesAdmin />;
            case 'sponsors': return <SponsorsAdmin />;
            case 'bulk-import': return <BulkImportAdmin />;
            case 'export': return <ExportAdmin />;
            default: return null;
        }
    };

    const TabButton = ({ tab, label }: { tab: string; label: string }) => (
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
                    <TabButton tab="tournaments" label="Tournaments" />
                    <TabButton tab="teams" label="Teams" />
                    <TabButton tab="players" label="Players" />
                    <TabButton tab="fixtures" label="Fixtures" />
                    <TabButton tab="sponsors" label="Sponsors" />
                    <TabButton tab="bulk-import" label="Bulk Import" />
                    <TabButton tab="export" label="Export Data" />
                </div>
            </div>
            <div>{renderContent()}</div>
        </div>
    );
};
