type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div>
      {eyebrow && (
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          {eyebrow}
        </p>
      )}

      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>

      {description && (
        <p className="mt-2 text-sm text-text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
