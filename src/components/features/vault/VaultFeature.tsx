'use client';

import { useState, useMemo, useEffect } from 'react';
import { useVaultStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, Eye, EyeOff, Trash2, Check, Search, Save, Edit2, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generatePassword } from '@/lib/password';

export default function VaultFeature() {
  const { items, addItem, removeItem, setItems } = useVaultStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Generator State
  const [genLength, setGenLength] = useState(20);
  const [genOptions, setGenOptions] = useState({ upper: true, lower: true, nums: true, syms: true });
  const [generatedPass, setGeneratedPass] = useState('');
  
  // Save Form State
  const [saveLabel, setSaveLabel] = useState('');
  const [saveUsername, setSaveUsername] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ label: '', username: '', value: '' });

  // List State
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());

  // Init Generator
  useEffect(() => {
     setGeneratedPass(generatePassword(20, { upper: true, lower: true, nums: true, syms: true }));
  }, []);

  const regenerate = () => {
    setGeneratedPass(generatePassword(genLength, genOptions));
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (err) {
      console.error('Clipboard write failed:', err);
      toast.error("Failed to copy. Please try again or copy manually.");
    }
  };

  const strength = calculateStrength(generatedPass);

  const handleSave = () => {
    if (!saveLabel || !generatedPass) return;
    addItem({
        label: saveLabel,
        username: saveUsername,
        value: generatedPass,
        strength: strength.level,
    });
    setSaveLabel('');
    setSaveUsername('');
    toast.success("Password saved to vault.");
  };

  const handleExport = () => {
    if (items.length === 0) {
        toast.error("Vault is empty.");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "prismkey_vault.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("Vault exported successfully.");
  };

  // Edit Handlers
  const startEdit = (item: any) => {
      setEditingId(item.id);
      setEditForm({ label: item.label, username: item.username || '', value: item.value });
  };

  const cancelEdit = () => {
      setEditingId(null);
      setEditForm({ label: '', username: '', value: '' });
  };

  const saveEdit = (id: string) => {
      const newItems = items.map(item => 
          item.id === id ? { ...item, ...editForm, strength: calculateStrength(editForm.value).level } : item
      );
      setItems(newItems);
      setEditingId(null);
      toast.success("Item updated.");
  };

  const toggleVisibility = (id: string) => {
    const next = new Set(visibleItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setVisibleItems(next);
  };

  const filteredItems = useMemo(() => {
    return items.filter(i => 
        i.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // Hydration Fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
       {/* Generator Panel */}
       <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/50 h-fit">
             <CardHeader>
                <CardTitle>Generator</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
                {/* Display */}
                <div className="relative group">
                   <div className="p-4 bg-muted/40 rounded-lg border font-mono text-lg break-all pr-20 shadow-inner min-h-[3.5rem] flex items-center">
                      {generatedPass}
                   </div>
                   <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-muted/80 backdrop-blur p-1 rounded-md">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(generatedPass)} aria-label="Copy password to clipboard">
                         <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={regenerate} aria-label="Generate new password">
                         <RefreshCw className="w-4 h-4" />
                      </Button>
                   </div>
                </div>

                {/* Strength Meter */}
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>Security Level</span>
                      <span className={strength.color}>{strength.level}</span>
                   </div>
                   <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className={cn("h-full transition-all duration-500", strength.bg)} style={{ width: strength.level === 'Weak' ? '33%' : strength.level === 'Medium' ? '66%' : '100%' }} />
                   </div>
                </div>

                {/* Controls */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between gap-4">
                        <Label>Length</Label>
                        <Input 
                            type="number" 
                            min="4" max="128" 
                            value={genLength} 
                            onChange={(e) => { 
                                const val = parseInt(e.target.value) || 4;
                                setGenLength(Math.min(128, Math.max(4, val))); 
                            }}
                            onBlur={regenerate}
                            className="w-24 font-mono text-center"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(genOptions).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between">
                                <Label htmlFor={`opt-${key}`} className="capitalize">{key === 'nums' ? 'Numbers' : key === 'syms' ? 'Symbols' : key}</Label>
                                <Switch 
                                    id={`opt-${key}`}
                                    checked={val}
                                    onCheckedChange={(c) => { 
                                        setGenOptions(prev => {
                                            const next = {...prev, [key]: c};
                                            // Ensure at least one true
                                            if (!Object.values(next).some(Boolean)) return prev;
                                            return next;
                                        }); 
                                        // Effect will trigger regen via effect or user click. 
                                        // Since we don't have effect on options change to prevent chaotic typing regen, wait for explicit or blur.
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                     <Button variant="outline" size="sm" className="w-full" onClick={regenerate}>Generate New</Button>
                </div>

                {/* Quick Save */}
                <div className="space-y-3 border-t pt-4">
                   <Label>Save to Vault</Label>
                   <Input placeholder="Label (e.g. Netflix)" value={saveLabel} onChange={(e) => setSaveLabel(e.target.value)} />
                   <Input placeholder="Username (Optional)" value={saveUsername} onChange={(e) => setSaveUsername(e.target.value)} />
                   <Button className="w-full" onClick={handleSave} disabled={!saveLabel}>
                      <Save className="mr-2 w-4 h-4" /> Save Entry
                   </Button>
                </div>
             </CardContent>
          </Card>
       </div>

       {/* Vault List Panel */}
       <div className="lg:col-span-7 flex flex-col h-[700px] lg:h-auto">
          {/* Apply py-0 and gap-0 to Card to remove outer padding, matching Permutator */}
          <Card className="flex-1 flex flex-col border-border/50 overflow-hidden py-0 gap-0">
             <CardHeader className="flex flex-row items-center justify-between border-b p-2 shrink-0 bg-muted/10 space-y-0">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Your Keys</CardTitle>
                    <Badge variant="outline">{filteredItems.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-48 lg:w-64">
                       <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                       <Input 
                          placeholder="Search vault..." 
                          className="pl-8 h-8 bg-background text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                       />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport} aria-label="Export vault to JSON file">
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
             </CardHeader>
             
             <CardContent className="flex-1 p-0 overflow-y-auto">
                {filteredItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 gap-4">
                        <Save className="w-12 h-12 opacity-20" />
                        <p>No items found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/40">
                        {filteredItems.map((item) => {
                            const isEditing = editingId === item.id;
                            
                            if (isEditing) {
                                return (
                                    <div key={item.id} className="p-4 bg-muted/40 space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Label</Label>
                                                <Input value={editForm.label} onChange={e => setEditForm({...editForm, label: e.target.value})} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Username</Label>
                                                <Input value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Password</Label>
                                            <div className="relative">
                                                <Input value={editForm.value} onChange={e => setEditForm({...editForm, value: e.target.value})} className="font-mono pr-8" />
                                                <Button size="icon" variant="ghost" className="absolute right-1 top-1 h-7 w-7" onClick={() => setEditForm({...editForm, value: generatePassword(20, genOptions)})} aria-label="Regenerate password">
                                                    <RefreshCw className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                                            <Button size="sm" onClick={() => saveEdit(item.id)}>Save Changes</Button>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors group flex items-start justify-between gap-4">
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold truncate cursor-pointer hover:underline" onClick={() => handleCopy(item.value)}>{item.label}</h4>
                                            <span className="text-xs text-muted-foreground border px-1 rounded bg-background">{new Date(item.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {item.username && <p className="text-sm text-muted-foreground truncate cursor-pointer hover:text-primary transition-colors" onClick={() => handleCopy(item.username!)}>{item.username}</p>}
                                        
                                        <div className="flex items-center gap-2 mt-2">
                                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono select-all break-all cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleCopy(item.value)}>
                                                {visibleItems.has(item.id) ? item.value : '••••••••••••••••'}
                                            </code>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => toggleVisibility(item.id)} aria-label={visibleItems.has(item.id) ? "Hide password" : "Show password"}>
                                            {visibleItems.has(item.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => startEdit(item)} aria-label="Edit item">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.id)} aria-label="Delete item">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
             </CardContent>
          </Card>
       </div>
    </div>
  );
}

function calculateStrength(pass: string) {
      let score = 0;
      if (pass.length >= 12) score++;
      if (pass.length >= 20) score++;
      if (/[A-Z]/.test(pass)) score++;
      if (/[0-9]/.test(pass)) score++;
      if (/[^A-Za-z0-9]/.test(pass)) score++;
      
      if (score < 3) return { level: 'Weak' as const, color: 'text-red-500', bg: 'bg-red-500' };
      if (score < 5) return { level: 'Medium' as const, color: 'text-yellow-500', bg: 'bg-yellow-500' };
      return { level: 'Strong' as const, color: 'text-green-500', bg: 'bg-green-500' };
}
