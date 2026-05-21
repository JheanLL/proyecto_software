export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E40AF" /> {/* Azul corporativo */}
          <stop offset="100%" stopColor="#0F766E" /> {/* Verde azulado */}
        </linearGradient>
      </defs>
      
      {/* Fondo Circular */}
      <circle cx="50" cy="50" r="50" fill="url(#logo-gradient)" />
      
      {/* Líneas de conexión organizacionales */}
      <path d="M28 56 L50 32 L72 56" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <path d="M50 32 V55" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

      {/* Avatar Central (Arriba) */}
      <circle cx="50" cy="28" r="7" fill="white" />
      <path d="M39 46 C39 40 43.5 37 50 37 C56.5 37 61 40 61 46 V47 H39 V46 Z" fill="white" />
      
      {/* Avatar Izquierdo (Abajo) */}
      <circle cx="28" cy="56" r="6" fill="white" opacity="0.95" />
      <path d="M19 72 C19 66.5 22.5 64 28 64 C33.5 64 37 66.5 37 72 V73 H19 V72 Z" fill="white" opacity="0.95" />
      
      {/* Avatar Derecho (Abajo) */}
      <circle cx="72" cy="56" r="6" fill="white" opacity="0.95" />
      <path d="M63 72 C63 66.5 66.5 64 72 64 C77.5 64 81 66.5 81 72 V73 H63 V72 Z" fill="white" opacity="0.95" />
    </svg>
  );
}