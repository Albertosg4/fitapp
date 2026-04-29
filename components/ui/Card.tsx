import * as React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;
type HeadingProps = React.HTMLAttributes<HTMLHeadingElement>;
type ParagraphProps = React.HTMLAttributes<HTMLParagraphElement>;

export function Card({ className = "", ...props }: DivProps): React.JSX.Element {
  return <div className={["rounded-2xl border border-gray-200 bg-white shadow-sm", className].join(" ")} {...props} />;
}

export function CardHeader({ className = "", ...props }: DivProps): React.JSX.Element {
  return <div className={["px-6 pt-6", className].join(" ")} {...props} />;
}

export function CardTitle({ className = "", ...props }: HeadingProps): React.JSX.Element {
  return <h3 className={["text-lg font-semibold text-gray-900", className].join(" ")} {...props} />;
}

export function CardDescription({ className = "", ...props }: ParagraphProps): React.JSX.Element {
  return <p className={["mt-1 text-sm text-gray-500", className].join(" ")} {...props} />;
}

export function CardContent({ className = "", ...props }: DivProps): React.JSX.Element {
  return <div className={["px-6 py-4", className].join(" ")} {...props} />;
}

export function CardFooter({ className = "", ...props }: DivProps): React.JSX.Element {
  return <div className={["px-6 pb-6 pt-2", className].join(" ")} {...props} />;
}
