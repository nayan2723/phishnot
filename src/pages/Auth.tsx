import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect authenticated users to home
    const checkAuth = () => {
      const user = document.querySelector('[data-clerk-user]');
      if (user) {
        navigate('/');
      }
    };
    
    // Check immediately and set up a periodic check
    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background font-cyber flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-10 h-10 text-primary glow-primary" />
            <div>
              <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                PhishNot
              </h1>
              <p className="text-xs text-muted-foreground">Don't get hooked.</p>
            </div>
          </div>
          <p className="text-muted-foreground">
            Sign in or create an account to start protecting yourself
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-elevated gradient-card border-border/40">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              Welcome to PhishNot
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Secure email analysis with AI-powered phishing detection
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <SignedOut>
              <div className="space-y-4">
                <SignInButton fallbackRedirectUrl="/" forceRedirectUrl="/">
                  <Button className="w-full glow-primary" size="lg">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton fallbackRedirectUrl="/" forceRedirectUrl="/">
                  <Button variant="outline" className="w-full border-border/40" size="lg">
                    Create Account
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">You are signed in!</p>
                <div className="flex justify-center">
                  <UserButton />
                </div>
                <Button 
                  onClick={() => navigate('/')} 
                  className="w-full glow-primary"
                  size="lg"
                >
                  Go to App
                </Button>
              </div>
            </SignedIn>
          </CardContent>
        </Card>
        
        {/* Security Note */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Shield className="w-4 h-4 inline mr-1" />
          Your data is encrypted and secure
        </div>
      </div>
    </div>
  );
};

export default Auth;