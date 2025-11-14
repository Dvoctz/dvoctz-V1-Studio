
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
import { CaptainView } from './views/CaptainView';
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
  const { currentUser, userProfile } = useAuth();
  const [showIosInstallPrompt, setShowIosInstallPrompt] = useState(false);

  const handleNavigate = (view: View) => {
    if (view === 'admin') {
      if (!currentUser) {
        setCurrentView('login');
      } else if (userProfile?.role === 'admin') {
        setCurrentView('admin');
      } else if (userProfile?.role === 'captain') {
        setCurrentView('captain');
      } else {
         setCurrentView('home'); // Fallback for non-admin/captain users
      }
    } else {
      setCurrentView(view);
    }
    setSelectedTournament(null);
    setSelectedTeam(null);
  }

  const handleLoginSuccess = () => {
    // AuthContext will trigger a profile fetch, then we route
    if (userProfile?.role === 'admin') {
        setCurrentView('admin');
    } else if (userProfile?.role === 'captain') {
        setCurrentView('captain');
    } else {
       // A small delay to allow the AuthContext to update with the new user profile
      setTimeout(() => {
        const role = userProfile?.role;
        if (role === 'admin') {
          setCurrentView('admin');
        } else if (role === 'captain') {
          setCurrentView('captain');
        } else {
          setCurrentView('home'); // Fallback
        }
      }, 200);
    }
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
    // Logic to show the install prompt on iOS devices
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    // Detects if the app is in standalone mode (already on the home screen).
    // FIX: The following line was an unformatted comment causing multiple errors. It has been properly commented out.
    // The `standalone` property is a non-standard API supported by Safari on iOS.
    const isInStandaloneMode = () => ('standalone' in window.navigator) && ((window.navigator as any).standalone);

    // Show the prompt only if it's an iOS device, not in standalone mode, and hasn't been dismissed this session.
    if (isIos() && !isInStandaloneMode()) {
      if (!sessionStorage.getItem('iosInstallPromptDismissed')) {
        setShowIosInstallPrompt(true);
      }
    }
  }, []);

  const handleIosInstallPromptClose = () => {
    sessionStorage.setItem('iosInstallPromptDismissed', 'true');
    setShowIosInstallPrompt(false);
  };
  
  // Reset scroll on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView, selectedTournament, selectedTeam]);

  useEffect(() => {
    // If user logs out while on admin/captain page, redirect to home
    if (!currentUser && (currentView === 'admin' || currentView === 'captain')) {
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
      case 'rules':
        return <RulesView />;
      case 'tournament-detail':
        return selectedTournament ? <TournamentDetailView tournament={selectedTournament} onBack={handleBackToTournaments} /> : <TournamentsView onSelectTournament={handleSelectTournament} />;
      case 'team-detail':
        return selectedTeam ? <TeamDetailView team={selectedTeam} onBack={handleBackToTeams} /> : <TeamsView onSelectTeam={handleSelectTeam} />;
      case 'admin':
        return currentUser && userProfile?.role === 'admin' ? <AdminView /> : <LoginView onLoginSuccess={handleLoginSuccess} />;
      case 'captain':
        return currentUser && userProfile?.role === 'captain' ? <CaptainView /> : <LoginView onLoginSuccess={handleLoginSuccess} />;
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
      {showIosInstallPrompt && <AddToHomeScreenPrompt onClose={handleIosInstallPromptClose} />}
    </div>
  );
};


const App: React.FC = () => {
    // Initialize the client directly. It will throw an error during development
    // if credentials in supabaseClient.ts are not set, preventing a broken deployment.
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
