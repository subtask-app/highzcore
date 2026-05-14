// CSS-only preloader. Renders instantly with no three.js dependency,
// and acts as the `loading` state for the dynamically-imported R3F canvas.

export default function Preloader() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 flex items-center justify-center bg-slate-950"
    >
      {/* Animated grid backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a18_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a18_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)]" />

      {/* Centered orbiting loader */}
      <div className="relative">
        {/* outer glow */}
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl animate-pulse" style={{ width: 160, height: 160, transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }} />

        {/* rotating ring */}
        <div className="relative" style={{ width: 96, height: 96 }}>
          <div
            className="absolute inset-0 rounded-full border-[3px] border-blue-400/60 border-t-blue-300 border-r-blue-300/0"
            style={{ animation: 'preloader-spin 1.2s linear infinite' }}
          />
          <div
            className="absolute inset-2 rounded-full border-[2px] border-cyan-400/40 border-b-cyan-300/0"
            style={{ animation: 'preloader-spin 1.8s linear infinite reverse' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-300 to-cyan-200 shadow-[0_0_18px_4px_rgba(96,165,250,0.55)]" />
          </div>
        </div>

        <p className="mt-8 text-center text-xs uppercase tracking-[0.3em] text-blue-200/70 font-semibold">
          Highzcore
        </p>
      </div>

      <style>{`
        @keyframes preloader-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
