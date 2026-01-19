'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Save, Copy, SlidersHorizontal, RotateCcw, Lock, Unlock, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { generatePassword } from '@/lib/password';
import { useVaultStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUsername: string;
  onSave: (data: { label: string; username: string; value: string }) => void;
}

export function SaveDialog({ open, onOpenChange, initialUsername, onSave }: SaveDialogProps) {
  const { isUnlocked, unlockVault } = useVaultStore();
  const supabase = createClient();
  
  // Form State
  const [label, setLabel] = useState('');
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  
  // Generator State
  const [showOptions, setShowOptions] = useState(true);
  const [genLength, setGenLength] = useState(20);
  const [genOptions, setGenOptions] = useState({ upper: true, lower: true, nums: true, syms: true });
  
  // Unlock State
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Check for session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setUserId(session?.user?.id ?? null);
    });
  }, [supabase]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setLabel('');
      setUsername(initialUsername);
      setPassword('');
      setGenLength(20);
      setGenOptions({ upper: true, lower: true, nums: true, syms: true });
      setShowOptions(true);
      setMasterPassword('');
      setUnlockError('');
      
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
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(username);
    toast.success("Username copied to clipboard");
  };
  
  const handleUnlock = async (passOverride?: string) => {
    const passwordToUse = passOverride || masterPassword;
    
    if (!passwordToUse.trim()) {
      setUnlockError('Please enter your master password.');
      return;
    }
    
    setIsUnlocking(true);
    setUnlockError('');
    
    try {
      const success = await unlockVault(passwordToUse);
      if (success) {
        toast.success("Vault unlocked!");
        setMasterPassword(''); 
      } else {
        setUnlockError('Failed to unlock vault. Please try again.');
      }
    } catch (err) {
      setUnlockError('An unexpected error occurred.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleGoogleUnlock = () => {
    if (!userId) return;
    // Using User ID as the key simplifies the UX while maintaining the encryption pipeline
    handleUnlock(userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 gap-0 overflow-hidden border-border/50">
        
        {!isUnlocked ? (
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="bg-amber-500/10 p-4 rounded-full">
                <Lock className="w-10 h-10 text-amber-500" />
              </div>
              <DialogTitle className="text-2xl font-semibold">Vault Locked</DialogTitle>
              <DialogDescription className="text-muted-foreground max-w-sm">
                Unlock your vault to save this alias.
              </DialogDescription>
            </div>
            
            <div className="space-y-4 max-w-sm mx-auto">
              {userId && (
                <Button 
                    variant="outline" 
                    className="w-full h-12 text-base gap-2 border-primary/20 hover:border-primary/50 bg-primary/5"
                    onClick={handleGoogleUnlock}
                    disabled={isUnlocking}
                >
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Unlock with Google Identity
                </Button>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or use Master Password</span>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter Master Password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  className="h-12 text-base"
                />
                {unlockError && (
                  <p className="text-sm text-destructive font-medium">{unlockError}</p>
                )}
              </div>
              
              <Button 
                onClick={() => handleUnlock()} 
                disabled={isUnlocking} 
                className="w-full h-12 text-base gap-2"
              >
                {isUnlocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
                Unlock Vault
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/10">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                        <Save className="w-5 h-5 text-primary" />
                    </div>
                    <DialogTitle className="font-mono text-lg">{username}</DialogTitle>
                    <DialogDescription className="sr-only">Save to vault</DialogDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                    <Copy className="w-5 h-5 text-muted-foreground" />
                </Button>
            </div>

            <div className="p-6 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <Label htmlFor="label" className="text-muted-foreground">Label <span className="text-red-500">*</span></Label>
                        <Input 
                            id="label" 
                            placeholder="e.g. Netflix" 
                            value={label} 
                            onChange={(e) => setLabel(e.target.value)}
                            className="h-12 bg-muted/20 border-border/50 text-base"
                        />
                    </div>

                    <div className="space-y-3 relative">
                         <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-muted-foreground">Password <span className="text-red-500">*</span></Label>
                            <button 
                                onClick={() => setShowOptions(!showOptions)} 
                                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
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
                                size="icon" variant="ghost" 
                                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
                                onClick={handleRegenerate}
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                         </div>
                    </div>
               </div>

               <div className={cn("flex flex-wrap items-center justify-between gap-4 transition-all duration-300 overflow-hidden", showOptions ? "opacity-100 max-h-[100px] py-2" : "opacity-0 max-h-0 py-0")}>
                    <div className="flex flex-col items-center gap-2 min-w-[80px]">
                        <Label className="text-muted-foreground text-xs uppercase">Length</Label>
                        <Input 
                            type="number" 
                            value={genLength} 
                            onChange={(e) => setGenLength(Math.max(4, Math.min(128, parseInt(e.target.value) || 20)))}
                            className="bg-muted/20 border-border/50 text-center font-mono w-20 h-9"
                        />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Label className="text-muted-foreground text-xs uppercase uppercase">Upper</Label>
                        <Switch checked={genOptions.upper} onCheckedChange={(c) => setGenOptions({...genOptions, upper: c})} />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Label className="text-muted-foreground text-xs uppercase">Lower</Label>
                        <Switch checked={genOptions.lower} onCheckedChange={(c) => setGenOptions({...genOptions, lower: c})} />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Label className="text-muted-foreground text-xs uppercase">Numbers</Label>
                        <Switch checked={genOptions.nums} onCheckedChange={(c) => setGenOptions({...genOptions, nums: c})} />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Label className="text-muted-foreground text-xs uppercase">Symbols</Label>
                        <Switch checked={genOptions.syms} onCheckedChange={(c) => setGenOptions({...genOptions, syms: c})} />
                    </div>
               </div>
            </div>

            <div className="p-6 flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!label || !password}>Confirm Save</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
