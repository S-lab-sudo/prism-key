'use client';

import { useState } from 'react';
import { useVaultStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Unlock, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

export function VaultUnlockGate({ children }: { children: React.ReactNode }) {
  const { isUnlocked, unlockVault } = useVaultStore();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, [supabase]);

  const handleUnlock = async (passOverride?: string) => {
    const passToUse = passOverride || password;
    if (!passToUse.trim()) return;

    setIsLoading(true);
    try {
      const success = await unlockVault(passToUse);
      if (success) {
        toast.success("Vault accessed successfully.");
      } else {
        toast.error("Invalid master password.");
      }
    } catch (err) {
      toast.error("An error occurred during unlock.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-amber-500/10 p-4 rounded-full w-fit">
            <Lock className="w-10 h-10 text-amber-500" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">Vault Access Required</CardTitle>
            <CardDescription>
              This section is encrypted. Please unlock your vault to proceed.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {userId && (
            <Button 
              variant="outline" 
              className="w-full h-12 gap-2 border-primary/20 hover:border-primary/50 bg-primary/5"
              onClick={() => handleUnlock(userId)}
              disabled={isLoading}
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
              <span className="bg-background px-2 text-muted-foreground">Or Master Password</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gate-password">Master Password</Label>
              <Input
                id="gate-password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                className="h-12"
              />
            </div>
            <Button 
              className="w-full h-12 gap-2" 
              onClick={() => handleUnlock()}
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
              Unlock Vault
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Your encryption key never leaves this device. 
            {userId ? " Logged-in sessions are temporary." : " Guest data is stored locally."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
