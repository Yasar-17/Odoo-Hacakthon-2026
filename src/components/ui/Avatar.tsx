function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const colors = [
  "bg-primary-100 text-primary-700",
  "bg-success-light text-success-text",
  "bg-info-light text-info-text",
  "bg-warning-light text-warning-text",
  "bg-danger-light text-danger-text",
  "bg-surface-200 text-surface-700",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" };

export default function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold ${getColor(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
