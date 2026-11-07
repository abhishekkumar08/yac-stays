import { Card } from "@kasumi/ui";

export function Section({ title, children }) {
  return (
    <Card padding="md" className="space-y-4">
      <h2 className="text-title text-fg">{title}</h2>
      {children}
    </Card>
  );
}
