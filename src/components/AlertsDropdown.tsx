import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Check, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Alert {
  id: string;
  alert_type: string;
  message: string;
  sent_at: string;
  read_at: string | null;
  metadata: any;
}

interface AlertsDropdownProps {
  clerkUserId: string;
  onSettingsClick?: () => void;
}

export default function AlertsDropdown({ clerkUserId, onSettingsClick }: AlertsDropdownProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAlerts = async () => {
    if (!clerkUserId) return;
    
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('notifications', {
        body: { clerk_user_id: clerkUserId, action: 'get' }
      });

      if (error) throw error;
      
      setAlerts(result.alerts || []);
      setUnreadCount(result.unread_count || 0);
    } catch (error) {
      console.error('Fetch alerts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase.functions.invoke('notifications', {
        body: { clerk_user_id: clerkUserId, action: 'mark_read', alert_id: alertId }
      });

      if (error) throw error;
      
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, read_at: new Date().toISOString() }
            : alert
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase.functions.invoke('notifications', {
        body: { clerk_user_id: clerkUserId, action: 'mark_all_read' }
      });

      if (error) throw error;
      
      setAlerts(prev => 
        prev.map(alert => ({ ...alert, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      toast({
        title: "All Alerts Read",
        description: "Marked all alerts as read",
      });
    } catch (error) {
      console.error('Mark all read error:', error);
      toast({
        title: "Error",
        description: "Failed to mark alerts as read",
        variant: "destructive",
      });
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase.functions.invoke('notifications', {
        body: { clerk_user_id: clerkUserId, action: 'delete', alert_id: alertId }
      });

      if (error) throw error;
      
      const wasUnread = alerts.find(a => a.id === alertId)?.read_at === null;
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Delete alert error:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [clerkUserId]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={markAllAsRead}
                className="h-6 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {onSettingsClick && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onSettingsClick}
                className="h-6 px-2 text-xs"
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            alerts.map((alert) => (
              <DropdownMenuItem 
                key={alert.id} 
                className="p-0 focus:bg-transparent"
                asChild
              >
                <Card 
                  className={`m-2 border transition-colors ${
                    alert.read_at ? 'bg-background' : 'bg-muted/50 border-primary/20'
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {alert.alert_type === 'phishing_threshold_exceeded' ? (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Bell className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground mb-1">
                          {alert.alert_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.sent_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      <div className="flex gap-1">
                        {!alert.read_at && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(alert.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAlert(alert.id);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}