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
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 w-full text-left md:w-auto md:text-center ${
        isActive
          ? 'bg-highlight text-white'
          : 'text-text-secondary hover:bg-accent hover:text-text-primary'
      }`}
    >
      {children}
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
  
  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    onNavigate('home');
  }

  const getAdminLinkText = () => {
    if (userProfile?.role === 'admin') return 'Admin Panel';
    return 'Admin Login';
  }

  return (
    <header className="bg-secondary shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => handleNavClick('home')}>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-highlight">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <span className="text-xl font-bold text-text-primary">DVOC Tanzania</span>
          </div>
          <nav className="hidden md:flex items-center space-x-2">
            <NavLink view="home" currentView={currentView} onNavigate={onNavigate}>Home</NavLink>
            <NavLink view="tournaments" currentView={currentView} onNavigate={onNavigate}>Tournaments</NavLink>
            <NavLink view="clubs" currentView={currentView} onNavigate={onNavigate}>Clubs</NavLink>
            <NavLink view="players" currentView={currentView} onNavigate={onNavigate}>Players</NavLink>
            <NavLink view="rules" currentView={currentView} onNavigate={onNavigate}>Rules</NavLink>
            <NavLink view="admin" currentView={currentView} onNavigate={onNavigate}>
              {getAdminLinkText()}
            </NavLink>
             {currentUser && (
              <button onClick={handleLogout} className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 text-text-secondary hover:bg-accent hover:text-text-primary">
                Logout
              </button>
            )}
          </nav>
           <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-text-secondary hover:text-white focus:outline-none p-2" aria-controls="mobile-menu" aria-expanded={isMenuOpen}>
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
       {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <nav className="px-2 pt-2 pb-4 space-y-1 sm:px-3 flex flex-col">
            <NavLink view="home" currentView={currentView} onNavigate={handleNavClick}>Home</NavLink>
            <NavLink view="tournaments" currentView={currentView} onNavigate={handleNavClick}>Tournaments</NavLink>
            <NavLink view="clubs" currentView={currentView} onNavigate={handleNavClick}>Clubs</NavLink>
            <NavLink view="players" currentView={currentView} onNavigate={handleNavClick}>Players</NavLink>
            <NavLink view="rules" currentView={currentView} onNavigate={handleNavClick}>Rules</NavLink>
            <NavLink view="admin" currentView={currentView} onNavigate={handleNavClick}>
              {getAdminLinkText()}
            </NavLink>
             {currentUser && (
              <button onClick={handleLogout} className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 w-full text-left text-text-secondary hover:bg-accent hover:text-text-primary">
                Logout
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};