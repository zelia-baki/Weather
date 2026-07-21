import { Satellite } from "lucide-react";

export default function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-t-emerald-900 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-emerald-400 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Satellite size={22} className="text-emerald-400" />
        </div>
      </div>
      <p className="text-emerald-400 text-sm font-mono tracking-widest animate-pulse">
        QUERYING SENTINEL-2...
      </p>
    </div>
  );
}