import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Globe, TrendingUp, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ThreatStats {
  totalThreats: number;
  blockedToday: number;
  activeUsers: number;
  uptime: string;
}

export const ThreatIntelligence = () => {
  const [stats, setStats] = useState<ThreatStats>({
    totalThreats: 0,
    blockedToday: 0,
    activeUsers: 0,
    uptime: '99.9%'
  });

  const [recentThreats] = useState([
    {
      id: 1,
      type: 'Phishing',
      source: 'fake-bank-login.com',
      threat: 'High',
      timestamp: '2 min ago'
    },
    {
      id: 2,
      type: 'Malware',
      source: 'suspicious-download.exe',
      threat: 'Critical',
      timestamp: '5 min ago'
    },
    {
      id: 3,
      type: 'Spam',
      source: 'lottery-winner@scam.net',
      threat: 'Medium',
      timestamp: '8 min ago'
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalThreats: prev.totalThreats + Math.floor(Math.random() * 3),
        blockedToday: prev.blockedToday + Math.floor(Math.random() * 2),
        activeUsers: 12847 + Math.floor(Math.random() * 100)
      }));
    }, 3000);

    // Initialize with some base numbers
    setStats({
      totalThreats: 892341,
      blockedToday: 1247,
      activeUsers: 12847,
      uptime: '99.9%'
    });

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="text-center mb-12"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-4xl font-bold text-foreground mb-4"
          >
            Real-Time Threat Intelligence
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Our AI-powered system continuously monitors and analyzes threats from across the globe
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={itemVariants}>
            <Card className="text-center gradient-card border-border/40 hover-lift">
              <CardContent className="pt-6">
                <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stats.totalThreats.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Threats Blocked</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="text-center gradient-card border-border/40 hover-lift">
              <CardContent className="pt-6">
                <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stats.blockedToday.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Blocked Today</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="text-center gradient-card border-border/40 hover-lift">
              <CardContent className="pt-6">
                <Users className="w-8 h-8 text-info mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stats.activeUsers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Protected Users</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="text-center gradient-card border-border/40 hover-lift">
              <CardContent className="pt-6">
                <TrendingUp className="w-8 h-8 text-success mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stats.uptime}</div>
                <div className="text-sm text-muted-foreground">System Uptime</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <motion.div variants={itemVariants}>
            <Card className="gradient-card border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Recent Threat Detections
                </CardTitle>
                <CardDescription>
                  Live feed of threats blocked by our AI system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentThreats.map((threat) => (
                    <motion.div
                      key={threat.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: threat.id * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{threat.type}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {threat.source}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            threat.threat === 'Critical' ? 'destructive' : 
                            threat.threat === 'High' ? 'default' : 
                            'secondary'
                          }
                          className="mb-1"
                        >
                          {threat.threat}
                        </Badge>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {threat.timestamp}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="gradient-card border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-success" />
                  Security Features
                </CardTitle>
                <CardDescription>
                  Advanced protection capabilities powered by AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      feature: 'AI-Powered Email Analysis',
                      description: 'Deep learning algorithms detect sophisticated phishing attempts',
                      status: 'Active'
                    },
                    {
                      feature: 'Real-time URL Scanning',
                      description: 'Instant verification of suspicious links and domains',
                      status: 'Active'
                    },
                    {
                      feature: 'Behavioral Pattern Recognition',
                      description: 'Identifies unusual sender patterns and social engineering',
                      status: 'Active'
                    },
                    {
                      feature: 'Threat Intelligence Feed',
                      description: 'Global database of known threats updated continuously',
                      status: 'Active'
                    }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{item.feature}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.status}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};