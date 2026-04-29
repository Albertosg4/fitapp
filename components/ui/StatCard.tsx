import * as React from "react";
import { Card, CardContent } from "./Card";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  description?: string;
  trend?: React.ReactNode;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, description, trend, icon, className = "", ...props }: StatCardProps): React.JSX.Element {
  return (
    <Card className={className} {...props}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          </div>
          {icon ? <div className="text-gray-400">{icon}</div> : null}
        </div>
        {description ? <p className="mt-3 text-sm text-gray-500">{description}</p> : null}
        {trend ? <div className="mt-2 text-sm font-medium text-gray-700">{trend}</div> : null}
      </CardContent>
    </Card>
  );
}
