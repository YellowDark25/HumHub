type ChatTopicIconProps = {
  className?: string;
};

export function ChatTopicIcon({ className = "h-4 w-4" }: ChatTopicIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <g transform="rotate(42 12 12)">
        <rect x="3.1" y="6.1" width="4.2" height="11.8" rx="1.2" />
        <rect x="16.7" y="6.1" width="4.2" height="11.8" rx="1.2" />
        <rect x="8.4" y="7.35" width="7.2" height="1.65" rx="0.55" />
        <rect x="8.4" y="11.18" width="7.2" height="1.65" rx="0.55" />
        <rect x="8.4" y="15" width="7.2" height="1.65" rx="0.55" />
      </g>
    </svg>
  );
}
