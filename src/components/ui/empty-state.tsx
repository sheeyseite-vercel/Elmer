import { Card } from "./card";

/**
 * Shown whenever a dataset is empty. Deliberately displays "No data yet" —
 * never zeros or placeholder numbers (product rule 3).
 */
export function EmptyState({
  title = "No data yet",
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="text-center">
      <p className="text-lg font-semibold">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-prose text-sm text-muted">{children}</div> : null}
    </Card>
  );
}
