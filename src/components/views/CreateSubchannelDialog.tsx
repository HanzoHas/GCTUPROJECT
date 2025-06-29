import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChannel } from '@/contexts/ChannelContext';
import { useToast } from '@/components/ui/use-toast';

interface CreateSubchannelDialogProps {
  channelId: string;
  onClose: () => void;
  onSubchannelCreated: () => void;
}

export function CreateSubchannelDialog({ channelId, onClose, onSubchannelCreated }: CreateSubchannelDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'TEXT' | 'ANNOUNCEMENT' | 'CLASS'>('TEXT');
  const { createSubchannel } = useChannel();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Subchannel name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSubchannel(channelId, name, description, type);
      toast({
        title: "Success",
        description: "Subchannel created successfully",
      });
      onSubchannelCreated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subchannel",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Subchannel</DialogTitle>
          <DialogDescription>
            Create a new subchannel with the desired type and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subchannel Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter subchannel name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter subchannel description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Subchannel Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEXT">Text Channel</SelectItem>
                <SelectItem value="ANNOUNCEMENT">Announcements</SelectItem>
                <SelectItem value="CLASS">Class</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Subchannel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
