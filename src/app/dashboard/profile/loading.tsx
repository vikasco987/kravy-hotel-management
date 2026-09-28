import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <Card>
        <CardContent className="flex items-center gap-6 p-6">
          <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />

          <div className="flex-1 space-y-3">
            <div className="h-5 w-1/2 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-muted animate-pulse rounded" />
              <div className="h-5 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>

          <div className="h-9 w-28 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>

      {/* Info cards */}
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}

      {/* Media skeleton */}
      <Card>
        <CardHeader>
          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
