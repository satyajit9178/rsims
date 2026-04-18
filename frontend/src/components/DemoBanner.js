import { useDemo } from '../context/DemoContext';

export default function DemoBanner() {
  const { isDemo } = useDemo();
  if (!isDemo) return null;

  return (
    <div className="bg-amber text-ink-900 px-6 py-2 flex items-center justify-between text-sm font-semibold">
      <div className="flex items-center gap-2">
        <span className="text-base">⚡</span>
        <span className="font-mono font-bold uppercase tracking-wider text-xs">Demo Mode</span>
        <span className="font-body">— You are exploring a live sandbox. All changes reset on refresh and never touch the real database.</span>
      </div>
      <span className="font-mono text-xs opacity-70">Logged in as: demo_admin (Admin)</span>
    </div>
  );
}