
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { TournamentsView } from './views/TournamentsView';
import { ClubsView } from './views/ClubsView';
import { PlayersView } from './views/PlayersView';
import { TransfersView } from './views/TransfersView';
import { AwardsView } from './views/AwardsView';
import { TournamentDetailView } from './views/TournamentDetailView';
import { ClubDetailView } from './views/ClubDetailView';
import { TeamDetailView } from './views/TeamDetailView';
import { PlayerDetailView } from './views/PlayerDetailView';
import { AdminView } from './views/AdminView';
import { LoginView } from './views/LoginView';
import { RulesView } from './views/RulesView';
import type { View, Tournament, Team, Club, Player } from './types';
import { SportsDataProvider, useSports } from './context/SportsDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initializeSupabase } from './supabaseClient';
import { SupabaseProvider } from './context/SupabaseContext';
import { Analytics } from '@vercel/analytics/react';
import { AddToHomeScreenPrompt } from './components/AddToHomeScreenPrompt';
import { ServiceWorkerManager } from './components/ServiceWorkerManager';

// Initialize the Supabase client once, outside of the component render cycle.
const supabaseClient = initializeSupabase();

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const { prefetchAllData } = useSports();
  
  const [showIosInstallPrompt, setShowIosInstallPrompt] = useState(false);
  const [viewBeforeLogin, setViewBeforeLogin] = useState<View | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);

  // SINGLE DATA FETCH: Instead of firing 11 separate requests that cause flickering,
  // we fire one consolidated request that loads everything in parallel and updates the UI once.
  useEffect(() => {
      const loadData = async () => {
          await prefetchAllData();
          setIsAppReady(true);
      };
      loadData();
  }, [prefetchAllData]);

  // Auto-refresh when app comes to foreground (tab switch, mobile unlock)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App is visible, refreshing data...');
        prefetchAllData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [prefetchAllData]);


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
    setSelectedPlayer(null);
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
  
  const handleSelectPlayer = (player: Player) => {
      setSelectedPlayer(player);
      setCurrentView('player-detail');
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
  
  const handleBackToPlayers = () => {
      setSelectedPlayer(null);
      setCurrentView('players');
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
  }, [currentView, selectedTournament, selectedClub, selectedTeam, selectedPlayer]);

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
        return <PlayersView onSelectPlayer={handleSelectPlayer} />;
      case 'awards':
        return <AwardsView onNavigate={handleNavigate} />;
      case 'transfers':
        return <TransfersView />;
      case 'rules':
        return <RulesView />;
      case 'tournament-detail':
        return selectedTournament ? <TournamentDetailView tournament={selectedTournament} onBack={handleBackToTournaments} /> : <TournamentsView onSelectTournament={handleSelectTournament} />;
      case 'club-detail':
        return selectedClub ? <ClubDetailView club={selectedClub} onSelectTeam={handleSelectTeam} onSelectPlayer={handleSelectPlayer} onBack={handleBackToClubs} /> : <ClubsView onSelectClub={handleSelectClub} />;
      case 'team-detail':
        return selectedTeam ? <TeamDetailView team={selectedTeam} onSelectPlayer={handleSelectPlayer} onBack={handleBackToClubs} /> : <ClubsView onSelectClub={handleSelectClub} />;
      case 'player-detail':
        return selectedPlayer ? <PlayerDetailView player={selectedPlayer} onBack={handleBackToPlayers} /> : <PlayersView onSelectPlayer={handleSelectPlayer} />;
      case 'admin':
        return isAdminTypeUser ? <AdminView /> : null;
      case 'login':
        return <LoginView onLoginSuccess={handleLoginSuccess} />;
      default:
        return <HomeView onNavigate={handleNavigate} onSelectTournament={handleSelectTournament} />;
    }
  };

  // LOADING SCREEN
  if (!isAppReady) {
      return (
          <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
              <div className="relative mb-8">
                  <div className="absolute inset-0 bg-highlight/30 blur-2xl rounded-full scale-150 animate-pulse"></div>
                  <div className="relative bg-secondary p-4 rounded-full border border-highlight/20 shadow-glow flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-highlight animate-spin" style={{ animationDuration: '3s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 2v4m0 14v4M2 12h4m14 0h4m-12.828-7.071l2.828 2.828m8.486 8.486l2.828 2.828M4.929 19.071l2.828-2.828m8.486-8.486l2.828-2.828" />
                     </svg>
                  </div>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-widest uppercase shadow-black drop-shadow-md">DVOC <span className="text-highlight">TZ</span></h1>
              <p className="text-text-secondary mt-2 tracking-widest text-xs uppercase animate-pulse">Initializing Platform...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <Header currentView={currentView} onNavigate={handleNavigate} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderView()}
      </main>
      <Footer />
      {showIosInstallPrompt && <AddToHomeScreenPrompt onClose={handleIosInstallPromptClose} />}
      <ServiceWorkerManager />
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
