import PermutatorFeature from '@/components/features/permutator/PermutatorFeature';

export default function PermutatorPage() {
  return (
    // Removed max-w-7xl mx-auto as it is now handled by AppShell
    <div className="h-[calc(100vh-10rem)]">
      <PermutatorFeature />
    </div>
  );
}
