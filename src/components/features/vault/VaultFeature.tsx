'use client';

import { useState, useMemo, useEffect } from 'react';
import { useVaultStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, Eye, EyeOff, Trash2, Search, Save, Edit2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generatePassword } from '@/lib/password';

export default function VaultFeature() {
  const { items, addItem, removeItem, updateItem, decryptItemValue } = useVaultStore();
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
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({});

  // Init Generator
  useEffect(() => {
     setGeneratedPass(generatePassword(20, { upper: true, lower: true, nums: true, syms: true }));
  }, [genLength, genOptions]);

  const regenerate = () => {
    setGeneratedPass(generatePassword(genLength, genOptions));
  };

  const getOrDecrypt = async (id: string, encryptedValue: string): Promise<string> => {
    if (decryptedMap[id]) return decryptedMap[id];
    try {
        const decrypted = await decryptItemValue(encryptedValue);
        setDecryptedMap(prev => ({ ...prev, [id]: decrypted }));
        return decrypted;
    } catch (err) {
        toast.error("Failed to decrypt. Is the vault unlocked?");
        return encryptedValue;
    }
  };

  const handleCopy = async (id: string, value: string, isUsername = false) => {
    try {
      const textToCopy = isUsername ? value : await getOrDecrypt(id, value);
      await navigator.clipboard.writeText(textToCopy);
      toast.success(`${isUsername ? 'Username' : 'Password'} copied!`);
    } catch (err) {
      toast.error("Failed to copy.");
    }
  };

  const strength = calculateStrength(generatedPass);

  const handleSave = async () => {
    if (!saveLabel || !generatedPass) return;
    const success = await addItem({
        label: saveLabel,
        username: saveUsername,
        value: generatedPass,
        strength: strength.level,
    });
    if (success) {
        setSaveLabel('');
        setSaveUsername('');
        toast.success("Password saved to vault.");
    } else {
        toast.error("Failed to save. Is your vault unlocked?");
    }
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
    toast.success("Vault exported (Note: Values remain encrypted)");
  };

  const startEdit = async (item: any) => {
      setEditingId(item.id);
      const decrypted = await getOrDecrypt(item.id, item.value);
      setEditForm({ label: item.label, username: item.username || '', value: decrypted });
  };

  const cancelEdit = () => {
      setEditingId(null);
      setEditForm({ label: '', username: '', value: '' });
  };

  const saveEdit = async (id: string) => {
      const success = await updateItem(id, {
          ...editForm,
          strength: calculateStrength(editForm.value).level
      });
      
      if (success) {
          setEditingId(null);
          toast.success("Item updated.");
      } else {
          toast.error("Failed to update item.");
      }
  };

  const toggleVisibility = async (id: string, encryptedValue: string) => {
    const next = new Set(visibleItems);
    if (next.has(id)) {
        next.delete(id);
    } else {
        await getOrDecrypt(id, encryptedValue);
        next.add(id);
    }
    setVisibleItems(next);
  };

  const filteredItems = useMemo(() => {
    return items.filter(i => 
        i.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
       <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/50 h-fit bg-card/50 backdrop-blur-sm">
             <CardHeader>
                <CardTitle>Generator</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="relative group">
                   <div className="p-4 bg-muted/40 rounded-lg border font-mono text-lg break-all pr-20 shadow-inner min-h-[3.5rem] flex items-center">
                      {generatedPass}
                   </div>
                   <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-muted/80 backdrop-blur p-1 rounded-md">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigator.clipboard.writeText(generatedPass).then(() => toast.success("Copied!"))}>
                         <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={regenerate}>
                         <RefreshCw className="w-4 h-4" />
                      </Button>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground font-inter">
                      <span>Security Level</span>
                      <span className={strength.color}>{strength.level}</span>
                   </div>
                   <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className={cn("h-full transition-all duration-500", strength.bg)} style={{ width: strength.level === 'Weak' ? '33%' : strength.level === 'Medium' ? '66%' : '100%' }} />
                   </div>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between gap-4">
                        <Label>Length</Label>
                        <Input 
                            type="number" 
                            value={genLength} 
                            onChange={(e) => setGenLength(Math.min(128, Math.max(4, parseInt(e.target.value) || 4)))}
                            className="w-24 font-mono text-center"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(genOptions).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between">
                                <Label className="capitalize">{key === 'nums' ? 'Numbers' : key === 'syms' ? 'Symbols' : key}</Label>
                                <Switch checked={val} onCheckedChange={(c) => setGenOptions(prev => ({...prev, [key]: c}))} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                   <Label>Save to Vault</Label>
                   <Input placeholder="Label (e.g. Netflix)" value={saveLabel} onChange={(e) => setSaveLabel(e.target.value)} />
                   <Input placeholder="Email (Optional)" value={saveUsername} onChange={(e) => setSaveUsername(e.target.value)} />
                   <Button className="w-full h-12" onClick={handleSave} disabled={!saveLabel}>
                      <Save className="mr-2 w-4 h-4" /> Save Entry
                   </Button>
                </div>
             </CardContent>
          </Card>
       </div>

       <div className="lg:col-span-7 flex flex-col h-[700px] lg:h-auto">
          <Card className="flex-1 flex flex-col border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden py-0 gap-0">
             <CardHeader className="flex flex-row items-center justify-between border-b p-4 shrink-0 bg-muted/10 space-y-0">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Your Keys</CardTitle>
                    <Badge variant="secondary">{filteredItems.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-48 md:w-64">
                       <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                       <Input 
                          placeholder="Search vault..." 
                          className="pl-8 h-8 bg-background/50"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                       />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport}>
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
             </CardHeader>
             
             <CardContent className="flex-1 p-0 overflow-y-auto">
                {filteredItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 gap-4">
                        <Save className="w-12 h-12 opacity-10" />
                        <p className="text-sm font-inter">No saved credentials found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/20">
                        {filteredItems.map((item) => {
                            const isEditing = editingId === item.id;
                            const isVisible = visibleItems.has(item.id);
                            const renderedValue = isVisible ? (decryptedMap[item.id] || 'Decrypting...') : '••••••••••••••••';

                            if (isEditing) {
                                return (
                                    <div key={item.id} className="p-4 bg-primary/5 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-muted-foreground uppercase">Label</Label>
                                                <Input value={editForm.label} onChange={e => setEditForm({...editForm, label: e.target.value})} className="bg-background" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-muted-foreground uppercase">Username</Label>
                                                <Input value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} className="bg-background" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase">Password</Label>
                                            <div className="relative">
                                                <Input value={editForm.value} onChange={e => setEditForm({...editForm, value: e.target.value})} className="font-mono pr-10 bg-background" />
                                                <Button size="icon" variant="ghost" className="absolute right-1 top-1 h-8 w-8" onClick={() => setEditForm({...editForm, value: generatePassword(20, genOptions)})}>
                                                    <RefreshCw className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                                            <Button size="sm" onClick={() => saveEdit(item.id)}>Confirm Changes</Button>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={item.id} className="p-4 hover:bg-muted/30 transition-all duration-200 group flex items-start justify-between gap-4">
                                    <div className="space-y-1.5 min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-foreground/90 truncate cursor-pointer hover:text-primary transition-colors" onClick={() => handleCopy(item.id, item.value)}>
                                                {item.label}
                                            </h4>
                                            <Badge variant="outline" className="text-[10px] h-4 font-inter">{new Date(item.createdAt).toLocaleDateString()}</Badge>
                                        </div>
                                        {item.username && (
                                            <p className="text-xs text-muted-foreground font-inter truncate hover:underline cursor-pointer" onClick={() => handleCopy(item.id, item.username!, true)}>
                                                {item.username}
                                            </p>
                                        )}
                                        
                                        <div className="flex items-center gap-2 mt-2">
                                            <code 
                                                className="text-xs bg-muted/50 px-3 py-1.5 rounded-md font-mono select-all break-all cursor-pointer hover:bg-muted transition-colors border border-border/50"
                                                onClick={() => handleCopy(item.id, item.value)}
                                            >
                                                {renderedValue}
                                            </code>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => toggleVisibility(item.id, item.value)}>
                                            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.id)}>
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
      
      if (score < 3) return { level: 'Weak' as const, color: 'text-rose-500', bg: 'bg-rose-500' };
      if (score < 5) return { level: 'Medium' as const, color: 'text-amber-500', bg: 'bg-amber-500' };
      return { level: 'Strong' as const, color: 'text-emerald-500', bg: 'bg-emerald-500' };
}
