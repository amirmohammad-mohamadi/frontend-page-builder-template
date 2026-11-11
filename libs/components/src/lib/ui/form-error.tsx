/** The error block under a form. Pass the output of `describeApiError` from the services layer. */
export function FormError({
  error,
}: {
  error: { message: string; details?: string } | null | undefined;
}) {
  if (!error) return null;
  return (
    <div role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
      <p>{error.message}</p>
      {error.details ? <p className="mt-1 opacity-80">{error.details}</p> : null}
    </div>
  );
}
