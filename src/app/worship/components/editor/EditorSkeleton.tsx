import { Skeleton } from '@/components/ui/skeleton';

export function EditorSkeleton() {
  return (
    <div className='flex flex-col gap-5 flex-1 min-h-0'>
      <div className='flex items-center justify-between gap-4 shrink-0'>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-5 w-px' />
          <Skeleton className='h-5 w-48' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-20 rounded-md' />
          <Skeleton className='h-9 w-36 rounded-md' />
        </div>
      </div>
      <div className='flex gap-5 flex-1 min-h-0'>
        <div className='w-52 shrink-0 flex flex-col gap-3'>
          <Skeleton className='h-3 w-12' />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className='w-full rounded-xl'
              style={{ aspectRatio: '16/9' }}
            />
          ))}
        </div>
        <div className='w-96 shrink-0 flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-3 w-16' />
            <Skeleton className='h-3 w-20' />
          </div>
          <Skeleton className='flex-1 rounded-xl' style={{ minHeight: '400px' }} />
        </div>
        <div className='flex-1 min-w-0 flex flex-col gap-4'>
          <div className='space-y-1.5'>
            <Skeleton className='h-3 w-14' />
            <Skeleton className='w-full rounded-xl' style={{ aspectRatio: '16/9' }} />
            <div className='flex items-center justify-between pt-0.5'>
              <Skeleton className='h-7 w-16 rounded-md' />
              <Skeleton className='h-3 w-10' />
              <Skeleton className='h-7 w-16 rounded-md' />
            </div>
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-3 w-20' />
            <div className='grid grid-cols-3 gap-1.5 p-1'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className='rounded-md' style={{ aspectRatio: '16/5' }} />
              ))}
            </div>
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-3 w-20' />
            <div className='grid grid-cols-2 gap-1.5'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-8 rounded-md' />
              ))}
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className='space-y-1.5'>
                <Skeleton className='h-3 w-24' />
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className='h-8 rounded-md' />
                ))}
              </div>
            ))}
          </div>
          <div className='grid grid-cols-2 gap-4'>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className='space-y-1.5'>
                <Skeleton className='h-3 w-16' />
                <Skeleton className='h-9 rounded-md' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
