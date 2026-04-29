import * as React from "react";

type SkeletonRounded = "sm" | "md" | "lg" | "full";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: SkeletonRounded;
}

const roundedClasses: Record<SkeletonRounded, string> = {
  sm: "rounded",
  md: "rounded-md",
  lg: "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({ className = "", rounded = "md", ...props }: SkeletonProps): React.JSX.Element {
  return <div className={["animate-pulse bg-gray-200", roundedClasses[rounded], className].join(" ")} {...props} />;
}
