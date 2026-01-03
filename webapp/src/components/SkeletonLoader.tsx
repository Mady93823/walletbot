import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={twMerge(
        clsx(
          "animate-pulse rounded-md bg-slate-700/50",
          className
        )
      )}
    />
  );
};

export const SkeletonCard = () => {
  return (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
};

export const SkeletonList = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
           <div className="flex items-center gap-3">
             <Skeleton className="w-10 h-10 rounded-full" />
             <div className="space-y-2">
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-3 w-16" />
             </div>
           </div>
           <div className="space-y-2 flex flex-col items-end">
             <Skeleton className="h-4 w-20" />
             <Skeleton className="h-3 w-12" />
           </div>
        </div>
      ))}
    </div>
  );
};
