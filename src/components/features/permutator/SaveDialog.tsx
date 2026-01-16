'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RefreshCw, Save, Copy, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { generatePassword } from '@/lib/password';

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUsername: string;
  onSave: (data: { label: string; username: string; value: string }) => void;
}

export function SaveDialog({ open, onOpenChange, initialUsername, onSave }: SaveDialogProps) {
  const [label, setLabel] = useState('');
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  
  // Generator State
  const [showOptions, setShowOptions] = useState(true);
  const [genLength, setGenLength] = useState(20);
  const [genOptions, setGenOptions] = useState({ upper: true, lower: true, nums: true, syms: true });

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setLabel('');
      setUsername(initialUsername);
      setPassword('');
      setGenLength(20);
      setGenOptions({ upper: true, lower: true, nums: true, syms: true });
      setShowOptions(true);
      
      // Auto-generate a password on open
      const newPass = generatePassword(20, { upper: true, lower: true, nums: true, syms: true });
      setPassword(newPass);
    }
  }, [open, initialUsername]);

  const handleRegenerate = () => {
    const newPass = generatePassword(genLength, genOptions);
    setPassword(newPass);
  };

  const handleSave = () => {
    onSave({ label, username, value: password });
    onOpenChange(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(username);
    toast.success("Username copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 gap-0 overflow-hidden border-border/50">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/10">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-md">
                    <Save className="w-5 h-5 text-primary" />
                </div>
                <DialogTitle className="font-mono text-lg">{username}</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy username to clipboard">
                <Copy className="w-5 h-5 text-muted-foreground" />
            </Button>
        </div>

        <div className="p-6 space-y-8">
           {/* Top Row: Label & Password Display */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Label */}
                <div className="space-y-3">
                    <Label htmlFor="label" className="text-muted-foreground">Label <span className="text-red-500">*</span></Label>
                    <Input 
                        id="label" 
                        placeholder="e.g. Netflix Primary" 
                        value={label} 
                        onChange={(e) => setLabel(e.target.value)}
                        className="h-12 bg-muted/20 border-border/50 text-base"
                    />
                </div>

                {/* Right: Password Field */}
                <div className="space-y-3 relative">
                     <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-muted-foreground">Secure Password <span className="text-red-500">*</span></Label>
                        <button 
                            onClick={() => setShowOptions(!showOptions)} 
                            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showOptions ? "Hide password options" : "Show password options"}
                        >
                            <SlidersHorizontal className="w-3 h-3" /> {showOptions ? "Hide Options" : "Show Options"}
                        </button>
                     </div>
                     <div className="relative">
                        <Input 
                            id="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 bg-muted/20 border-border/50 font-mono text-base pr-12"
                        />
                         <Button 
                            size="icon" 
                            variant="ghost" 
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={handleRegenerate}
                            aria-label="Regenerate password"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                     </div>
                </div>
           </div>

           {/* Bottom Row: Options (Collapsible) */}
           <div className={cn("grid grid-cols-1 md:grid-cols-5 gap-6 items-end transition-all duration-300 overflow-hidden", showOptions ? "opacity-100 max-h-[100px]" : "opacity-0 max-h-0")}>
                
                {/* Length */}
                <div className="space-y-3">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Length</Label>
                    <Input 
                        type="number" 
                        value={genLength} 
                        onChange={(e) => setGenLength(Math.max(4, Math.min(128, parseInt(e.target.value) || 20)))}
                        className="bg-muted/20 border-border/50 text-center font-mono"
                    />
                </div>

                {/* Toggles */}
                 <div className="space-y-3 flex flex-col items-center">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Uppercase</Label>
                    <Switch checked={genOptions.upper} onCheckedChange={(c) => setGenOptions({...genOptions, upper: c})} />
                </div>
                <div className="space-y-3 flex flex-col items-center">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Lowercase</Label>
                     <Switch checked={genOptions.lower} onCheckedChange={(c) => setGenOptions({...genOptions, lower: c})} />
                </div>
                <div className="space-y-3 flex flex-col items-center">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Numbers</Label>
                     <Switch checked={genOptions.nums} onCheckedChange={(c) => setGenOptions({...genOptions, nums: c})} />
                </div>
                <div className="space-y-3 flex flex-col items-center">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Symbols</Label>
                     <Switch checked={genOptions.syms} onCheckedChange={(c) => setGenOptions({...genOptions, syms: c})} />
                </div>

           </div>

        </div>

        {/* Footer actions */}
        <div className="p-6 flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!label || !password}>Confirm Save</Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
