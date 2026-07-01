import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-primary">{title}</h1>
        {subtitle && <p className="text-sm mt-0.5 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
