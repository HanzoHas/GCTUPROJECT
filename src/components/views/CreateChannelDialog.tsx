import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useChannel } from '@/contexts/ChannelContext';
import { useToast } from '@/components/ui/use-toast';

interface CreateChannelDialogProps {
  onClose: () => void;
  onChannelCreated: () => void;
}

export function CreateChannelDialog({ onClose, onChannelCreated }: CreateChannelDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createChannel } = useChannel();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Channel name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createChannel(name, description);
      toast({
        title: "Success",
        description: "Channel created successfully",
      });
      onChannelCreated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create channel",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter channel name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter channel description"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Channel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 