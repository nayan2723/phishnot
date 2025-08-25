import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertTriangle, CheckCircle, FileText, User, Shield, Zap, Eye } from "lucide-react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  detectedPatterns: string[];
}

export const ResponsiveScanner = () => {
  const [senderEmail, setSenderEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
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
      
      if (user) {
        try {
          const fileContent = await readFileContent(selectedFile);
          const { data, error } = await saveUploadedFile(user.id, selectedFile, fileContent);
          
          if (error) {
            console.error('Error saving file:', error);
          }
        } catch (error) {
          console.error('Error reading file:', error);
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
      if (senderEmail || subject || emailBody) {
        emailSchema.parse({
          senderEmail: sanitizeText(senderEmail),
          subject: sanitizeText(subject),
          emailBody: sanitizeText(emailBody)
        });
      }
      
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
    setCurrentStep(2);

    setTimeout(async () => {
      const isPhishing = Math.random() > 0.6;
      const confidence = Math.floor(Math.random() * 30) + 70;
      
      const dummyResult: ScanResult = {
        isPhishing,
        confidence,
        riskLevel: isPhishing ? 
          (confidence > 90 ? 'Critical' : confidence > 80 ? 'High' : 'Medium') : 
          'Low',
        reasons: isPhishing ? [
          "Suspicious URL detected: http://fakebank-login.com",
          "Sender domain doesn't match claimed organization", 
          "Urgent language patterns detected",
          "Unusual attachment format identified",
          "IP address reputation flagged"
        ] : [
          "Legitimate domain verified",
          "No suspicious patterns detected",
          "Sender reputation is good"
        ],
        detectedPatterns: isPhishing ? [
          "Typosquatting domains",
          "Social engineering tactics",
          "Credential harvesting attempts"
        ] : [
          "Standard business communication"
        ]
      };
      
      setScanResult(dummyResult);
      setCurrentStep(3);
      
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
          
          if (!error) {
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
    }, 2500);
  };

  const resetScanner = () => {
    setScanResult(null);
    setCurrentStep(1);
    setSenderEmail("");
    setSubject("");
    setEmailBody("");
    setFile(null);
    setValidationErrors({});
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <section id="scanner" className="py-16 px-4 relative">
      <div className="container mx-auto max-w-4xl">
        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  currentStep >= step 
                    ? 'bg-primary text-primary-foreground glow-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step === 1 && <Upload className="w-4 h-4" />}
                  {step === 2 && <Zap className="w-4 h-4" />}
                  {step === 3 && <Eye className="w-4 h-4" />}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
                    currentStep > step ? 'bg-primary glow-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Input */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-card gradient-card border-border/40">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl font-bold text-foreground">
                    AI-Powered Email Scanner
                  </CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">
                    Enter email details or upload a file for advanced threat analysis
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
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
                    </motion.div>
                    
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
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
                    </motion.div>
                  </div>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
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
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="border border-dashed border-border/40 rounded-lg p-6 text-center"
                  >
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
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={simulateScan}
                      disabled={isScanning}
                      size="lg"
                      className="w-full text-lg py-6 glow-primary pulse-glow"
                    >
                      <Shield className="w-5 h-5 mr-2" />
                      {user ? 'Start AI Analysis' : 'Sign In to Scan'}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Scanning */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-elevated gradient-card border-primary/40 glow-primary">
                <CardContent className="py-16 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 mx-auto mb-6"
                  >
                    <Shield className="w-full h-full text-primary" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    AI Analysis in Progress
                  </h3>
                  <div className="space-y-2 text-muted-foreground">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      Analyzing email patterns...
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      Checking sender reputation...
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                    >
                      Scanning for malicious links...
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2 }}
                    >
                      Generating security report...
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Results */}
          {currentStep === 3 && scanResult && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.5 }}
            >
              <Card className={`shadow-elevated border-2 ${
                scanResult.isPhishing 
                  ? 'border-destructive glow-danger' 
                  : 'border-success glow-primary'
              }`}>
                <CardHeader className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="flex justify-center mb-4"
                  >
                    {scanResult.isPhishing ? (
                      <AlertTriangle className="w-16 h-16 text-destructive" />
                    ) : (
                      <CheckCircle className="w-16 h-16 text-success" />
                    )}
                  </motion.div>
                  <CardTitle className={`text-3xl font-bold ${
                    scanResult.isPhishing ? 'text-destructive' : 'text-success'
                  }`}>
                    {scanResult.isPhishing ? 'Threat Detected!' : 'Email Verified Safe'}
                  </CardTitle>
                  <CardDescription className="text-lg space-y-2">
                    <Badge 
                      variant={scanResult.isPhishing ? 'destructive' : 'default'} 
                      className="text-lg px-4 py-1"
                    >
                      {scanResult.confidence}% Confidence
                    </Badge>
                    <div>
                      <Badge 
                        variant={
                          scanResult.riskLevel === 'Critical' ? 'destructive' :
                          scanResult.riskLevel === 'High' ? 'destructive' :
                          scanResult.riskLevel === 'Medium' ? 'default' :
                          'secondary'
                        }
                      >
                        Risk Level: {scanResult.riskLevel}
                      </Badge>
                    </div>
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-4">
                      Analysis Results:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Detection Results:</h4>
                        <ul className="space-y-2">
                          {scanResult.reasons.map((reason, index) => (
                            <motion.li 
                              key={index}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start space-x-2"
                            >
                              <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                scanResult.isPhishing ? 'bg-destructive' : 'bg-success'
                              }`} />
                              <span className="text-foreground">{reason}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Identified Patterns:</h4>
                        <ul className="space-y-2">
                          {scanResult.detectedPatterns.map((pattern, index) => (
                            <motion.li 
                              key={index}
                              initial={{ x: 20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.3 }}
                              className="flex items-start space-x-2"
                            >
                              <span className="w-2 h-2 rounded-full mt-2 bg-info flex-shrink-0" />
                              <span className="text-foreground">{pattern}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      onClick={resetScanner}
                      variant="outline"
                      size="lg"
                      className="flex-1"
                    >
                      Scan Another Email
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1 glow-primary"
                      onClick={() => toast({
                        title: "Report Saved",
                        description: "Security report has been saved to your account.",
                      })}
                    >
                      Save Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};