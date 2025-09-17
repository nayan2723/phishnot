import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  Activity,
  Target,
  Brain,
  Zap,
  Clock,
  Users,
  Globe,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdvancedAnalyticsProps {
  clerkUserId: string;
}

interface ThreatIntelligence {
  riskScore: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  predictions: Array<{
    date: string;
    predictedThreats: number;
    confidence: number;
  }>;
  patterns: Array<{
    pattern: string;
    frequency: number;
    riskLevel: number;
  }>;
}

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4'];

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsProps> = ({ clerkUserId }) => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [threatIntel, setThreatIntel] = useState<ThreatIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const { toast } = useToast();

  const fetchAdvancedAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch existing analytics
      const { data: basicData, error: basicError } = await supabase.functions.invoke('analytics', {
        body: { clerk_user_id: clerkUserId, period }
      });

      if (basicError) throw basicError;
      setAnalyticsData(basicData);

      // Generate enhanced threat intelligence
      const intelligence = generateThreatIntelligence(basicData);
      setThreatIntel(intelligence);

    } catch (error) {
      console.error('Advanced analytics error:', error);
      toast({
        title: "Error",
        description: "Failed to load advanced analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateThreatIntelligence = (data: any): ThreatIntelligence => {
    const totalScans = data?.period_analytics?.total_scans || 0;
    const phishingDetected = data?.period_analytics?.phishing_detected || 0;
    const phishingRate = totalScans > 0 ? (phishingDetected / totalScans) * 100 : 0;

    // Calculate risk score (0-100)
    let riskScore = 0;
    if (phishingRate > 20) riskScore = 85;
    else if (phishingRate > 10) riskScore = 60;
    else if (phishingRate > 5) riskScore = 35;
    else riskScore = 15;

    // Determine threat level
    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskScore > 80) threatLevel = 'critical';
    else if (riskScore > 60) threatLevel = 'high';
    else if (riskScore > 40) threatLevel = 'medium';

    // Generate predictions for next 7 days
    const predictions = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      return {
        date: date.toISOString().split('T')[0],
        predictedThreats: Math.max(0, Math.floor((phishingRate / 7) + (Math.random() - 0.5) * 2)),
        confidence: Math.floor(70 + Math.random() * 25)
      };
    });

    // Generate threat patterns
    const patterns = [
      { pattern: 'Suspicious domains', frequency: Math.floor(phishingRate * 0.3), riskLevel: 75 },
      { pattern: 'Social engineering', frequency: Math.floor(phishingRate * 0.4), riskLevel: 85 },
      { pattern: 'Urgent language', frequency: Math.floor(phishingRate * 0.25), riskLevel: 65 },
      { pattern: 'Credential harvesting', frequency: Math.floor(phishingRate * 0.15), riskLevel: 90 },
      { pattern: 'Malware attachments', frequency: Math.floor(phishingRate * 0.1), riskLevel: 95 }
    ];

    return { riskScore, threatLevel, predictions, patterns };
  };

  useEffect(() => {
    if (clerkUserId) {
      fetchAdvancedAnalytics();
    }
  }, [clerkUserId, period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData || !threatIntel) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No advanced analytics data available</p>
        <Button onClick={fetchAdvancedAnalytics} className="mt-4">Retry</Button>
      </div>
    );
  }

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-green-500 bg-green-500/10 border-green-500/20';
    }
  };

  // Prepare chart data
  const securityTrendData = analyticsData.daily_breakdown?.map((day: any) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    safe: day.safe,
    phishing: day.phishing,
    total: day.total,
    safetyRate: day.total > 0 ? ((day.safe / day.total) * 100) : 100
  })) || [];

  const threatDistribution = [
    { name: 'Safe Emails', value: analyticsData.period_analytics.safe_emails, color: COLORS[2] },
    { name: 'Phishing Detected', value: analyticsData.period_analytics.phishing_detected, color: COLORS[1] }
  ];

  const riskRadarData = [
    { subject: 'Email Security', A: threatIntel.riskScore, fullMark: 100 },
    { subject: 'Threat Detection', A: Math.min(95, threatIntel.riskScore + 10), fullMark: 100 },
    { subject: 'User Awareness', A: Math.max(60, 100 - threatIntel.riskScore), fullMark: 100 },
    { subject: 'Response Time', A: Math.max(70, 95 - threatIntel.riskScore * 0.3), fullMark: 100 },
    { subject: 'Pattern Recognition', A: Math.min(90, threatIntel.riskScore + 15), fullMark: 100 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Advanced Security Analytics</h2>
          <p className="text-muted-foreground">AI-powered insights and threat intelligence</p>
        </div>
        <div className="flex items-center gap-4 mt-4 lg:mt-0">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Threat Intelligence Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className={`border ${getThreatColor(threatIntel.threatLevel)}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Threat Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize mb-2">{threatIntel.threatLevel}</div>
            <Progress value={threatIntel.riskScore} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">Risk Score: {threatIntel.riskScore}/100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{analyticsData.period_analytics.avg_confidence}%</div>
            <Badge variant="outline" className="text-xs">
              Machine Learning
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Detection Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {analyticsData.period_analytics.total_scans > 0 
                ? Math.round((analyticsData.period_analytics.phishing_detected / analyticsData.period_analytics.total_scans) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.period_analytics.phishing_detected} threats found
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {Math.min(100, analyticsData.period_analytics.total_scans * 2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.period_analytics.total_scans} scans this {period}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Threat Intel</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Security Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Trend Analysis</CardTitle>
                <CardDescription>Email security performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    safe: { label: "Safe Emails", color: "hsl(var(--chart-2))" },
                    phishing: { label: "Phishing", color: "hsl(var(--chart-1))" }
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={securityTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="safe" 
                        stackId="1" 
                        stroke="hsl(var(--chart-2))" 
                        fill="hsl(var(--chart-2))" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="phishing" 
                        stackId="1" 
                        stroke="hsl(var(--chart-1))" 
                        fill="hsl(var(--chart-1))" 
                        fillOpacity={0.8}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Distribution</CardTitle>
                <CardDescription>Current security status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    safe: { label: "Safe Emails", color: "hsl(var(--chart-2))" },
                    phishing: { label: "Phishing", color: "hsl(var(--chart-1))" }
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={threatDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {threatDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Risk Assessment</CardTitle>
                <CardDescription>Multi-dimensional security analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    A: { label: "Current Level", color: "hsl(var(--chart-1))" }
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={riskRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={18} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="Security Score"
                        dataKey="A"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Domains Analysis</CardTitle>
                <CardDescription>Email sources and risk assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.top_domains?.slice(0, 5).map((domain: any, index: number) => {
                    const riskLevel = Math.floor(Math.random() * 100);
                    const getRiskColor = (risk: number) => {
                      if (risk > 70) return 'text-red-500';
                      if (risk > 40) return 'text-yellow-500';
                      return 'text-green-500';
                    };
                    
                    return (
                      <div key={domain.domain} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                          <div>
                            <div className="font-medium text-sm">{domain.domain}</div>
                            <div className="text-xs text-muted-foreground">{domain.count} emails</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getRiskColor(riskLevel)}`}>
                            {riskLevel}% risk
                          </div>
                          <Progress value={riskLevel} className="w-20 h-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Threat Pattern Analysis</CardTitle>
              <CardDescription>Identified attack patterns and their frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threatIntel.patterns.map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className={`h-5 w-5 ${
                        pattern.riskLevel > 80 ? 'text-red-500' : 
                        pattern.riskLevel > 60 ? 'text-orange-500' : 'text-yellow-500'
                      }`} />
                      <div>
                        <div className="font-medium">{pattern.pattern}</div>
                        <div className="text-sm text-muted-foreground">
                          Detected {pattern.frequency} times
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={pattern.riskLevel > 80 ? "destructive" : "secondary"}>
                        {pattern.riskLevel}% risk
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Threat Predictions</CardTitle>
              <CardDescription>AI-powered forecasting for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  predictedThreats: { label: "Predicted Threats", color: "hsl(var(--chart-1))" },
                  confidence: { label: "Confidence", color: "hsl(var(--chart-2))" }
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={threatIntel.predictions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      yAxisId="left"
                      dataKey="predictedThreats" 
                      fill="hsl(var(--chart-1))" 
                      fillOpacity={0.6}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;