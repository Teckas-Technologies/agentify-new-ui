
import { Skeleton } from "@/Components/ui/skeleton";

interface LoadingSkeletonProps {
  rows?: number;
}

export const LoadingSkeleton = ({ rows = 5 }: LoadingSkeletonProps) => {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="md:h-12 md:w-12 w-8 h-8 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
};