type IconProps = { className?: string };

export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

export function MinusIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 10h12" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M7 4.5v11l9-5.5z" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M6.6 2.5l2 4.2-1.700 1.300a10 10 0 004.600 4.600l1.300-1.700 4.200 2-.4 2.700a2 2 0 01-2 1.700A13.500 13.500 0 012.200 4.900a2 2 0 011.700-2z" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M2 4h16v12H2zM3.500 5.500L10 10.500l6.500-5z" fillRule="evenodd" />
    </svg>
  );
}
