type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function SectionHeading({ title, description, action }: Props) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-[32px]">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
