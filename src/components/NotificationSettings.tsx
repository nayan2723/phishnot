import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Clock,
  Mail,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationPreferences {
  id?: string;
  clerk_user_id: string;
  email_alerts: boolean;
  phishing_threshold: number;
  alert_frequency: string;
  created_at?: string;
  updated_at?: string;
}

interface Alert {
  id: string;
  alert_type: string;
  message: string;
  sent_at: string;
  read_at: string | null;
  metadata: any;
}

interface NotificationSettingsProps {
  clerkUserId: string;
}

export default function NotificationSettings({ clerkUserId }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    clerk_user_id: clerkUserId,
    email_alerts: true,
    phishing_threshold: 3,
    alert_frequency: 'immediate'
  });
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Preferences load error:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading alerts:', error);
        return;
      }

      setAlerts(data || []);
    } catch (error) {
      console.error('Alerts load error:', error);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(preferences, { onConflict: 'clerk_user_id' });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save notification settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('user_alerts')
        .update({ read_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, read_at: new Date().toISOString() }
            : alert
        )
      );
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('user_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      toast({
        title: "Alert Deleted",
        description: "The alert has been removed.",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    }
  };

  const testAlert = async () => {
    try {
      const { error } = await supabase
        .from('user_alerts')
        .insert({
          clerk_user_id: clerkUserId,
          alert_type: 'test_alert',
          message: 'This is a test alert to verify your notification settings are working correctly.',
          metadata: { test: true }
        });

      if (error) throw error;

      toast({
        title: "Test Alert Sent",
        description: "A test alert has been created. Check the Alerts tab to see it.",
      });

      // Reload alerts to show the new test alert
      await loadAlerts();
    } catch (error) {
      console.error('Test alert error:', error);
      toast({
        title: "Test Failed",
        description: "Failed to create test alert",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (clerkUserId) {
      setLoading(true);
      Promise.all([loadPreferences(), loadAlerts()])
        .finally(() => setLoading(false));
    }
  }, [clerkUserId]);

  const unreadAlerts = alerts.filter(alert => !alert.read_at);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded-lg w-64"></div>
            <div className="h-64 bg-white/10 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notification Settings</h1>
          <p className="text-white/70">Configure alerts and manage your security notifications</p>
        </div>

        <Tabs defaultValue="preferences" className="space-y-6">
          <TabsList className="bg-white/10">
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts
              {unreadAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preferences">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-white/70">
                  Customize when and how you receive security alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Alerts Toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-white font-medium">Email Alerts</Label>
                    <p className="text-sm text-white/70">
                      Receive email notifications for security threats
                    </p>
                  </div>
                  <Switch
                    checked={preferences.email_alerts}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, email_alerts: checked }))
                    }
                  />
                </div>

                {/* Phishing Threshold */}
                <div className="space-y-3">
                  <Label className="text-white font-medium">Phishing Alert Threshold</Label>
                  <p className="text-sm text-white/70">
                    Get alerted when you scan this many phishing emails within 24 hours
                  </p>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={preferences.phishing_threshold}
                      onChange={(e) => 
                        setPreferences(prev => ({ 
                          ...prev, 
                          phishing_threshold: parseInt(e.target.value) || 3 
                        }))
                      }
                      className="w-24 bg-white/10 border-white/20 text-white"
                    />
                    <span className="text-white/70">phishing emails</span>
                  </div>
                </div>

                {/* Alert Frequency */}
                <div className="space-y-3">
                  <Label className="text-white font-medium">Alert Frequency</Label>
                  <p className="text-sm text-white/70">
                    How often to receive repeated alerts
                  </p>
                  <Select
                    value={preferences.alert_frequency}
                    onValueChange={(value) => 
                      setPreferences(prev => ({ ...prev, alert_frequency: value }))
                    }
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button 
                    onClick={savePreferences}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={testAlert}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Send Test Alert
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Security Alerts
                  {unreadAlerts.length > 0 && (
                    <Badge variant="destructive">{unreadAlerts.length} unread</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-white/70">
                  Recent security notifications and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <p className="text-white font-medium">No alerts</p>
                      <p className="text-white/70 text-sm">
                        You're all caught up! No security alerts at this time.
                      </p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-4 rounded-lg border transition-colors ${
                          alert.read_at 
                            ? 'bg-white/5 border-white/10' 
                            : 'bg-orange-500/10 border-orange-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {alert.alert_type === 'phishing_threshold_exceeded' && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                              {alert.alert_type === 'test_alert' && (
                                <Bell className="h-4 w-4 text-blue-500" />
                              )}
                              <span className="text-white font-medium capitalize">
                                {alert.alert_type.replace('_', ' ')}
                              </span>
                              {!alert.read_at && (
                                <Badge variant="destructive" className="text-xs">New</Badge>
                              )}
                            </div>
                            <p className="text-white/80 mb-2">{alert.message}</p>
                            <div className="flex items-center gap-4 text-xs text-white/60">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(alert.sent_at).toLocaleString()}
                              </div>
                              {alert.read_at && (
                                <span>Read at {new Date(alert.read_at).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!alert.read_at && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAlertAsRead(alert.id)}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                              >
                                Mark Read
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteAlert(alert.id)}
                              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}