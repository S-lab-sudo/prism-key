import VaultFeature from '@/components/features/vault/VaultFeature';

export default function VaultPage() {
  return (
    // Removed max-w-7xl mx-auto as it is now handled by AppShell
    <div className="h-[calc(100vh-10rem)]">
       <VaultFeature />
    </div>
  );
}
