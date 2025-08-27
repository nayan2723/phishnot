import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Share2, Clock, Mail, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';

interface AnalysisHistoryItem {
  id: string;
  sender: string;
  subject: string;
  emailBody: string;
  isPhishing: boolean;
  confidence: number;
  reasons: string[];
  analyzedAt: string;
  uploadedFile?: {
    filename: string;
    fileType: string;
    fileSize: number;
  };
}

interface HistoryStats {
  total: number;
  phishing: number;
  safe: number;
  averageConfidence: number;
}

export const AnalysisHistory = () => {
  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [statistics, setStatistics] = useState<HistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Make a direct fetch call with query parameter
      const response = await fetch(`https://jpxnekifttziwkiiptlv.supabase.co/functions/v1/history?clerk_user_id=${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweG5la2lmdHR6aXdraWlwdGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDk0NDgsImV4cCI6MjA3MTQyNTQ0OH0.WDLMYC66wqJC_FSXuLzoIXb2WiPzM9Vo0hmYBaULDIY`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setAnalyses(data.analyses || []);
      setStatistics(data.statistics || null);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load analysis history.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalysis = async (analysis: any, format: 'pdf' | 'csv') => {
    try {
      console.log('Starting export for analysis:', analysis.id, 'format:', format);
      
      const response = await fetch(`https://jpxnekifttziwkiiptlv.supabase.co/functions/v1/export-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweG5la2lmdHR6aXdraWlwdGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDk0NDgsImV4cCI6MjA3MTQyNTQ0OH0.WDLMYC66wqJC_FSXuLzoIXb2WiPzM9Vo0hmYBaULDIY`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysis_id: analysis.id,
          format: format,
          clerk_user_id: user?.id
        })
      });

      console.log('Export response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export failed with error:', errorText);
        throw new Error(`Export failed: ${response.status} - ${errorText}`);
      }

      // Check if response is actually the file
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);

      if (contentType?.includes('application/json')) {
        // This means there was an error returned as JSON
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Download the file
      const blob = await response.blob();
      console.log('Downloaded blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Received empty file');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `phishnot-report-${analysis.id.substring(0, 8)}.${format}`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast({
        title: "Export Complete",
        description: `Analysis exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export analysis",
        variant: "destructive",
      });
    }
  };

  const shareAnalysis = async (analysis: any) => {
    try {
      const response = await fetch(`https://jpxnekifttziwkiiptlv.supabase.co/functions/v1/export-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweG5la2lmdHR6aXdraWlwdGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDk0NDgsImV4cCI6MjA3MTQyNTQ0OH0.WDLMYC66wqJC_FSXuLzoIXb2WiPzM9Vo0hmYBaULDIY`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysis_id: analysis.id,
          action: 'share',
          clerk_user_id: user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Share failed');
      }

      const data = await response.json();
      
      // Copy to clipboard
      await navigator.clipboard.writeText(data.shareUrl);

      toast({
        title: "Share Link Created",
        description: "Shareable link copied to clipboard! Valid for 7 days.",
      });
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Share Failed",
        description: "Failed to create share link",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="py-16 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your analysis history...</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">Analysis History</h2>
          <p className="text-lg text-muted-foreground">
            Review your previous email security scans and their results
          </p>
        </div>

        {/* Statistics */}
        {statistics && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Security Statistics</CardTitle>
              <CardDescription>Summary of your email analysis activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{statistics.total}</div>
                  <div className="text-sm text-muted-foreground">Total Scans</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{statistics.phishing}</div>
                  <div className="text-sm text-muted-foreground">Threats Detected</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{statistics.safe}</div>
                  <div className="text-sm text-muted-foreground">Safe Emails</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-info">
                    {Math.round(statistics.averageConfidence * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Confidence</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis List */}
        <div className="space-y-4">
          {analyses.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Analysis History</h3>
                <p className="text-muted-foreground">
                  Start scanning emails to build your analysis history.
                </p>
              </CardContent>
            </Card>
          ) : (
            analyses.map((analysis, index) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                    analysis.isPhishing ? 'border-destructive/30' : 'border-success/30'
                  }`}
                  onClick={() => setExpandedItem(
                    expandedItem === analysis.id ? null : analysis.id
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {analysis.isPhishing ? (
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-success" />
                          )}
                          <Badge variant={analysis.isPhishing ? 'destructive' : 'secondary'}>
                            {analysis.isPhishing ? 'Phishing' : 'Safe'}
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(analysis.confidence * 100)}% confidence
                          </Badge>
                          <div className="ml-auto flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportAnalysis(analysis, 'pdf');
                              }}
                              className="h-8 px-2"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                shareAnalysis(analysis);
                              }}
                              className="h-8 px-2"
                            >
                              <Share2 className="h-3 w-3 mr-1" />
                              Share
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium text-foreground truncate">
                            <span className="text-sm text-muted-foreground">From:</span> {analysis.sender}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            <span className="font-medium">Subject:</span> {analysis.subject || 'No subject'}
                          </div>
                          {analysis.uploadedFile && (
                            <div className="flex items-center gap-1 text-xs text-info">
                              <FileText className="w-3 h-3" />
                              {analysis.uploadedFile.filename}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {formatDate(analysis.analyzedAt)}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedItem === analysis.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 pt-4 border-t border-border"
                      >
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-sm text-foreground mb-2">Email Content:</h4>
                            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded max-h-32 overflow-y-auto">
                              {analysis.emailBody || 'No content available'}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-foreground mb-2">Analysis Reasons:</h4>
                            <ul className="space-y-1">
                              {analysis.reasons.map((reason, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {analyses.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={fetchHistory}>
              <Clock className="w-4 h-4 mr-2" />
              Refresh History
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};