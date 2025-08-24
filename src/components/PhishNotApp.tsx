import { useState } from "react";
import { Upload, AlertTriangle, CheckCircle, FileText, User } from "lucide-react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { emailSchema, validateFile, sanitizeText, type EmailFormData } from "@/utils/validation";
import { 
  saveUploadedFile, 
  saveEmailAnalysis, 
  readFileContent
} from "@/utils/database";

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const validation = validateFile(selectedFile);
      
      if (!validation.isValid) {
        toast({
          variant: "destructive",
          title: "File validation failed",
          description: validation.errors.join(", "),
        });
        return;
      }
      
      setFile(selectedFile);
      
      // Save file to database if user is logged in
      if (user) {
        try {
          const fileContent = await readFileContent(selectedFile);
          const { data, error } = await saveUploadedFile(user.id, selectedFile, fileContent);
          
          if (error) {
            console.error('Error saving file:', error);
            toast({
              variant: "destructive",
              title: "File Save Error",
              description: "File uploaded but couldn't save to database.",
            });
          }
        } catch (error) {
          console.error('Error reading file:', error);
          toast({
            variant: "destructive", 
            title: "File Read Error",
            description: "Could not read file contents.",
          });
        }
      }
      
      toast({
        title: "File uploaded successfully", 
        description: `${selectedFile.name} is ready for analysis.`,
      });
    }
  };

  const validateInputs = (): boolean => {
    const errors: Record<string, string> = {};
    
    try {
      // Validate form data if provided
      if (senderEmail || subject || emailBody) {
        emailSchema.parse({
          senderEmail: sanitizeText(senderEmail),
          subject: sanitizeText(subject),
          emailBody: sanitizeText(emailBody)
        });
      }
      
      // Check if at least one input method is provided
      if (!senderEmail && !subject && !emailBody && !file) {
        errors.general = "Please provide email details or upload a file";
      }
      
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => {
          errors[err.path[0]] = err.message;
        });
      }
      setValidationErrors(errors);
      return false;
    }
  };

  const simulateScan = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!validateInputs()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors and try again.",
      });
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setValidationErrors({});

    // Simulate API call with dummy data
    setTimeout(async () => {
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
      
      // Save analysis to database if user is logged in
      if (user) {
        try {
          const analysisData = {
            senderEmail: sanitizeText(senderEmail) || undefined,
            subject: sanitizeText(subject) || undefined,
            emailBody: sanitizeText(emailBody) || undefined,
            isPhishing: dummyResult.isPhishing,
            confidenceScore: dummyResult.confidence,
            analysisReasons: dummyResult.reasons
          };
          
          const { error } = await saveEmailAnalysis(user.id, analysisData);
          
          if (error) {
            console.error('Error saving analysis:', error);
            toast({
              variant: "destructive",
              title: "Save Error", 
              description: "Analysis completed but couldn't save to database.",
            });
          } else {
            toast({
              title: "Analysis Complete",
              description: "Email analysis saved to your history.",
            });
          }
        } catch (error) {
          console.error('Error saving analysis:', error);
        }
      }
      
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
              <Logo size="md" className="glow-primary" />
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
                <ThemeToggle />
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
            <div className="flex flex-col items-center mb-6">
              <Logo size="xl" className="mb-4 glow-primary" />
              <h1 className="text-5xl md:text-7xl font-bold gradient-primary bg-clip-text text-transparent">
                PhishNot
              </h1>
            </div>
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
                    onChange={(e) => setSenderEmail(sanitizeText(e.target.value))}
                    className={`bg-input border-border/40 ${validationErrors.senderEmail ? 'border-destructive' : ''}`}
                  />
                  {validationErrors.senderEmail && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.senderEmail}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Subject Line
                  </label>
                  <Input
                    type="text"
                    placeholder="Urgent: Verify your account"
                    value={subject}
                    onChange={(e) => setSubject(sanitizeText(e.target.value))}
                    className={`bg-input border-border/40 ${validationErrors.subject ? 'border-destructive' : ''}`}
                  />
                  {validationErrors.subject && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.subject}</p>
                  )}
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
                  onChange={(e) => setEmailBody(sanitizeText(e.target.value))}
                  className={`bg-input border-border/40 ${validationErrors.emailBody ? 'border-destructive' : ''}`}
                />
                {validationErrors.emailBody && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.emailBody}</p>
                )}
              </div>
              
              <div className="border border-dashed border-border/40 rounded-lg p-6 text-center">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-foreground hover:text-primary transition-colors">
                    Click to upload .eml, .txt, or .msg file (max 5MB)
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
                {validationErrors.general && (
                  <p className="text-sm text-destructive mt-2">{validationErrors.general}</p>
                )}
              </div>
              
              <Button
                onClick={simulateScan}
                disabled={isScanning}
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
                    <Logo size="sm" className="mr-2" />
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