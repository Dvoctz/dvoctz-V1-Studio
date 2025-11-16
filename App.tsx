import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { TournamentsView } from './views/TournamentsView';
import { ClubsView } from './views/ClubsView';
import { PlayersView } from './views/PlayersView';
import { TournamentDetailView } from './views/TournamentDetailView';
import { ClubDetailView } from './views/ClubDetailView';
import { TeamDetailView } from './views/TeamDetailView';
import { AdminView } from './views/AdminView';
import { LoginView } from './views/LoginView';
import { RulesView } from './views/RulesView';
import type { View, Tournament, Team, Club } from './types';
import { SportsDataProvider } from './context/SportsDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initializeSupabase } from './supabaseClient';
import { SupabaseProvider } from './context/SupabaseContext';
import { Analytics } from '@vercel/analytics/react';
import { AddToHomeScreenPrompt } from './components/AddToHomeScreenPrompt';

// Initialize the Supabase client once, outside of the component render cycle.
// This is the critical fix to prevent re-creating the client on every render.
const supabaseClient = initializeSupabase();

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [showIosInstallPrompt, setShowIosInstallPrompt] = useState(false);
  const [viewBeforeLogin, setViewBeforeLogin] = useState<View | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      if (currentView === 'admin') {
        setViewBeforeLogin(currentView);
        setCurrentView('login');
      }
      return;
    }

    if (userProfile) {
      const isAdminTypeUser = userProfile.role !== 'user';
      if (currentView === 'login') {
        const targetView = viewBeforeLogin || (isAdminTypeUser ? 'admin' : 'home');
        setCurrentView(targetView);
        setViewBeforeLogin(null);
      } else if (currentView === 'admin' && !isAdminTypeUser) {
        setCurrentView('home');
      }
    }
  }, [currentUser, userProfile, currentView, authLoading, viewBeforeLogin]);

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    setSelectedTournament(null);
    setSelectedClub(null);
    setSelectedTeam(null);
  }

  const handleLoginSuccess = () => {
    // This is handled by the main useEffect now.
  };

  const handleSelectTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setCurrentView('tournament-detail');
  };

  const handleSelectClub = (club: Club) => {
    setSelectedClub(club);
    setCurrentView('club-detail');
  };

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    setCurrentView('team-detail');
  };

  const handleBackToTournaments = () => {
    setSelectedTournament(null);
    setCurrentView('tournaments');
  };
  
  const handleBackToClubs = () => {
    setSelectedClub(null);
    setSelectedTeam(null);
    setCurrentView('clubs');
  };


  useEffect(() => {
    const isIos = () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isInStandaloneMode = () => ('standalone' in window.navigator) && ((window.navigator as any).standalone);

    if (isIos() && !isInStandaloneMode() && !sessionStorage.getItem('iosInstallPromptDismissed')) {
      setShowIosInstallPrompt(true);
    }
  }, []);

  const handleIosInstallPromptClose = () => {
    sessionStorage.setItem('iosInstallPromptDismissed', 'true');
    setShowIosInstallPrompt(false);
  };
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView, selectedTournament, selectedClub, selectedTeam]);

  const renderView = () => {
    if (authLoading && (currentView === 'admin' || currentView === 'login')) {
      return <div className="text-center p-8 text-text-secondary">Checking authentication...</div>;
    }
    
    const isAdminTypeUser = userProfile && userProfile.role !== 'user';

    switch (currentView) {
      case 'home':
        return <HomeView onNavigate={handleNavigate} onSelectTournament={handleSelectTournament} />;
      case 'tournaments':
        return <TournamentsView onSelectTournament={handleSelectTournament} />;
      case 'clubs':
        return <ClubsView onSelectClub={handleSelectClub} />;
      case 'players':
        return <PlayersView />;
      case 'rules':
        return <RulesView />;
      case 'tournament-detail':
        return selectedTournament ? <TournamentDetailView tournament={selectedTournament} onBack={handleBackToTournaments} /> : <TournamentsView onSelectTournament={handleSelectTournament} />;
      case 'club-detail':
        return selectedClub ? <ClubDetailView club={selectedClub} onSelectTeam={handleSelectTeam} onBack={handleBackToClubs} /> : <ClubsView onSelectClub={handleSelectClub} />;
      case 'team-detail':
        return selectedTeam ? <TeamDetailView team={selectedTeam} onBack={handleBackToClubs} /> : <ClubsView onSelectClub={handleSelectClub} />;
      case 'admin':
        return isAdminTypeUser ? <AdminView /> : null;
      case 'login':
        return <LoginView onLoginSuccess={handleLoginSuccess} />;
      default:
        return <HomeView onNavigate={handleNavigate} onSelectTournament={handleSelectTournament} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <Header currentView={currentView} onNavigate={handleNavigate} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderView()}
      </main>
      <Footer />
      {showIosInstallPrompt && <AddToHomeScreenPrompt onClose={handleIosInstallPromptClose} />}
    </div>
  );
};

const App: React.FC = () => {
    return (
        <>
            <SupabaseProvider client={supabaseClient}>
                <AuthProvider>
                    <SportsDataProvider>
                        <AppContent />
                    </SportsDataProvider>
                </AuthProvider>
            </SupabaseProvider>
            <Analytics />
        </>
    );
};

export default App;