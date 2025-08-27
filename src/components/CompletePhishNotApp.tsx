import React, { useState } from 'react';
import { Shield, Menu, X } from 'lucide-react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveScanner } from './ResponsiveScanner';
import { AnalysisHistory } from './AnalysisHistory';
import Dashboard from './Dashboard';
import NotificationSettings from './NotificationSettings';
import AlertsDropdown from './AlertsDropdown';
import { Logo } from './Logo';

export default function CompletePhishNotApp() {
  const [currentView, setCurrentView] = useState<'scanner' | 'history' | 'dashboard' | 'settings'>('scanner');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to PhishNot</h1>
          <p className="text-white/70 mb-6">Please sign in to access your security dashboard</p>
        </div>
      </div>
    );
  }

  const clerkUserId = user.id;

  const navigationItems = [
    { id: 'scanner', label: '🔍 Scanner', icon: '🔍' },
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'history', label: '📋 History', icon: '📋' },
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Logo size="md" className="text-primary" />
              <div>
                <h1 className="text-xl font-bold text-white">PhishNot</h1>
                <p className="text-xs text-white/60">AI-Powered Security</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  onClick={() => setCurrentView(item.id as any)}
                  className={`bg-white/10 border-white/20 text-white hover:bg-white/20 ${
                    currentView === item.id ? 'bg-white/20 border-white/40' : ''
                  }`}
                >
                  {item.label}
                </Button>
              ))}
            </nav>

            {/* User Area */}
            <div className="flex items-center space-x-4">
              <AlertsDropdown 
                clerkUserId={clerkUserId} 
                onSettingsClick={() => setCurrentView('settings')}
              />
              
              <div className="hidden sm:flex items-center space-x-2 text-white/70">
                <span className="text-sm">{user.emailAddresses[0]?.emailAddress}</span>
              </div>

              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  }
                }}
              />

              {/* Mobile Menu Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2">
                {navigationItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    onClick={() => {
                      setCurrentView(item.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`bg-white/10 border-white/20 text-white hover:bg-white/20 ${
                      currentView === item.id ? 'bg-white/20 border-white/40' : ''
                    }`}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        {currentView === 'scanner' && <ResponsiveScanner clerkUserId={clerkUserId} />}
        {currentView === 'history' && <AnalysisHistory clerkUserId={clerkUserId} />}
        {currentView === 'dashboard' && <Dashboard clerkUserId={clerkUserId} />}
        {currentView === 'settings' && <NotificationSettings clerkUserId={clerkUserId} />}
      </main>

      {/* Status Bar */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm text-white/60">
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-green-500/50 text-green-400">
                ✓ System Online
              </Badge>
              <span>Connected to PhishNot Security Network</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>© 2025 PhishNot</span>
              <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                v2.0 Advanced
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}