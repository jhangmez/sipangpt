import { Skeleton } from '@/components/ui/skeleton'

export function SidebarSkeleton() {
  return (
    <div className='flex flex-col w-full gap-2 pt-2'>
      <div className='flex h-12 w-full bg-primary/5 justify-between rounded-xl items-center p-2.5'>
        <Skeleton className='h-4 w-3/4 rounded-md' />
        <Skeleton className='h-4 w-4 rounded-full' />
      </div>

      <div className='flex h-12 w-full bg-primary/5 opacity-80 justify-between rounded-xl items-center p-2.5'>
        <Skeleton className='h-4 w-3/4 rounded-md' />
        <Skeleton className='h-4 w-4 rounded-full' />
      </div>

      <div className='flex h-12 w-full bg-primary/5 opacity-60 justify-between rounded-xl items-center p-2.5'>
        <Skeleton className='h-4 w-2/3 rounded-md' />
        <Skeleton className='h-4 w-4 rounded-full' />
      </div>

      <div className='flex h-12 w-full bg-primary/5 opacity-40 justify-between rounded-xl items-center p-2.5'>
        <Skeleton className='h-4 w-1/2 rounded-md' />
        <Skeleton className='h-4 w-4 rounded-full' />
      </div>
    </div>
  )
}
