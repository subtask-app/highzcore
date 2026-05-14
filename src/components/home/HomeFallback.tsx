// Static visual fallback for users who:
//   • request `prefers-reduced-motion: reduce`, OR
//   • are on a device whose browser refuses WebGL
//
// Same brand vibe, zero JS animation, zero three.js bundle work.

export default function HomeFallback() {
  return (
    <div className="fixed inset-0 -z-10 bg-slate-950" aria-hidden="true">
      {/* Soft radial brand glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(14,165,233,0.18),transparent_70%)]" />
      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a18_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a18_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_40%,#000_60%,transparent_100%)]" />
      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
    </div>
  );
}
