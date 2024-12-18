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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import SesionesActivas from '@Components/(private)/SesionesActivas'

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
        <h1 className='font-exo font-bold text-xl'>Dashboard</h1>

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

          <SesionesActivas />
        </div>
      </div>
    </>
  )
}
