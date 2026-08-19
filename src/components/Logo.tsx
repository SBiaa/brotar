export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <div className="logo">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 21V10" stroke="#5C7A5E" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 12C12 12 6 12 6 6C12 6 12 12 12 12Z" fill="#5C7A5E" />
        <path d="M12 15C12 15 18 15 18 9C12 9 12 15 12 15Z" fill="#E0A458" />
      </svg>
      {withWordmark ? "Brotar" : null}
    </div>
  );
}
