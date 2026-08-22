function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "w-8 h-8 text-xs", md: "w-12 h-12 text-base", lg: "w-16 h-16 text-xl" };

export default function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover border-2 border-surface ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline font-bold shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
