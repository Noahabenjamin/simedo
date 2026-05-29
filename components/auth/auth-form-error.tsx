type Props = {
  message?: string;
};

export function AuthFormError({ message }: Props) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
    >
      {message}
    </div>
  );
}
