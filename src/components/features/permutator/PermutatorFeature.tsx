'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVaultStore } from '@/lib/store';
import { Copy, Save, Check, Loader2, ChevronLeft, ChevronRight, AlertCircle, ShieldCheck, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SaveDialog } from './SaveDialog';
import { toast } from 'sonner';

// --- Client-Side Permutation Logic (no server round-trip needed) ---
const PAGE_SIZE = 100;

function generatePermutations(email: string, page: number = 0, limit: number = PAGE_SIZE) {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return { variants: [], total: 0, page: 0, totalPages: 0 };
  
  const rawLocal = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  const localPart = rawLocal.replace(/\./g, '');
  
  if (localPart.length > 30) {
    throw new Error("Username part is too long for permutation.");
  }

  const len = localPart.length;
  const combinations = 1 << (len - 1);
  
  const getVariant = (i: number): string => {
    let variant = "";
    for (let j = 0; j < len; j++) {
      variant += localPart[j];
      if (j < len - 1 && (i & (1 << j))) {
        variant += ".";
      }
    }
    return `${variant}@${domain}`;
  };

  const variants: string[] = [];
  const start = page * limit;
  const end = Math.min(start + limit, combinations);

  if (start >= combinations) {
    return { variants: [], total: combinations, page, totalPages: Math.ceil(combinations / limit) };
  }

  for (let i = start; i < end; i++) {
    variants.push(getVariant(i));
  }

  return {
    variants,
    total: combinations,
    page,
    totalPages: Math.ceil(combinations / limit),
  };
}

export default function PermutatorFeature() {
  const { 
    items, 
    addItem, 
    permutatorState, 
    setPermutatorState 
  } = useVaultStore();

  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  
  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('');

  // Local derived state for convenience
  const { email, results, page, totalPages, total } = permutatorState;

  const handleGenerate = useCallback(() => {
    if (!email) return;
    setError('');
    
    try {
      const res = generatePermutations(email, 0, PAGE_SIZE);
      setPermutatorState({
        results: res.variants,
        total: res.total,
        totalPages: res.totalPages,
        page: 0
      });
    } catch (e: any) {
      setError(e.message || "Failed to generate aliases");
    }
  }, [email, setPermutatorState]);

  const handlePageChange = useCallback((newPage: number) => {
    try {
      const res = generatePermutations(email, newPage, PAGE_SIZE);
      setPermutatorState({
        results: res.variants,
        total: res.total,
        totalPages: res.totalPages,
        page: newPage
      });
    } catch (e: any) {
      setError(e.message || "Failed to fetch page");
    }
  }, [email, setPermutatorState]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Clipboard write failed:', err);
      toast.error("Failed to copy. Please try again.");
    }
  };

  const openSaveDialog = (variant: string) => {
    setSelectedVariant(variant);
    setDialogOpen(true);
  };

  const existingSlugs = useMemo(() => new Set(items.map(i => i.username)), [items]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* Left Panel: Input */}
      <Card className="flex flex-col">
        <CardHeader className="p-2 space-y-0 flex-row items-center gap-2 flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Gmail Permutator</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4 p-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Gmail Address
            </label>
            <Input
              placeholder="yourname@gmail.com"
              value={email}
              onChange={(e) => setPermutatorState({ email: e.target.value })}
              className="text-base"
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            className="w-full"
          >
            Generate Variations
          </Button>
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <div className="mt-auto pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">How It Works</h4>
            <p className="text-xs text-muted-foreground">
              Gmail ignores dots in the local part of an email address, meaning 
              &quot;j.o.h.n@gmail.com&quot; delivers to the same inbox as &quot;john@gmail.com&quot;.
              This tool generates all possible dot combinations for a given username.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Right Panel: Results */}
      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="p-2 space-y-0 flex-row items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Variations</CardTitle>
            {total > 0 && (
              <Badge variant="secondary" className="text-xs">
                {total.toLocaleString()} total
              </Badge>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={page === 0}
                onClick={() => handlePageChange(page - 1)}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                disabled={page >= totalPages - 1}
                onClick={() => handlePageChange(page + 1)}
                className="h-7 w-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">Enter an email and generate variations.</p>
            </div>
          ) : (
            results.map((variant) => {
              const isSaved = existingSlugs.has(variant);
              return (
                <div
                  key={variant}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors group",
                    isSaved && "bg-green-500/10"
                  )}
                >
                  <span className="font-mono text-sm truncate">{variant}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(variant)}
                    >
                      {copied === variant ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openSaveDialog(variant)}
                      disabled={isSaved}
                    >
                      <Save className={cn("w-4 h-4", isSaved && "text-green-500")} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
      
      <SaveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialUsername={selectedVariant}
        onSave={(data) => {
            addItem({
                label: data.label,
                username: data.username,
                value: data.value,
                strength: data.value ? 'Strong' : undefined,
            });
            toast.success("Saved to vault!");
            setDialogOpen(false);
        }}
      />
    </div>
  );
}
