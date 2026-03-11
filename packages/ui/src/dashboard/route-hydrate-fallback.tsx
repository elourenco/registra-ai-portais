import { Skeleton } from "../components/skeleton";

export function RouteHydrateFallback() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 md:p-8">
        <Skeleton className="h-12 w-56 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={String(index)} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.5fr,1fr]">
          <Skeleton className="h-[320px] rounded-3xl" />
          <Skeleton className="h-[320px] rounded-3xl" />
        </div>
        <Skeleton className="h-[420px] rounded-3xl" />
      </div>
    </div>
  );
}
