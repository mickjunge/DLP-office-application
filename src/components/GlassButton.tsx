import type { ButtonHTMLAttributes } from "react";

// The davidlewis.nl pill button: translucent glass fill with a 1px ring
// that a light glow travels around (CSS in src/index.css). Plain by
// default, `primary` for the main action, `danger` for destructive ones.
export default function GlassButton({
  tone,
  size,
  icon,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "danger";
  size?: "sm";
  icon?: boolean;
}) {
  const mods = [tone && `glass-btn-outer--${tone}`, size && `glass-btn-outer--${size}`, icon && "glass-btn-outer--icon"]
    .filter(Boolean)
    .join(" ");
  return (
    <button type={type} className={`glass-btn-outer ${mods} ${className}`} {...rest}>
      <span className="glass-btn">{children}</span>
      <span className="glass-btn-border" aria-hidden>
        <span className="glass-btn-border-glow1" />
        <span className="glass-btn-border-glow2" />
      </span>
    </button>
  );
}
