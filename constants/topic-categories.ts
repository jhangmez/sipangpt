export interface InitialTopicCategory {
  name: string
  code: string
  description: string
  order: number
  subcategories: Array<{
    name: string
    code: string
    description?: string
  }>
}

export const INITIAL_TOPIC_CATEGORIES: InitialTopicCategory[] = [
  {
    name: 'Admisión e Ingreso',
    code: 'ADMISION',
    description: 'Procesos de postulación, examen ordinario, traslados y modalidades especiales de ingreso a la USS.',
    order: 0,
    subcategories: [
      { name: 'Examen Ordinario', code: 'ADM_ORDINARIO', description: 'Requisitos, fechas y costos del examen regular' },
      { name: 'Modalidades Especiales', code: 'ADM_ESPECIALES', description: 'Primeros puestos, graduados y deportistas calificados' },
      { name: 'Requisitos de Ingreso', code: 'ADM_REQUISITOS', description: 'Documentación obligatoria para postulantes' },
      { name: 'Centro Preuniversitario', code: 'ADM_CENTRO_PRE', description: 'Ciclos de preparación e ingreso directo' },
    ],
  },
  {
    name: 'Matrícula y Registro Académico',
    code: 'MATRICULA',
    description: 'Cronogramas de matrícula, cursos extracurriculares, rectificaciones y reservas de vacante.',
    order: 1,
    subcategories: [
      { name: 'Matrícula Regular', code: 'MAT_REGULAR', description: 'Inscripción semestral de asignaturas por portal' },
      { name: 'Matrícula Extemporánea', code: 'MAT_EXTEMPORANEA', description: 'Plazos extraordinarios y recargos administrativos' },
      { name: 'Reserva de Matrícula', code: 'MAT_RESERVA', description: 'Suspensión temporal de estudios hasta por 3 años' },
      { name: 'Retiro de Asignatura', code: 'MAT_RETIRO', description: 'Procedimiento para anular inscripción de un curso' },
    ],
  },
  {
    name: 'Pensiones, Pagos y Tesorería',
    code: 'PAGOS_PENSIONES',
    description: 'Tarifas educativas, fraccionamientos de deuda, medios de pago y constancias de no adeudo.',
    order: 2,
    subcategories: [
      { name: 'Cronograma de Pensiones', code: 'PAG_CRONOGRAMA', description: 'Fechas de vencimiento de cuotas mensuales' },
      { name: 'Fraccionamiento de Deuda', code: 'PAG_FRACCIONAMIENTO', description: 'Convenios de pago para estudiantes' },
      { name: 'Métodos y Canales de Pago', code: 'PAG_CANALES', description: 'Bancos autorizados, pasarelas y pagos en línea' },
      { name: 'Devoluciones y Saldos', code: 'PAG_DEVOLUCIONES', description: 'Reintegros por trámites o retiros' },
    ],
  },
  {
    name: 'Convalidaciones y Traslados',
    code: 'CONVALIDACIONES',
    description: 'Equivalencias curriculares, traslados internos de carrera y traslados externos de otras universidades.',
    order: 3,
    subcategories: [
      { name: 'Traslado Interno', code: 'CONV_TRASLADO_INTERNO', description: 'Cambio de carrera dentro de la USS' },
      { name: 'Traslado Externo', code: 'CONV_TRASLADO_EXTERNO', description: 'Ingreso proveniente de otra universidad nacional o extranjera' },
      { name: 'Convalidación de Asignaturas', code: 'CONV_ASIGNATURAS', description: 'Evaluación de sílabos para homologación de créditos' },
    ],
  },
  {
    name: 'Grados, Títulos y Graduación',
    code: 'GRADOS_TITULOS',
    description: 'Requisitos de egreso, obtención del grado de Bachiller y Título Profesional universitario.',
    order: 4,
    subcategories: [
      { name: 'Grado de Bachiller', code: 'GRA_BACHILLER', description: 'Requisitos de idiomas, créditos y trabajo de investigación' },
      { name: 'Título Profesional', code: 'GRA_TITULO', description: 'Sustentación de tesis o examen de suficiencia profesional' },
      { name: 'Sustentación y Asesoría', code: 'GRA_SUSTENTACION', description: 'Designación de jurados y dictamen de tesis' },
    ],
  },
  {
    name: 'Becas y Bienestar Universitario',
    code: 'BECAS',
    description: 'Beneficios socioeconómicos, becas por rendimiento académico y apoyo psicopedagógico.',
    order: 5,
    subcategories: [
      { name: 'Beca Socioeconómica', code: 'BEC_SOCIOECONOMICA', description: 'Evaluación social para descuento en pensiones' },
      { name: 'Beca por Excelencia', code: 'BEC_EXCELENCIA', description: 'Beneficio para los primeros puestos de cada escuela' },
      { name: 'Beca Deportiva / Cultural', code: 'BEC_TALENTO', description: 'Para deportistas destacados y elencos universitarios' },
    ],
  },
  {
    name: 'Otros Trámites y Servicios Institucionales',
    code: 'OTROS',
    description: 'Carné universitario, constancias de estudio, biblioteca virtual y soporte de campus.',
    order: 6,
    subcategories: [
      { name: 'Carné Universitario SUNEDU', code: 'OTR_CARNE', description: 'Emisión, renovación y duplicado de carné' },
      { name: 'Constancias y Certificados', code: 'OTR_CONSTANCIAS', description: 'Récord de notas, orden de mérito y estudios' },
      { name: 'Biblioteca y Recursos Virtuales', code: 'OTR_BIBLIOTECA', description: 'Acceso a bases de datos EBSCO, Scopus y repositorios' },
      { name: 'Soporte Campus Virtual', code: 'OTR_SOPORTE', description: 'Restablecimiento de contraseñas y accesos a Blackboard' },
    ],
  },
]
