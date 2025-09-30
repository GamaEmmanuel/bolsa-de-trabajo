// Mexican Cities by Tier
export const MEXICAN_CITIES = {
  'tier-1': [
    { value: 'mexico-city', label: 'Ciudad de México (CDMX)' },
    { value: 'guadalajara', label: 'Guadalajara, Jalisco' },
    { value: 'monterrey', label: 'Monterrey, Nuevo León' }
  ],
  'tier-2': [
    { value: 'puebla', label: 'Puebla, Puebla' },
    { value: 'tijuana', label: 'Tijuana, Baja California' },
    { value: 'leon', label: 'León, Guanajuato' },
    { value: 'juarez', label: 'Ciudad Juárez, Chihuahua' },
    { value: 'zapopan', label: 'Zapopan, Jalisco' },
    { value: 'nezahualcoyotl', label: 'Nezahualcóyotl, Estado de México' },
    { value: 'chihuahua', label: 'Chihuahua, Chihuahua' },
    { value: 'naucalpan', label: 'Naucalpan, Estado de México' },
    { value: 'merida', label: 'Mérida, Yucatán' },
    { value: 'san-luis-potosi', label: 'San Luis Potosí, San Luis Potosí' }
  ],
  'tier-3': [
    { value: 'aguascalientes', label: 'Aguascalientes, Aguascalientes' },
    { value: 'hermosillo', label: 'Hermosillo, Sonora' },
    { value: 'saltillo', label: 'Saltillo, Coahuila' },
    { value: 'mexicali', label: 'Mexicali, Baja California' },
    { value: 'culiacan', label: 'Culiacán, Sinaloa' },
    { value: 'acapulco', label: 'Acapulco, Guerrero' },
    { value: 'cancun', label: 'Cancún, Quintana Roo' },
    { value: 'queretaro', label: 'Querétaro, Querétaro' },
    { value: 'morelia', label: 'Morelia, Michoacán' },
    { value: 'toluca', label: 'Toluca, Estado de México' }
  ]
}

// Job Type Options
export const JOB_TYPE_OPTIONS = [
  { value: 'full-time', label: 'Tiempo Completo' },
  { value: 'part-time', label: 'Medio Tiempo' },
  { value: 'contract', label: 'Contrato' },
  { value: 'internship', label: 'Prácticas' },
  { value: 'freelance', label: 'Freelance' }
]

// Employment Type Options
export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'remote', label: 'Remoto' },
  { value: 'hybrid', label: 'Híbrido' },
  { value: 'on-site', label: 'Presencial' }
]

// Experience Level Options
export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: '0-1', label: '0-1 años' },
  { value: '1-3', label: '1-3 años' },
  { value: '3-5', label: '3-5 años' },
  { value: '5-10', label: '5-10 años' },
  { value: '10+', label: '10+ años' }
]

// Education Level Options
export const EDUCATION_LEVEL_OPTIONS = [
  { value: 'no-requirement', label: 'Sin requisito' },
  { value: 'high-school', label: 'Preparatoria' },
  { value: 'bachelor', label: 'Licenciatura' },
  { value: 'master', label: 'Maestría' },
  { value: 'phd', label: 'Doctorado' }
]

