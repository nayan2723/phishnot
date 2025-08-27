import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Mail,
  BarChart3,
  Download,
  Share2,
  Bell,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DashboardData {
  user_analytics: {
    total_scans: number;
    phishing_detected: number;
    safe_emails: number;
    last_scan_at: string | null;
  };
  period_analytics: {
    total_scans: number;
    phishing_detected: number;
    safe_emails: number;
    avg_confidence: number;
  };
  daily_breakdown: Array<{
    date: string;
    total: number;
    phishing: number;
    safe: number;
  }>;
  top_domains: Array<{
    domain: string;
    count: number;
  }>;
  recent_activity: Array<{
    id: string;
    date: string;
    sender: string;
    subject: string;
    result: 'phishing' | 'safe';
    confidence: number;
  }>;
  threat_trends: {
    increasing: boolean;
    percentage_change: number;
  };
  rate_limit: {
    requests_used: number;
    requests_limit: number;
    reset_time: string;
  };
  recent_alerts: Array<{
    id: string;
    alert_type: string;
    message: string;
    sent_at: string;
    read_at: string | null;
  }>;
}

interface DashboardProps {
  clerkUserId: string;
}

export default function Dashboard({ clerkUserId }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('analytics', {
        body: { clerk_user_id: clerkUserId, period }
      });

      if (error) throw error;
      setData(result);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clerkUserId) {
      fetchDashboardData();
    }
  }, [clerkUserId, period]);

  const exportAnalytics = async (format: 'pdf' | 'csv') => {
    try {
      // Create a summary analysis for export
      const summaryAnalysis = {
        id: 'dashboard-summary',
        sender_email: 'Dashboard Summary',
        subject: `Analytics Report - ${period.charAt(0).toUpperCase() + period.slice(1)}`,
        is_phishing: false,
        confidence_score: 100,
        analysis_reasons: [
          `Total scans: ${data?.period_analytics.total_scans || 0}`,
          `Phishing detected: ${data?.period_analytics.phishing_detected || 0}`,
          `Safe emails: ${data?.period_analytics.safe_emails || 0}`,
          `Average confidence: ${data?.period_analytics.avg_confidence || 0}%`,
          ...(data?.top_domains.map(d => `Top domain: ${d.domain} (${d.count} emails)`) || [])
        ],
        analyzed_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase.functions.invoke('export-report', {
        body: {
          analysis_id: 'dashboard-summary',
          format,
          clerk_user_id: clerkUserId,
          custom_analysis: summaryAnalysis
        }
      });

      if (error) throw error;

      toast({
        title: "Export Complete",
        description: `Dashboard analytics exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export analytics",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded-lg w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 bg-white/10 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p>Failed to load dashboard data</p>
          <Button onClick={fetchDashboardData} className="mt-4">Retry</Button>
        </Card>
      </div>
    );
  }

  const phishingRate = data.user_analytics.total_scans > 0 
    ? Math.round((data.user_analytics.phishing_detected / data.user_analytics.total_scans) * 100)
    : 0;

  const rateLimitPercentage = (data.rate_limit.requests_used / data.rate_limit.requests_limit) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Security Dashboard</h1>
            <p className="text-white/70">Monitor your email security analytics and insights</p>
          </div>
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
              <TabsList className="bg-white/10">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button 
              onClick={() => exportAnalytics('pdf')} 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {data.recent_alerts.length > 0 && (
          <Card className="border-orange-500/50 bg-orange-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-orange-700">Recent Security Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recent_alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-orange-800">{alert.message}</p>
                    <p className="text-xs text-orange-600 mt-1">
                      {new Date(alert.sent_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Scans</CardTitle>
              <Mail className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{data.user_analytics.total_scans}</div>
              <p className="text-xs text-blue-200 mt-1">
                {data.period_analytics.total_scans} this {period}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">Phishing Detected</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{data.user_analytics.phishing_detected}</div>
              <p className="text-xs text-red-200 mt-1">
                {phishingRate}% of total scans
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Safe Emails</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{data.user_analytics.safe_emails}</div>
              <p className="text-xs text-green-200 mt-1">
                {100 - phishingRate}% of total scans
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Avg Confidence</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{data.period_analytics.avg_confidence}%</div>
              <p className="text-xs text-purple-200 mt-1">
                Analysis accuracy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rate Limit & Threat Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">API Usage</CardTitle>
              <CardDescription className="text-white/70">
                Current rate limit usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Requests used</span>
                <span className="text-white font-medium">
                  {data.rate_limit.requests_used} / {data.rate_limit.requests_limit}
                </span>
              </div>
              <Progress value={rateLimitPercentage} className="h-2" />
              <p className="text-xs text-white/60">
                Resets at {new Date(data.rate_limit.reset_time).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span>Threat Trends</span>
                {data.threat_trends.increasing ? (
                  <TrendingUp className="h-4 w-4 text-red-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-400" />
                )}
              </CardTitle>
              <CardDescription className="text-white/70">
                Phishing detection trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-2">
                {Math.abs(data.threat_trends.percentage_change)}%
              </div>
              <p className="text-sm text-white/70">
                {data.threat_trends.increasing ? 'Increase' : 'Decrease'} in phishing detection
              </p>
              <Badge 
                variant={data.threat_trends.increasing ? "destructive" : "default"}
                className="mt-2"
              >
                {data.threat_trends.increasing ? 'Increasing Threats' : 'Stable Security'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Top Domains */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-white/70">
                Latest email scans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recent_activity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {activity.subject || 'No Subject'}
                      </p>
                      <p className="text-xs text-white/60 truncate">
                        from {activity.sender}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge 
                        variant={activity.result === 'phishing' ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {activity.result === 'phishing' ? 'Phishing' : 'Safe'}
                      </Badge>
                      <span className="text-xs text-white/60">
                        {activity.confidence}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Top Email Domains</CardTitle>
              <CardDescription className="text-white/70">
                Most scanned domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.top_domains.map((domain, index) => (
                  <div key={domain.domain} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-white/60">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {domain.domain}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-white border-white/20">
                      {domain.count} scans
                    </Badge>
                  </div>
                ))}
                {data.top_domains.length === 0 && (
                  <p className="text-white/60 text-center py-4">
                    No domain data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}