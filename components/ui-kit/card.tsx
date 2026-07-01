import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  title,
  action,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
  padded?: boolean;
}) {
  return (
    <div className={`card ${padded ? "p-5" : ""} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {typeof title === "string" ? (
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
          ) : title}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
