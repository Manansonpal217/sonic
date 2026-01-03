'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, Search } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { getFullUrl, API_ENDPOINTS } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export function NotificationSender() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('');
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [sending, setSending] = useState(false);

  // Fetch notification types
  const { data: notificationTypesData } = useQuery({
    queryKey: ['notificationTypes'],
    queryFn: async () => {
      const response = await apiClient.get(getFullUrl(API_ENDPOINTS.notificationTypes));
      return response.data;
    },
  });

  // Handle both array and paginated response formats
  const notificationTypes = Array.isArray(notificationTypesData) 
    ? notificationTypesData 
    : notificationTypesData?.results || [];

  // Fetch users with search
  const { data: users } = useQuery({
    queryKey: ['users', { search: userSearch, page_size: 100 }],
    queryFn: async () => {
      const response = await apiClient.get(getFullUrl(API_ENDPOINTS.users), {
        params: { search: userSearch || undefined, page_size: 100 },
      });
      return response.data;
    },
  });

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!notificationType) {
      toast.error('Notification type is required');
      return;
    }

    if (!sendToAll && selectedUserIds.length === 0) {
      toast.error('Please select users or choose "Send to all"');
      return;
    }

    setSending(true);

    try {
      const payload: any = {
        notification_type_id: parseInt(notificationType),
        title: title.trim(),
        message: message.trim(),
        send_to_all: sendToAll,
      };

      if (!sendToAll && selectedUserIds.length > 0) {
        payload.user_ids = selectedUserIds;
      }

      await apiClient.post(getFullUrl(API_ENDPOINTS.notificationsSend), payload);

      toast.success('Notification sent successfully');
      setIsOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setNotificationType('');
    setSendToAll(false);
    setSelectedUserIds([]);
    setUserSearch('');
  };

  const toggleUser = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users?.results?.filter((user: any) => {
    if (!userSearch) return true;
    const search = userSearch.toLowerCase();
    return (
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      String(user.id).includes(search)
    );
  }) || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#842B25] hover:bg-[#6b231f]">
          <Bell className="mr-2 h-4 w-4" />
          Send Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Notification</DialogTitle>
          <DialogDescription>
            Send a real-time notification to users via WebSocket
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notification_type">Notification Type *</Label>
            <Select value={notificationType || undefined} onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select notification type" />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes && notificationTypes.length > 0 ? (
                  notificationTypes.map((type: any) => (
                    <SelectItem key={type.notif_id} value={String(type.notif_id)}>
                      {type.notif_name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No notification types available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send_to_all"
                checked={sendToAll}
                onCheckedChange={(checked) => setSendToAll(checked as boolean)}
              />
              <Label htmlFor="send_to_all">Send to all users</Label>
            </div>
          </div>

          {!sendToAll && (
            <div className="space-y-2">
              <Label htmlFor="user_search">Select Users *</Label>
              <div className="space-y-2">
                <Input
                  id="user_search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by name, email, or ID..."
                  className="mb-2"
                />
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredUsers.map((user: any) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                          onClick={() => toggleUser(user.id)}
                        >
                          <Checkbox
                            checked={selectedUserIds.includes(user.id)}
                            onCheckedChange={() => toggleUser(user.id)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{user.username || `User #${user.id}`}</div>
                            {user.email && (
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedUserIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {users?.count || 0} total users available
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            className="bg-[#842B25] hover:bg-[#6b231f]"
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Send Notification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


