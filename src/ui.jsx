// Shared building blocks with the 16-bit look

export function Panel({ children, className = '' }) {
  return <section className={`pixel-box rounded-sm bg-card p-4 ${className}`}>{children}</section>
}

export function Pixel({ children, className = '' }) {
  return <p className={`font-pixel text-xs uppercase leading-relaxed tracking-wider text-info ${className}`}>{children}</p>
}

const BUTTONS = {
  primary: 'bg-ok text-black shadow-[0_4px_0_#1f8a4f] hover:brightness-110',
  danger: 'bg-bad text-white shadow-[0_4px_0_#a3214f] hover:brightness-110',
  gold: 'bg-gold text-black shadow-[0_4px_0_#a8842d] hover:brightness-110',
  outline: 'border-2 border-line bg-panel text-ink hover:bg-hover',
}

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`rounded-sm px-5 py-3 font-pixel text-[0.8rem] uppercase tracking-wider transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 ${BUTTONS[variant]} ${className}`}
      {...props}
    />
  )
}

// A little pixel knight in the player's color (helmet, visor, tunic, and a bandage sword)
export function Knight({ color = '#3ddc84', size = 40, className = '' }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} shapeRendering="crispEdges" className={className} aria-hidden="true">
      <path fill="#c9d1e0" d="M5 2h6v1h1v5h-1v1H5V8H4V3h1z" />
      <path fill="#0f0e17" d="M6 5h4v1H6z" />
      <path fill={color} d="M5 10h6v4H5z" />
      <path fill="#7a7799" d="M5 14h2v1H5zM9 14h2v1H9z" />
      <path fill="#ff3d81" d="M12 4h1v7h-1z" />
      <path fill="#f4f1de" d="M12 6h1v1h-1zM12 8h1v1h-1z" />
      <path fill="#ffd166" d="M11 10h3v1h-3z" />
    </svg>
  )
}

export function CenterCard({ title, children }) {
  return (
    <main className="world-bg flex min-h-dvh items-center justify-center p-4 text-ink">
      <Panel className="w-full max-w-md text-center">
        <h1 className="font-pixel text-xl leading-relaxed text-ok">{title}</h1>
        {children}
      </Panel>
    </main>
  )
}
