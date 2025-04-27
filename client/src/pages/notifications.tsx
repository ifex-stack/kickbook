import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/components/auth/auth-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, Trash, Calendar, Award, CreditCard, Users, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

// Define the type for a notification
type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  bookingId: number | null;
};

// Component for rendering a single notification
const NotificationItem = ({ 
  notification, 
  onMarkAsRead,
  onDelete 
}: { 
  notification: Notification; 
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'match_reminder':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'match_canceled':
        return <Calendar className="h-5 w-5 text-red-500" />;
      case 'achievement':
        return <Award className="h-5 w-5 text-yellow-500" />;
      case 'payment_confirmation':
        return <CreditCard className="h-5 w-5 text-green-500" />;
      case 'team_invitation':
        return <Users className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className={notification.isRead ? 'opacity-75' : 'border-l-4 border-l-primary'}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">{notification.title}</h3>
              {!notification.isRead && (
                <Badge variant="secondary" className="text-xs">New</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
            <p className="text-xs text-gray-400 mt-2">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex flex-col gap-2 ml-2">
            {!notification.isRead && (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => onMarkAsRead(notification.id)}
                title="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onDelete(notification.id)}
              title="Delete notification"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all notifications
  const { data: allNotifications = [], isLoading: isLoadingAll } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });

  // Fetch unread notifications
  const { data: unreadNotifications = [], isLoading: isLoadingUnread } = useQuery<Notification[]>({
    queryKey: ['/api/notifications/unread'],
    enabled: !!user,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      toast({
        title: "Notification marked as read",
        description: "The notification has been marked as read.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      });
    }
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      toast({
        title: "All notifications marked as read",
        description: "All notifications have been marked as read.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive",
      });
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      toast({
        title: "Notification deleted",
        description: "The notification has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive",
      });
    }
  });

  // Handle marking a notification as read
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Handle deleting a notification
  const handleDeleteNotification = (id: number) => {
    deleteNotificationMutation.mutate(id);
  };

  // Display notifications based on active tab
  const displayNotifications = activeTab === 'all' ? allNotifications : unreadNotifications;
  const isLoading = activeTab === 'all' ? isLoadingAll : isLoadingUnread;

  return (
    <AppShell user={user ? { name: user.name || 'User', role: user.role || 'player' } : undefined}>
      <PageHeader 
        title="Notifications" 
        description="View and manage your notifications"
      />

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Notifications</CardTitle>
              <Button 
                variant="outline" 
                onClick={handleMarkAllAsRead}
                disabled={unreadNotifications.length === 0}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            </div>
            <CardDescription>
              You have {unreadNotifications.length} unread notification{unreadNotifications.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  All ({allNotifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Unread ({unreadNotifications.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {isLoadingAll ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : allNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>You don't have any notifications</p>
                  </div>
                ) : (
                  allNotifications.map((notification: Notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDeleteNotification}
                    />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="unread" className="space-y-4">
                {isLoadingUnread ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : unreadNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Check className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>You've read all your notifications</p>
                  </div>
                ) : (
                  unreadNotifications.map((notification: Notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDeleteNotification}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}