export function LogoMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="32" fill="#1e4d3a" />
      <path
        d="M12 28c6-12 14-14 20-10 6-6 16-4 22 6"
        fill="none"
        stroke="#f0b429"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="36" r="15" fill="#ffe6c4" />
      <circle cx="26.5" cy="35" r="5.2" fill="none" stroke="#173528" strokeWidth="1.6" />
      <circle cx="37.5" cy="35" r="5.2" fill="none" stroke="#173528" strokeWidth="1.6" />
      <path d="M31.2 35h1.6" stroke="#173528" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="26.5" cy="35" r="1.5" fill="#173528" />
      <circle cx="37.5" cy="35" r="1.5" fill="#173528" />
      <path
        d="M26 42.5c2.4 2.4 9.6 2.4 12 0"
        fill="none"
        stroke="#173528"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="48" cy="16" r="2" fill="#f0b429" />
    </svg>
  );
}

export function AdultAvatar({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="32" fill="#f0b429" />
      <circle cx="32" cy="36" r="16" fill="#ffe0bf" />
      <path d="M16 30c4-10 28-12 34 2-8-6-24-6-34-2z" fill="#1e4d3a" />
      <circle cx="26" cy="36" r="1.7" fill="#173528" />
      <circle cx="38" cy="36" r="1.7" fill="#173528" />
      <path d="M27 43c2 2 8 2 10 0" fill="none" stroke="#173528" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
