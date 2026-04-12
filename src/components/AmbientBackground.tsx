/**
 * A soft starry gradient used behind every screen. Pure CSS — no assets.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(80,90,130,0.35), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(60,45,80,0.30), transparent 60%), linear-gradient(180deg, #0B0D12 0%, #11141C 100%)',
      }}
    >
      <svg className="absolute inset-0 w-full h-full opacity-60" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => {
          const x = (i * 997) % 100;
          const y = (i * 613) % 100;
          const r = ((i * 131) % 3) * 0.4 + 0.3;
          const o = (((i * 71) % 10) + 2) / 20;
          return (
            <circle
              key={i}
              cx={`${x}%`}
              cy={`${y}%`}
              r={r}
              fill="#F4EFD9"
              opacity={o}
            />
          );
        })}
      </svg>
    </div>
  );
}
