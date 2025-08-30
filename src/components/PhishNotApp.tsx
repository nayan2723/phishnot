import { useState } from "react";
import { Suspense } from "react";
import { Shield, Globe, Users, TrendingUp, User, Menu, X, History } from "lucide-react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { ResponsiveScanner } from "@/components/ResponsiveScanner";
import { SecurityFeatures } from "@/components/SecurityFeatures";
import { AnalysisHistory } from "@/components/AnalysisHistory";

const PhishNotApp = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'history'>('main');
  const { toast } = useToast();
  const { user } = useUser();
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background font-cyber relative overflow-x-hidden">
      {/* Enhanced Header with Mobile Support */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.button 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={() => scrollToSection('scanner')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Logo size="md" className="glow-primary" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">PhishNot</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">AI-Powered Cybersecurity</p>
              </div>
            </motion.button>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <div className="flex space-x-6">
                <button 
                  onClick={() => {
                    setCurrentView('main');
                    scrollToSection('hero');
                  }}
                  className={`transition-colors font-medium ${
                    currentView === 'main' ? 'text-primary' : 'text-foreground hover:text-primary'
                  }`}
                >
                  Home
                </button>
                <button 
                  onClick={() => {
                    setCurrentView('main');
                    scrollToSection('scanner');
                  }}
                  className={`transition-colors font-medium ${
                    currentView === 'main' ? 'text-foreground hover:text-primary' : 'text-foreground/60'
                  }`}
                >
                  Scanner
                </button>
                {user && (
                  <button 
                    onClick={() => setCurrentView('history')}
                    className={`transition-colors font-medium ${
                      currentView === 'history' ? 'text-primary' : 'text-foreground hover:text-primary'
                    }`}
                  >
                    <History className="w-4 h-4 mr-1 inline" />
                    History
                  </button>
                )}
                <button 
                  onClick={() => {
                    setCurrentView('main');
                    scrollToSection('intelligence');
                  }}
                  className={`transition-colors font-medium ${
                    currentView === 'main' ? 'text-foreground hover:text-primary' : 'text-foreground/60'
                  }`}
                >
                  Features
                </button>
                <button 
                  onClick={() => {
                    setCurrentView('main');
                    scrollToSection('about');
                  }}
                  className={`transition-colors font-medium ${
                    currentView === 'main' ? 'text-foreground hover:text-primary' : 'text-foreground/60'
                  }`}
                >
                  About
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                {user ? (
                  <>
                    <span className="text-sm text-muted-foreground hidden xl:block">
                      {user.emailAddresses[0]?.emailAddress}
                    </span>
                    <UserButton />
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/auth')}
                      className="border-border/40"
                    >
                      Sign In
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate('/auth')}
                      className="glow-primary"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </nav>

            {/* Mobile Navigation */}
            <div className="flex lg:hidden items-center space-x-3">
              <ThemeToggle />
              {user ? (
                <UserButton />
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="glow-primary"
                >
                  <User className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden mt-4 py-4 border-t border-border/40"
              >
                <div className="flex flex-col space-y-4">
                  <button 
                    onClick={() => {
                      setCurrentView('main');
                      scrollToSection('hero');
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-foreground hover:text-primary transition-colors font-medium text-left"
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentView('main');
                      scrollToSection('scanner');
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-foreground hover:text-primary transition-colors font-medium text-left"
                  >
                    Scanner
                  </button>
                  {user && (
                    <button 
                      onClick={() => {
                        setCurrentView('history');
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-foreground hover:text-primary transition-colors font-medium text-left flex items-center gap-2"
                    >
                      <History className="w-4 h-4" />
                      History
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setCurrentView('main');
                      scrollToSection('intelligence');
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-foreground hover:text-primary transition-colors font-medium text-left"
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentView('main');
                      scrollToSection('about');
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-foreground hover:text-primary transition-colors font-medium text-left"
                  >
                    About
                  </button>
                  {!user && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate('/auth');
                        setIsMobileMenuOpen(false);
                      }}
                      className="border-border/40 w-full justify-start"
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Content based on current view */}
      {currentView === 'main' && (
        <>
          {/* Enhanced Hero Section with Background Paths */}
          <section id="hero" className="relative py-20 sm:py-32 px-4 overflow-hidden">
            {/* Background Paths */}
            <div className="absolute inset-0 z-0">
              <BackgroundPaths />
            </div>
            
            {/* Content */}
            <div className="container mx-auto text-center relative z-10">
              <div className="max-w-5xl mx-auto">
                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="flex flex-col items-center mb-8"
                >
                  <Logo size="xl" className="mb-6 glow-primary" />
                  <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold gradient-primary bg-clip-text text-transparent mb-4">
                    PhishNot
                  </h1>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex items-center gap-4 mb-6"
                  >
                    <Badge variant="outline" className="text-primary border-primary/50">
                      AI-Powered
                    </Badge>
                    <Badge variant="outline" className="text-secondary border-secondary/50">
                      Real-time
                    </Badge>
                    <Badge variant="outline" className="text-info border-info/50">
                      Secure
                    </Badge>
                  </motion.div>
                </motion.div>
                
                <motion.p 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground mb-8 font-light"
                >
                  Advanced Cybersecurity at Your Fingertips
                </motion.p>
                
                <motion.p 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="text-base sm:text-lg text-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
                >
                  Leverage cutting-edge AI to detect phishing attempts, malicious links, and social engineering attacks. 
                  Our real-time analysis protects you from cyber threats before they can cause damage.
                </motion.p>
                
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                  <Button 
                    onClick={() => scrollToSection('scanner')}
                    size="lg"
                    className="text-lg px-8 py-6 glow-primary pulse-glow min-w-[200px]"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Start Scanning
                  </Button>
                  <Button 
                    onClick={() => scrollToSection('intelligence')}
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-6 border-border/40 min-w-[200px]"
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    View Features
                  </Button>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto"
                >
                  <Card className="text-center bg-background/80 backdrop-blur border-border/40">
                    <CardContent className="pt-4 pb-4">
                      <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium text-foreground">AI-Powered</div>
                      <div className="text-xs text-muted-foreground">Advanced Detection</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center bg-background/80 backdrop-blur border-border/40">
                    <CardContent className="pt-4 pb-4">
                      <Globe className="w-8 h-8 text-success mx-auto mb-2" />
                      <div className="text-sm font-medium text-foreground">Real-Time</div>
                      <div className="text-xs text-muted-foreground">Threat Analysis</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center bg-background/80 backdrop-blur border-border/40">
                    <CardContent className="pt-4 pb-4">
                      <Users className="w-8 h-8 text-info mx-auto mb-2" />
                      <div className="text-sm font-medium text-foreground">User-Friendly</div>
                      <div className="text-xs text-muted-foreground">Easy to Use</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center bg-background/80 backdrop-blur border-border/40">
                    <CardContent className="pt-4 pb-4">
                      <TrendingUp className="w-8 h-8 text-warning mx-auto mb-2" />
                      <div className="text-sm font-medium text-foreground">Continuous</div>
                      <div className="text-xs text-muted-foreground">Improvement</div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Enhanced Scanner Section */}
          <ResponsiveScanner />

          {/* Security Features Section */}
          <div id="intelligence">
            <SecurityFeatures />
          </div>

          {/* Enhanced About Section */}
          <section id="about" className="py-20 px-4 bg-muted/30 relative overflow-hidden">
            <div className="container mx-auto max-w-6xl">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                  The Future of Email Security
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  PhishNot represents the next generation of cybersecurity, combining advanced AI with real-time threat intelligence to protect you from the most sophisticated attacks.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-2xl font-bold text-foreground mb-6">
                    Why PhishNot Leads the Industry
                  </h3>
                  <div className="space-y-6">
                    {[
                      {
                        title: "Advanced AI Detection",
                        description: "Our machine learning algorithms analyze millions of data points to identify even the most sophisticated phishing attempts.",
                        icon: <Shield className="w-6 h-6 text-primary" />
                      },
                      {
                        title: "Real-Time Protection",
                        description: "Instant analysis and threat detection that adapts to new attack vectors as they emerge.",
                        icon: <TrendingUp className="w-6 h-6 text-success" />
                      },
                      {
                        title: "Global Intelligence Network",
                        description: "Connected to a worldwide network of threat intelligence sources for comprehensive protection.",
                        icon: <Globe className="w-6 h-6 text-info" />
                      },
                      {
                        title: "User-Centric Design",
                        description: "Built for everyone - from cybersecurity professionals to everyday users who need reliable protection.",
                        icon: <Users className="w-6 h-6 text-warning" />
                      }
                    ].map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ y: 30, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        viewport={{ once: true }}
                        className="flex items-start gap-4"
                      >
                        <div className="flex-shrink-0 p-2 rounded-lg bg-background/50 border border-border/40">
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <Card className="p-8 gradient-card border-border/40 shadow-elevated">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-4">
                        Mission Statement
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        "To democratize cybersecurity by providing enterprise-grade threat detection to everyone. 
                        We believe that advanced protection shouldn't be a luxury - it should be accessible, 
                        intuitive, and effective for all users."
                      </p>
                      <div className="mt-6 pt-6 border-t border-border/40">
                        <p className="text-sm text-muted-foreground italic">
                          — PhishNot Security Team
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Key Statistics */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6"
              >
                {[
                  { value: "99.9%", label: "Detection Accuracy", color: "text-primary" },
                  { value: "850K+", label: "Threats Blocked", color: "text-success" },
                  { value: "<1s", label: "Analysis Time", color: "text-info" },
                  { value: "24/7", label: "Protection", color: "text-warning" }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <Card className="text-center p-6 gradient-card border-border/40 hover-lift">
                      <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        </>
      )}
      
      {/* Analysis History View */}
      {currentView === 'history' && user && <AnalysisHistory />}

      {/* Footer */}
      <footer id="contact" className="border-t border-border/40 py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center space-x-6 mb-6">
            <a href="http://github.com/nayan2723" className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="http://www.linkedin.com/in/nayan-kshitij" className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href="https://nayan-dev.vercel.app/" className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
              Portfolio
            </a>
          </div>
          <p className="text-muted-foreground">
            Made with ☕ caffeine
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PhishNotApp;