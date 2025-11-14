
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
import { RulesView } from './views/RulesView';
import type { View, Tournament, Team } from './types';
import { SportsDataProvider } from './context/SportsDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initializeSupabase } from './supabaseClient';
import { SupabaseProvider } from './context/SupabaseContext';
import { Analytics } from '@vercel/analytics/react';
import { AddToHomeScreenPrompt } from './components/AddToHomeScreenPrompt';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [showIosInstallPrompt, setShowIosInstallPrompt] = useState(false);
  const [viewBeforeLogin, setViewBeforeLogin] = useState<View | null>(null);

  // This is the primary effect for handling auth-based navigation and redirects.
  // It ensures the user is on the correct page based on their login status and role.
  useEffect(() => {
    // Don't make decisions until the initial auth check is complete.
    if (authLoading) return;

    // --- Handle Logged-Out Users ---
    if (!currentUser) {
      // If a logged-out user tries to access a protected page, redirect them to login.
      if (currentView === 'admin') {
        setViewBeforeLogin(currentView); // Remember where they wanted to go
        setCurrentView('login');
      }
      return;
    }

    // --- Handle Logged-In Users ---
    if (userProfile) {
      // Don't show the login page to an already logged-in user. Redirect them.
      if (currentView === 'login') {
        const targetView = viewBeforeLogin || (userProfile.role === 'admin' ? 'admin' : 'home');
        setCurrentView(targetView);
        setViewBeforeLogin(null);
      }
      // If a user with the wrong role is on a protected page, send them home.
      else if (currentView === 'admin' && userProfile.role !== 'admin') {
        setCurrentView('home');
      }
    }
  }, [currentUser, userProfile, currentView, authLoading, viewBeforeLogin]);


  // Simplified navigation handler. It just sets the user's intended view.
  // The useEffect above handles the logic of whether they are allowed to see it.
  const handleNavigate = (view: View) => {
    setCurrentView(view);
    setSelectedTournament(null);
    setSelectedTeam(null);
  }

  const handleLoginSuccess = () => {
    // This function is now primarily handled by the main useEffect.
    // When login is successful, onAuthStateChange fires, userProfile is updated,
    // and the effect redirects the user from the 'login' view.
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
  }, [currentView, selectedTournament, selectedTeam]);

  const renderView = () => {
    // Show a loading indicator for protected routes while auth is being checked.
    if (authLoading && (currentView === 'admin' || currentView === 'login')) {
      return <div className="text-center p-8 text-text-secondary">Checking authentication...</div>;
    }

    switch (currentView) {
      case 'home':
        return <HomeView onNavigate={handleNavigate} onSelectTournament={handleSelectTournament} />;
      case 'tournaments':
        return <TournamentsView onSelectTournament={handleSelectTournament} />;
      case 'teams':
        return <TeamsView onSelectTeam={handleSelectTeam} />;
      case 'players':
        return <PlayersView />;
      case 'rules':
        return <RulesView />;
      case 'tournament-detail':
        return selectedTournament ? <TournamentDetailView tournament={selectedTournament} onBack={handleBackToTournaments} /> : <TournamentsView onSelectTournament={handleSelectTournament} />;
      case 'team-detail':
        return selectedTeam ? <TeamDetailView team={selectedTeam} onBack={handleBackToTeams} /> : <TeamsView onSelectTeam={handleSelectTeam} />;
      case 'admin':
        // The redirect effect handles unauthorized access, so if we reach here, the user should be an admin.
        // Rendering null prevents flashing content during the brief redirect period.
        return userProfile?.role === 'admin' ? <AdminView /> : null;
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
    const supabaseClient = initializeSupabase();

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
