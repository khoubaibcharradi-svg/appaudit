import Image from "next/image";

interface Props {
  size?: number;
  /** Full horizontal lockup (icon + wordmark) instead of the icon alone. */
  variant?: "icon" | "full";
  className?: string;
}

export default function PromofoodLogo({ size = 28, variant = "icon", className = "" }: Props) {
  if (variant === "full") {
    return (
      <Image
        src="/promofood-logo.png"
        alt="Promofood"
        width={280}
        height={86}
        priority
        className={className}
        style={{ height: size, width: "auto" }}
      />
    );
  }

  return (
    <Image
      src="/promofood-icon.png"
      alt="Promofood"
      width={size}
      height={size}
      priority
      className={className}
    />
  );
}
