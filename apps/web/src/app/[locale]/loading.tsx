import { Skeleton } from "@components";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-5xl space-y-4 px-4 py-10" aria-busy="true">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
