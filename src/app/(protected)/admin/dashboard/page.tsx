import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import RequestContador from '@root/src/components/(private)/contador'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
const feedbackData = [
  {
    email: 'usuario1@example.com',
    feedback: 'Excelente servicio, muy satisfecho...',
    puntuacion: 5
  },
  {
    email: 'usuario2@example.com',
    feedback: 'Bueno, pero podría mejorar en...',
    puntuacion: 4
  },
  {
    email: 'usuario3@example.com',
    feedback: 'Tuve algunos problemas con...',
    puntuacion: 3
  },
  {
    email: 'usuario4@example.com',
    feedback: 'No cumplió mis expectativas...',
    puntuacion: 2
  },
  {
    email: 'usuario5@example.com',
    feedback: 'Muy insatisfecho con el servicio...',
    puntuacion: 1
  }
]

const sesionesRecientes = [
  { status: 'active', avatar: '/avatar1.png', email: 'usuario1@example.com' },
  { status: 'idle', avatar: '/avatar2.png', email: 'usuario2@example.com' },
  { status: 'offline', avatar: '/avatar3.png', email: 'usuario3@example.com' },
  { status: 'active', avatar: '/avatar4.png', email: 'usuario4@example.com' },
  { status: 'idle', avatar: '/avatar5.png', email: 'usuario5@example.com' }
]
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
        <h1 className='font-exo font-bold text-xl'>Hola este es dashboard</h1>
        <RequestContador />
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle>Feedback en vivo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Correo electrónico</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Puntuación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>{item.feedback.substring(0, 30)}...</TableCell>
                      <TableCell>{item.puntuacion}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sesiones recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Correo electrónico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sesionesRecientes.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${
                            item.status === 'active'
                              ? 'bg-green-500 animate-pulse'
                              : item.status === 'idle'
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                          }`}
                        ></span>
                      </TableCell>
                      <TableCell>
                        <Avatar>
                          <AvatarImage
                            src={item.avatar}
                            alt={`Avatar de ${item.email}`}
                          />
                          <AvatarFallback>
                            {item.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>{item.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
