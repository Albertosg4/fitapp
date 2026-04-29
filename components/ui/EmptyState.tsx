import * as React from "react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon, className = "", ...props }: EmptyStateProps): React.JSX.Element {
  return (
    <div className={["rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center", className].join(" ")} {...props}>
      {icon ? <div className="mx-auto mb-4 text-gray-400">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description ? <p className="mt-2 text-sm text-gray-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
