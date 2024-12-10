import { auth } from '@root/auth'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import TablaSesiones from '@Components/(private)/TablaSesiones'
import PerfilUsuario from '@Components/(private)/PerfilUsuario'

export default async function Page() {
  const session = await auth()

  if (!session || !session.user) {
    return (
      <div className='flex flex-col gap-4 p-4 pt-0'>
        <p>No has iniciado sesión.</p>
      </div>
    )
  }

  return (
    <>
      <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
        <div className='flex items-center gap-2 px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />
          <Breadcrumb>
            <BreadcrumbList className='font-exo'>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink href='/admin/dashboard'>Cuenta</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>Yo</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className='flex flex-col gap-4 p-4 pt-0'>
        <Card className='md:max-w-lg'>
          <CardHeader>
            <CardTitle className='font-frances text-2xl'>Tu Perfil</CardTitle>
            <CardDescription>
              Aquí puedes ver y editar tu información.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerfilUsuario session={session} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='font-frances text-2xl'>
              Tus Sesiones
            </CardTitle>
            <CardDescription>
              Aquí puedes ver y cerrar tus sesiones activas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TablaSesiones session={session} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