// Job Category Options
export const JOB_CATEGORY_OPTIONS = [
  { value: 'engineering', label: 'Ingeniería' },
  { value: 'sales', label: 'Ventas' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Diseño' },
  { value: 'hr', label: 'Recursos Humanos' },
  { value: 'finance', label: 'Finanzas' },
  { value: 'operations', label: 'Operaciones' },
  { value: 'customer-service', label: 'Atención al Cliente' },
  { value: 'other', label: 'Otro' }
]

// Job Level Options
export const JOB_LEVEL_OPTIONS = [
  { value: 'entry', label: 'Junior' },
  { value: 'mid-level', label: 'Intermedio' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Líder' },
  { value: 'executive', label: 'Ejecutivo' }
]

// Phase 3 Options
export const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 empleados' },
  { value: '11-50', label: '11-50 empleados' },
  { value: '51-200', label: '51-200 empleados' },
  { value: '201-500', label: '201-500 empleados' },
  { value: '500+', label: '500+ empleados' }
]

export const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Tecnología' },
  { value: 'healthcare', label: 'Salud' },
  { value: 'finance', label: 'Finanzas' },
  { value: 'education', label: 'Educación' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufactura' },
  { value: 'consulting', label: 'Consultoría' },
  { value: 'non-profit', label: 'Sin fines de lucro' },
  { value: 'government', label: 'Gobierno' },
  { value: 'other', label: 'Otro' }
]

export const START_DATE_OPTIONS = [
  { value: 'immediate', label: 'Inmediato' },
  { value: '1-2-weeks', label: '1-2 semanas' },
  { value: '1-month', label: '1 mes' },
  { value: '2-months', label: '2 meses' },
  { value: 'flexible', label: 'Flexible' }
]

export const URGENCY_LEVEL_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'critical', label: 'Crítico' }
]

export const APPLICATION_PROCESS_OPTIONS = [
  { value: 'resume-only', label: 'Solo CV' },
  { value: 'portfolio-required', label: 'Portafolio requerido' },
  { value: 'cover-letter-required', label: 'Carta de presentación requerida' },
  { value: 'video-interview', label: 'Entrevista en video' },
  { value: 'technical-test', label: 'Prueba técnica' }
]

export const INTERVIEW_ROUNDS_OPTIONS = [
  { value: '1', label: '1 ronda' },
  { value: '2', label: '2 rondas' },
  { value: '3', label: '3 rondas' },
  { value: '4+', label: '4+ rondas' },
  { value: 'varies', label: 'Varía' }
]

export const BENEFITS_OPTIONS = [
  { value: 'health-insurance', label: 'Seguro médico' },
  { value: 'dental-insurance', label: 'Seguro dental' },
  { value: 'vision-insurance', label: 'Seguro de visión' },
  { value: 'life-insurance', label: 'Seguro de vida' },
  { value: 'retirement-plan', label: 'Plan de retiro' },
  { value: 'vacation-days', label: 'Días de vacaciones' },
  { value: 'sick-leave', label: 'Días de enfermedad' },
  { value: 'flexible-hours', label: 'Horarios flexibles' },
  { value: 'remote-work', label: 'Trabajo remoto' },
  { value: 'professional-development', label: 'Desarrollo profesional' },
  { value: 'gym-membership', label: 'Membresía de gimnasio' },
  { value: 'meal-vouchers', label: 'Vales de comida' },
  { value: 'transportation', label: 'Transporte' },
  { value: 'stock-options', label: 'Opciones de acciones' },
  { value: 'bonus', label: 'Bonos' }
]

export const COMPANY_CULTURE_OPTIONS = [
  { value: 'startup', label: 'Startup' },
  { value: 'corporate', label: 'Corporativo' },
  { value: 'innovative', label: 'Innovador' },
  { value: 'collaborative', label: 'Colaborativo' },
  { value: 'fast-paced', label: 'Ritmo acelerado' },
  { value: 'work-life-balance', label: 'Equilibrio trabajo-vida' },
  { value: 'diverse', label: 'Diverso' },
  { value: 'inclusive', label: 'Inclusivo' },
  { value: 'creative', label: 'Creativo' },
  { value: 'data-driven', label: 'Basado en datos' },
  { value: 'customer-focused', label: 'Enfocado en el cliente' },
  { value: 'team-oriented', label: 'Orientado al equipo' }
]

export const EXTERNAL_JOB_BOARDS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'glassdoor', label: 'Glassdoor' },
  { value: 'computrabajo', label: 'Computrabajo' },
  { value: 'occ-mundial', label: 'OCC Mundial' },
  { value: 'bumeran', label: 'Bumeran' },
  { value: 'zonajobs', label: 'ZonaJobs' },
  { value: 'trabajos', label: 'Trabajos.com' }
]
