import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import SesionesActivas from '@Components/(private)/SesionesActivas'
import { RequestChart } from '@root/src/components/(private)/requestChart'

export default function Page() {
  return (
    <>
      <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
        <div className='flex items-center gap-2 px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />
          <Breadcrumb>
            <BreadcrumbList className='font-exo'>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink href='/admin/dashboard'>Datos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>Resumen</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div
        className='flex flex-1 flex-col gap-4 p-4 pt-0'
        title='Resumen'
        data-parent-title='Datos'
        data-link='dashboard'
      >
        <h1 className='font-frances text-2xl font-bold'>Dashboard</h1>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <RequestChart />
          <SesionesActivas />
        </div>
      </div>
    </>
  )
}
