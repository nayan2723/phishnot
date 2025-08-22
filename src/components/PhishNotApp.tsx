import { useState } from "react";
import { Shield, Upload, AlertTriangle, CheckCircle, FileText, User } from "lucide-react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ScanResult {
  isPhishing: boolean;
  confidence: number;
  reasons: string[];
}

const PhishNotApp = () => {
  const [senderEmail, setSenderEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast({
        title: "File uploaded successfully",
        description: `${selectedFile.name} is ready for analysis.`,
      });
    }
  };

  const simulateScan = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    // Simulate API call with dummy data
    setTimeout(() => {
      const dummyResult: ScanResult = {
        isPhishing: Math.random() > 0.5,
        confidence: Math.floor(Math.random() * 30) + 70, // 70-99%
        reasons: [
          "Suspicious URL found: http://fakebank-login.com",
          "Sender domain doesn't match claimed organization", 
          "Urgent language patterns detected",
          "Unusual attachment format identified"
        ]
      };
      setScanResult(dummyResult);
      setIsScanning(false);
    }, 1500);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background font-cyber">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-primary glow-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">PhishNot</h1>
                <p className="text-xs text-muted-foreground">Don't get hooked.</p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-6">
              <div className="hidden md:flex space-x-6">
                <button 
                  onClick={() => scrollToSection('hero')}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Home
                </button>
                <button 
                  onClick={() => scrollToSection('about')}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  About
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Contact
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                {user ? (
                  <>
                    <span className="text-sm text-muted-foreground hidden sm:block">
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
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-primary bg-clip-text text-transparent">
              PhishNot
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Don't get hooked.
            </p>
            <p className="text-lg text-foreground mb-12 max-w-2xl mx-auto">
              Paste any suspicious email and let AI analyze it for phishing risks. 
              Stay protected with advanced threat detection.
            </p>
            <Button 
              onClick={() => scrollToSection('scanner')}
              size="lg"
              className="text-lg px-8 py-4 glow-primary pulse-glow"
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Scanner Section */}
      <section id="scanner" className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-card gradient-card border-border/40">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-foreground">
                Email Threat Scanner
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Enter email details below or upload an email file for analysis
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sender Email
                  </label>
                  <Input
                    type="email"
                    placeholder="suspicious@example.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="bg-input border-border/40"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Subject Line
                  </label>
                  <Input
                    type="text"
                    placeholder="Urgent: Verify your account"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-input border-border/40"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Body
                </label>
                <Textarea
                  placeholder="Paste the email content here..."
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="bg-input border-border/40"
                />
              </div>
              
              <div className="border border-dashed border-border/40 rounded-lg p-6 text-center">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-foreground hover:text-primary transition-colors">
                    Click to upload .eml or .txt file
                  </span>
                  <input
                    type="file"
                    accept=".eml,.txt,.msg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {file && (
                  <p className="mt-2 text-sm text-primary">
                    ✓ {file.name} uploaded
                  </p>
                )}
              </div>
              
              <Button
                onClick={simulateScan}
                disabled={isScanning || (!senderEmail && !subject && !emailBody && !file)}
                size="lg"
                className={`w-full text-lg py-6 ${isScanning ? 'scan-pulse' : 'glow-primary'}`}
              >
                {isScanning ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
                    Analyzing Email...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    {user ? 'Scan Now' : 'Sign In to Scan'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Results Section */}
      {scanResult && (
        <section className="py-16 px-4 animate-fade-in">
          <div className="container mx-auto max-w-4xl">
            <Card className={`shadow-elevated border-2 ${
              scanResult.isPhishing 
                ? 'border-destructive glow-danger' 
                : 'border-success glow-primary'
            }`}>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {scanResult.isPhishing ? (
                    <AlertTriangle className="w-16 h-16 text-destructive" />
                  ) : (
                    <CheckCircle className="w-16 h-16 text-success" />
                  )}
                </div>
                <CardTitle className={`text-3xl font-bold ${
                  scanResult.isPhishing ? 'text-destructive' : 'text-success'
                }`}>
                  {scanResult.isPhishing ? 'Phishing Detected!' : 'Email Appears Safe'}
                </CardTitle>
                <CardDescription className="text-lg">
                  <Badge variant={scanResult.isPhishing ? 'destructive' : 'default'} className="text-lg px-4 py-1">
                    {scanResult.confidence}% Confidence
                  </Badge>
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">
                    Analysis Results:
                  </h3>
                  <ul className="space-y-2">
                    {scanResult.reasons.slice(0, scanResult.isPhishing ? 4 : 2).map((reason, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className={`w-2 h-2 rounded-full mt-2 ${
                          scanResult.isPhishing ? 'bg-destructive' : 'bg-success'
                        }`} />
                        <span className="text-foreground">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-foreground mb-8">About PhishNot</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            PhishNot helps users detect phishing attempts using AI-based analysis. 
            Simply paste your email content, and we'll highlight suspicious patterns, 
            malicious URLs, and other red flags that indicate potential threats. 
            Stay one step ahead of cybercriminals with advanced threat detection.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-border/40 py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center space-x-6 mb-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              GitHub
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              LinkedIn
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Portfolio
            </a>
          </div>
          <p className="text-muted-foreground">
            Made with ❤️ by Nayan
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PhishNotApp;