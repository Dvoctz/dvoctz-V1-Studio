
import React, { useState } from 'react';
import type { View } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const NavLink: React.FC<{
  view: View;
  currentView: View;
  onNavigate: (view: View) => void;
  children: React.ReactNode;
}> = ({ view, currentView, onNavigate, children }) => {
  const isActive = currentView === view || (view === 'admin' && currentView === 'login');
  return (
    <button
      onClick={() => onNavigate(view)}
      className={`relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 w-full text-left md:w-auto md:text-center group overflow-hidden ${
        isActive
          ? 'text-primary bg-highlight shadow-glow'
          : 'text-text-secondary hover:text-white'
      }`}
    >
      {!isActive && (
         <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></span>
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};


export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();

  const handleNavClick = (view: View) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };
  
  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsMenuOpen(false);
    onNavigate('home');
    await logout();
  }
  
  const handleRefresh = () => {
      window.location.reload();
  };

  const getAdminLinkText = () => {
    if (userProfile?.role === 'admin') return 'Admin Panel';
    if (userProfile?.role === 'fixture_manager') return 'Fixture Manager';
    if (userProfile?.role === 'team_manager') return 'Team Manager';
    if (userProfile?.role === 'content_editor') return 'Editor Panel';
    return 'Admin Login';
  }

  return (
    <header className="bg-primary/80 backdrop-blur-xl border-b border-white/5 shadow-2xl sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => handleNavClick('home')}>
             <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#806B2A] rounded-xl shadow-glow group-hover:scale-105 transition-transform duration-300">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2 12h20" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
                 </svg>
             </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-widest leading-none drop-shadow-sm uppercase">DVOC <span className="text-highlight">TZ</span></span>
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.3em] mt-0.5">Volleyball Platform</span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-1 lg:space-x-2 bg-secondary/50 p-1.5 rounded-full border border-white/5">
            <NavLink view="home" currentView={currentView} onNavigate={onNavigate}>Home</NavLink>
            <NavLink view="tournaments" currentView={currentView} onNavigate={onNavigate}>Tournaments</NavLink>
            <NavLink view="clubs" currentView={currentView} onNavigate={onNavigate}>Clubs</NavLink>
            <NavLink view="players" currentView={currentView} onNavigate={onNavigate}>Players</NavLink>
            <NavLink view="awards" currentView={currentView} onNavigate={onNavigate}>Awards</NavLink>
            <NavLink view="transfers" currentView={currentView} onNavigate={onNavigate}>Transfers</NavLink>
            <NavLink view="rules" currentView={currentView} onNavigate={onNavigate}>Rules</NavLink>
            <NavLink view="admin" currentView={currentView} onNavigate={onNavigate}>
              {getAdminLinkText()}
            </NavLink>
          </nav>
          
          <div className="hidden xl:flex items-center space-x-4">
               {currentUser && (
                <button type="button" onClick={handleLogout} className="text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-red-400 transition-colors duration-300">
                  Logout
                </button>
              )}
              <button 
                  type="button"
                  onClick={handleRefresh} 
                  className="p-2.5 bg-secondary/80 border border-white/5 text-text-secondary hover:bg-highlight hover:text-primary rounded-full shadow-md transition-all duration-300 group"
                  title="Refresh App Data"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
              </button>
          </div>

           {/* Mobile Controls */}
           <div className="xl:hidden flex items-center gap-3">
            <button 
                type="button"
                onClick={handleRefresh} 
                className="p-2 bg-secondary/80 border border-white/5 text-text-secondary hover:bg-highlight hover:text-primary rounded-full transition-all duration-300 group shadow-md"
                aria-label="Refresh App"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
            </button>
            <button type="button" onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-secondary/80 border border-white/5 text-white hover:bg-highlight hover:text-primary rounded-lg transition-all duration-300 shadow-md" aria-controls="mobile-menu" aria-expanded={isMenuOpen}>
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
       {isMenuOpen && (
        <div className="xl:hidden bg-secondary border-t border-white/5 shadow-2xl absolute w-full" id="mobile-menu">
          <nav className="px-4 py-6 space-y-2 flex flex-col">
            <NavLink view="home" currentView={currentView} onNavigate={handleNavClick}>Home</NavLink>
            <NavLink view="tournaments" currentView={currentView} onNavigate={handleNavClick}>Tournaments</NavLink>
            <NavLink view="clubs" currentView={currentView} onNavigate={handleNavClick}>Clubs</NavLink>
            <NavLink view="players" currentView={currentView} onNavigate={handleNavClick}>Players</NavLink>
            <NavLink view="awards" currentView={currentView} onNavigate={handleNavClick}>Awards</NavLink>
            <NavLink view="transfers" currentView={currentView} onNavigate={handleNavClick}>Transfers</NavLink>
            <NavLink view="rules" currentView={currentView} onNavigate={handleNavClick}>Rules</NavLink>
            <div className="border-t border-accent/30 my-2 pt-2"></div>
            <NavLink view="admin" currentView={currentView} onNavigate={handleNavClick}>
              {getAdminLinkText()}
            </NavLink>
             {currentUser && (
              <button type="button" onClick={handleLogout} className="px-4 py-3 rounded-xl text-sm font-bold transition-colors duration-300 w-full text-left bg-red-900/20 text-red-400 hover:bg-red-900/40 mt-2">
                Logout
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
