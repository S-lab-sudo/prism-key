'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Command, LayoutGrid, ShieldCheck, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useVaultStore } from '@/lib/store';
import { VaultUnlockGate } from '@/components/features/vault/VaultUnlockGate';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/permutator', label: 'Gmail Permutator', icon: Command },
  { href: '/vault', label: 'Password Vault', icon: ShieldCheck },
];

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  const { syncWithSupabase, lockVault } = useVaultStore();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
          syncWithSupabase();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
          syncWithSupabase();
      } else {
          // If no session, ensure vault is locked/cleared
          lockVault();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    lockVault();
    setUser(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto w-full flex h-16 items-center px-4 md:px-8">
          <Link href="/" className="mr-8 flex items-center space-x-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <LayoutGrid className="h-6 w-6 text-primary" />
            </div>
            <span className="hidden font-bold sm:inline-block text-xl tracking-tight">PrismKey</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80 flex items-center gap-2",
                  pathname === item.href ? "text-foreground" : "text-foreground/60"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Nav */}
          <div className="flex flex-1 items-center justify-end md:hidden">
             <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
               <SheetTrigger asChild>
                 <Button variant="ghost" size="icon">
                   <Menu className="h-5 w-5" />
                   <span className="sr-only">Toggle Menu</span>
                 </Button>
               </SheetTrigger>
               <SheetContent side="left" className="pr-0">
                 <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-8" onClick={() => setMobileOpen(false)}>
                    <LayoutGrid className="w-6 h-6 text-primary" />
                    PrismKey
                 </Link>
                 <div className="flex flex-col gap-4">
                   {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2 text-lg font-medium transition-colors hover:text-primary",
                          pathname === item.href ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                   ))}
                   
                   <div className="mt-4 pt-4 border-t">
                      {user ? (
                           <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                     <AvatarImage src={user.user_metadata.avatar_url} />
                                     <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium truncate">{user.user_metadata.full_name || user.email}</span>
                              </div>
                              <Button variant="ghost" className="justify-start gap-2 text-destructive" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                                  <LogOut className="w-4 h-4" /> Sign Out
                              </Button>
                           </div>
                      ) : (
                          <Button variant="outline" className="justify-start gap-2 w-full" onClick={handleLogin}>
                              <GoogleIcon className="w-5 h-5" /> Sign in with Google
                          </Button>
                      )}
                   </div>
                 </div>
               </SheetContent>
             </Sheet>
          </div>
          
          {/* Desktop Auth */}
          <div className="hidden md:flex ml-auto items-center gap-4">
              {user ? (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                          <Avatar className="h-8 w-8">
                             <AvatarImage src={user.user_metadata.avatar_url} alt={user.email} />
                             <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                       <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                             <p className="text-sm font-medium leading-none">{user.user_metadata.full_name}</p>
                             <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                          </div>
                       </DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                       </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              ) : (
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleLogin}>
                     <GoogleIcon className="w-4 h-4" /> Sign in
                  </Button>
              )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3 }}
           key={pathname}
           className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8"
        >
          {['/vault', '/permutator'].includes(pathname) ? (
            <VaultUnlockGate>
              {children}
            </VaultUnlockGate>
          ) : (
            children
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="max-w-7xl mx-auto w-full flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 md:px-8">
           <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
             Built by <span className="font-medium underline underline-offset-4">Santosh Jugjali</span>.
           </p>
        </div>
      </footer>
    </div>
  );
}
