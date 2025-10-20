
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { TournamentsView } from './views/TournamentsView';
import { TeamsView } from './views/TeamsView';
import { PlayersView } from './views/PlayersView';
import { TournamentDetailView } from './views/TournamentDetailView';
import { TeamDetailView } from './views/TeamDetailView';
import { AdminView } from './views/AdminView';
import { LoginView } from './views/LoginView';
import type { View, Tournament, Team } from './types';
import { SportsDataProvider } from './context/SportsDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { currentUser } = useAuth();

  const handleNavigate = (view: View) => {
    if (view === 'admin' && !currentUser) {
      setCurrentView('login');
    } else {
      setCurrentView(view);
    }
    setSelectedTournament(null);
    setSelectedTeam(null);
  }

  const handleLoginSuccess = () => {
    setCurrentView('admin');
  };

  const handleSelectTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setCurrentView('tournament-detail');
  };

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    setCurrentView('team-detail');
  };

  const handleBackToTournaments = () => {
    setSelectedTournament(null);
    setCurrentView('tournaments');
  };

  const handleBackToTeams = () => {
    setSelectedTeam(null);
    setCurrentView('teams');
  };
  
  // Reset scroll on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView, selectedTournament, selectedTeam]);

  useEffect(() => {
    // If user logs out while on admin page, redirect to home
    if (!currentUser && currentView === 'admin') {
      setCurrentView('home');
    }
  }, [currentUser, currentView]);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onNavigate={setCurrentView} onSelectTournament={handleSelectTournament} />;
      case 'tournaments':
        return <TournamentsView onSelectTournament={handleSelectTournament} />;
      case 'teams':
        return <TeamsView onSelectTeam={handleSelectTeam} />;
      case 'players':
        return <PlayersView />;
      case 'tournament-detail':
        return selectedTournament ? <TournamentDetailView tournament={selectedTournament} onBack={handleBackToTournaments} /> : <TournamentsView onSelectTournament={handleSelectTournament} />;
      case 'team-detail':
        return selectedTeam ? <TeamDetailView team={selectedTeam} onBack={handleBackToTeams} /> : <TeamsView onSelectTeam={handleSelectTeam} />;
      case 'admin':
        return currentUser ? <AdminView /> : <LoginView onLoginSuccess={handleLoginSuccess} />;
      case 'login':
        return <LoginView onLoginSuccess={handleLoginSuccess} />;
      default:
        return <HomeView onNavigate={setCurrentView} onSelectTournament={handleSelectTournament} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <Header currentView={currentView} onNavigate={handleNavigate} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderView()}
      </main>
      <Footer />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <SportsDataProvider>
        <AppContent />
      </SportsDataProvider>
    </AuthProvider>
  );
};

export default App;