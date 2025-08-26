import { motion } from 'framer-motion';
import { Shield, Lock, Zap, Globe, Eye, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const SecurityFeatures = () => {
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

  const securityFeatures = [
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: 'Advanced AI Detection',
      description: 'Machine learning algorithms trained on millions of phishing patterns',
      status: 'Active'
    },
    {
      icon: <Zap className="w-6 h-6 text-warning" />,
      title: 'Real-time Analysis',
      description: 'Instant email scanning with results in under 2 seconds',
      status: 'Active'
    },
    {
      icon: <Globe className="w-6 h-6 text-info" />,
      title: 'Global Threat Database',
      description: 'Connected to international cybersecurity threat feeds',
      status: 'Active'
    },
    {
      icon: <Lock className="w-6 h-6 text-success" />,
      title: 'Privacy Protected',
      description: 'Your data is processed securely and never stored permanently',
      status: 'Active'
    },
    {
      icon: <Eye className="w-6 h-6 text-secondary" />,
      title: 'Pattern Recognition',
      description: 'Identifies sophisticated social engineering techniques',
      status: 'Active'
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-primary" />,
      title: 'Multi-Format Support',
      description: 'Analyzes .eml, .msg, and plain text email formats',
      status: 'Active'
    }
  ];

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
            Advanced Security Features
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Built with enterprise-grade security and cutting-edge AI technology
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {securityFeatures.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full gradient-card border-border/40 hover:border-primary/50 transition-all duration-300 hover-lift">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-background/50 border border-border/40">
                      {feature.icon}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {feature.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.div variants={itemVariants}>
            <Card className="max-w-4xl mx-auto gradient-card border-border/40">
              <CardContent className="p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Enterprise-Grade Protection for Everyone
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  PhishNot democratizes cybersecurity by bringing advanced threat detection capabilities 
                  typically reserved for large corporations to individuals and small organizations. 
                  Our AI-powered platform continuously learns and adapts to new threats, ensuring you 
                  stay protected against the latest phishing and social engineering attacks.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};