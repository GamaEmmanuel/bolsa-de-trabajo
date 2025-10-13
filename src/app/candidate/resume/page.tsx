'use client'

import React, { useState, useEffect } from 'react'
import { db, auth } from '../../../lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

interface CandidateProfile {
	userId: string
	firstName: string
	lastName: string
	email: string
	phone?: string
	location?: string
	summary?: string
	experience: WorkExperience[]
	education: Education[]
	skills: string[]
	languages?: Record<string, string>
	desiredSalary?: number
	availability?: string
}

interface WorkExperience {
	id: string
	company: string
	position: string
	startDate: string
	endDate?: string
	current: boolean
	description: string
	achievements: string[]
}

interface Education {
	id: string
	institution: string
	degree: string
	field: string
	startDate: string
	endDate?: string
	current: boolean
	gpa?: string
}

const ResumePage = () => {
	const [profile, setProfile] = useState<CandidateProfile>({
		userId: '',
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		location: '',
		summary: '',
		experience: [],
		education: [],
		skills: [],
		languages: {},
		desiredSalary: undefined,
		availability: '',
	})
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [user, setUser] = useState(auth.currentUser)
	const [skillSearch, setSkillSearch] = useState('')
	const [skillSuggestions, setSkillSuggestions] = useState<string[]>([])
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [showCategories, setShowCategories] = useState(false)

	// Expandable sections state
	const [expandedSections, setExpandedSections] = useState({
		basicInfo: false,
		experience: false,
		education: false,
		skills: false
	})

	// Skills organized by categories
	const skillCategories = {
		'Tecnología y Programación': [
			'JavaScript', 'Python', 'Java', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
			'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot',
			'HTML', 'CSS', 'SASS', 'SCSS', 'Bootstrap', 'Tailwind CSS', 'Material-UI',
			'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
			'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins',
			'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence',
			'Machine Learning', 'Artificial Intelligence', 'Data Science', 'TensorFlow', 'PyTorch',
			'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum', 'DevOps',
			'Linux', 'Windows', 'macOS', 'iOS', 'Android', 'React Native', 'Flutter',
			'Photoshop', 'Illustrator', 'Figma', 'Sketch', 'Adobe XD',
			'Excel', 'PowerPoint', 'Word', 'Google Analytics', 'Tableau'
		],
		'Construcción y Oficios': [
			'Construcción', 'Albañilería', 'Plomería', 'Electricidad', 'Carpintería', 'Herrería',
			'Pintura', 'Soldadura', 'Instalación de Pisos', 'Techado', 'Demolición',
			'Instalación Eléctrica', 'Fontanería', 'Refrigeración', 'Aire Acondicionado',
			'Instalación de Ventanas', 'Drywall', 'Azulejos', 'Mármol', 'Granito',
			'Operador de Grúa', 'Operador de Excavadora', 'Operador de Retroexcavadora',
			'Andamios', 'Seguridad en Construcción', 'Lectura de Planos'
		],
		'Manufactura y Producción': [
			'Manufactura', 'Producción', 'Ensamblaje', 'Soldadura MIG', 'Soldadura TIG',
			'Maquinaria CNC', 'Torno', 'Fresadora', 'Prensa Hidráulica', 'Control de Calidad',
			'Embalaje', 'Almacén', 'Inventario', 'Forklift', 'Montacargas',
			'Operador de Máquinas', 'Mantenimiento Industrial', 'Mecánica Industrial',
			'Automatización', 'Robótica Industrial', 'Soldadura por Puntos'
		],
		'Transporte y Logística': [
			'Conducción', 'Manejo de Camión', 'Transporte de Carga', 'Logística',
			'Distribución', 'Entrega', 'Mensajería', 'Taxi', 'Uber', 'DiDi',
			'Operador de Grúa', 'Conductor de Autobús', 'Manejo de Equipo Pesado',
			'Rutas de Entrega', 'Inventario de Transporte', 'Manejo de Documentos'
		],
		'Servicios y Atención': [
			'Atención al Cliente', 'Ventas', 'Cajero', 'Mesero', 'Cocina', 'Chef',
			'Bartender', 'Hostess', 'Limpieza', 'Mantenimiento', 'Seguridad',
			'Recepcionista', 'Conserje', 'Portero', 'Lavandería', 'Cuidado de Niños',
			'Enfermería', 'Asistente de Salud', 'Cuidado de Ancianos', 'Fisioterapia'
		],
		'Automotriz y Mecánica': [
			'Mecánica Automotriz', 'Reparación de Autos', 'Diagnóstico Automotriz',
			'Cambio de Aceite', 'Frenos', 'Transmisión', 'Motor', 'Suspensión',
			'Pintura Automotriz', 'Hojalatería', 'Vidrios Automotrices',
			'Mecánica de Motos', 'Reparación de Bicicletas', 'Mantenimiento Preventivo'
		],
		'Agricultura y Jardinería': [
			'Agricultura', 'Jardinería', 'Paisajismo', 'Mantenimiento de Jardines',
			'Podar Árboles', 'Corte de Césped', 'Riego', 'Fertilización',
			'Trabajo en Campo', 'Cosecha', 'Plantación', 'Manejo de Tractor',
			'Pesticidas', 'Invernaderos', 'Viveros'
		],
		'Limpieza y Mantenimiento': [
			'Limpieza Residencial', 'Limpieza Comercial', 'Limpieza Industrial',
			'Limpieza de Oficinas', 'Limpieza de Hospitales', 'Limpieza de Escuelas',
			'Mantenimiento de Edificios', 'Limpieza de Ventanas', 'Limpieza de Alfombras',
			'Desinfección', 'Limpieza Post-Construcción', 'Limpieza de Eventos'
		],
		'Gastronomía y Hospitalidad': [
			'Cocina', 'Preparación de Alimentos', 'Servicio de Mesa', 'Catering',
			'Panadería', 'Repostería', 'Carnicería', 'Pescadería', 'Verdulería',
			'Barista', 'Café', 'Bebidas', 'Cocktails', 'Cocina Mexicana',
			'Cocina Internacional', 'Buffet', 'Banquetes', 'Eventos'
		],
		'Salud y Cuidado Personal': [
			'Enfermería', 'Asistente Médico', 'Técnico en Radiología', 'Farmacéutico',
			'Fisioterapeuta', 'Masajista', 'Esteticista', 'Barbero', 'Peluquero',
			'Manicurista', 'Pedicurista', 'Cuidado Personal', 'Terapia Física',
			'Asistente Dental', 'Técnico de Laboratorio'
		],
		'Ventas y Retail': [
			'Ventas', 'Atención al Cliente', 'Cajero', 'Inventario', 'Merchandising',
			'Ventas por Teléfono', 'Ventas en Línea', 'E-commerce', 'Tienda',
			'Supermercado', 'Farmacia', 'Electrónicos', 'Ropa', 'Calzado',
			'Joyería', 'Muebles', 'Decoración', 'Ventas de Autos'
		],
		'Idiomas': [
			'Español', 'Inglés', 'Francés', 'Alemán', 'Portugués', 'Italiano',
			'Chino', 'Japonés', 'Coreano', 'Árabe', 'Ruso'
		],
		'Habilidades Blandas': [
			'Liderazgo', 'Comunicación', 'Resolución de Problemas', 'Trabajo en Equipo',
			'Gestión del Tiempo', 'Pensamiento Crítico', 'Habilidades Analíticas',
			'Adaptabilidad', 'Creatividad', 'Organización', 'Responsabilidad',
			'Iniciativa', 'Paciencia', 'Empatía', 'Honestidad', 'Puntualidad'
		]
	}

	// Flatten all skills for search functionality
	const popularSkills = Object.values(skillCategories).flat()

	// Filter skills based on search input
	const filterSkills = (searchTerm: string) => {
		if (searchTerm.length < 2) return []
		return popularSkills
			.filter(skill =>
				skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
				!profile.skills.includes(skill)
			)
			.slice(0, 8) // Limit to 8 suggestions
	}

	// Handle skill search input
	const handleSkillSearch = (value: string) => {
		setSkillSearch(value)
		const suggestions = filterSkills(value)
		setSkillSuggestions(suggestions)
		setShowSuggestions(suggestions.length > 0 && value.length >= 2)
	}

	// Add skill from suggestion
	const addSkillFromSuggestion = (skill: string) => {
		if (!profile.skills.includes(skill)) {
			setProfile(prev => ({
				...prev,
				skills: [...prev.skills, skill]
			}))
		}
		setSkillSearch('')
		setShowSuggestions(false)
	}

	// Add skill from category dropdown
	const addSkillFromCategory = (skill: string) => {
		if (!profile.skills.includes(skill)) {
			setProfile(prev => ({
				...prev,
				skills: [...prev.skills, skill]
			}))
		}
		setShowCategories(false)
	}

	// Handle keyboard events
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			addSkill()
		} else if (e.key === 'Escape') {
			setShowSuggestions(false)
			setShowCategories(false)
		}
	}

	// Toggle section expansion
	const toggleSection = (section: keyof typeof expandedSections) => {
		setExpandedSections(prev => ({
			...prev,
			[section]: !prev[section]
		}))
	}

	// Close suggestions when clicking outside or pressing escape
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement
			if (!target.closest('.skill-search-container')) {
				setShowSuggestions(false)
				setShowCategories(false)
			}
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setShowSuggestions(false)
				setShowCategories(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleKeyDown)

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [])

	// Fetch user profile
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
			setUser(currentUser)
			if (currentUser) {
				try {
					const profileRef = doc(db, 'candidateProfiles', currentUser.uid)
					const profileDoc = await getDoc(profileRef)

					if (profileDoc.exists()) {
						const profileData = profileDoc.data() as CandidateProfile
						setProfile(profileData)
					} else {
						// Initialize with user data
						setProfile(prev => ({
							...prev,
							userId: currentUser.uid,
							email: currentUser.email || '',
						}))
					}
				} catch (error) {
					console.error('Error fetching profile:', error)
					setError('Error al cargar el perfil')
				} finally {
					setLoading(false)
				}
			} else {
				setLoading(false)
			}
		})

		return () => unsubscribeAuth()
	}, [])

	const handleInputChange = (field: keyof CandidateProfile, value: any) => {
		setProfile(prev => ({ ...prev, [field]: value }))
	}

	const addExperience = () => {
		const newExperience: WorkExperience = {
			id: Date.now().toString(),
			company: '',
			position: '',
			startDate: '',
			endDate: '',
			current: false,
			description: '',
			achievements: [],
		}
		setProfile(prev => ({
			...prev,
			experience: [...prev.experience, newExperience]
		}))
	}

	const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
		setProfile(prev => ({
			...prev,
			experience: prev.experience.map(exp =>
				exp.id === id ? { ...exp, [field]: value } : exp
			)
		}))
	}

	const removeExperience = (id: string) => {
		setProfile(prev => ({
			...prev,
			experience: prev.experience.filter(exp => exp.id !== id)
		}))
	}

	const addEducation = () => {
		const newEducation: Education = {
			id: Date.now().toString(),
			institution: '',
			degree: '',
			field: '',
			startDate: '',
			endDate: '',
			current: false,
			gpa: '',
		}
		setProfile(prev => ({
			...prev,
			education: [...prev.education, newEducation]
		}))
	}

	const updateEducation = (id: string, field: keyof Education, value: any) => {
		setProfile(prev => ({
			...prev,
			education: prev.education.map(edu =>
				edu.id === id ? { ...edu, [field]: value } : edu
			)
		}))
	}

	const removeEducation = (id: string) => {
		setProfile(prev => ({
			...prev,
			education: prev.education.filter(edu => edu.id !== id)
		}))
	}

	const addSkill = () => {
		if (skillSearch.trim() && !profile.skills.includes(skillSearch.trim())) {
			setProfile(prev => ({
				...prev,
				skills: [...prev.skills, skillSearch.trim()]
			}))
			setSkillSearch('')
			setShowSuggestions(false)
		}
	}

	const removeSkill = (index: number) => {
		setProfile(prev => ({
			...prev,
			skills: prev.skills.filter((_, i) => i !== index)
		}))
	}

	const handleSave = async () => {
		if (!user) return

		setSaving(true)
		setError(null)
		setSuccess(false)

		try {
			const profileRef = doc(db, 'candidateProfiles', user.uid)
			const profileData = { ...profile, userId: user.uid }
			await setDoc(profileRef, profileData, { merge: true })
			setSuccess(true)
			setTimeout(() => setSuccess(false), 3000)
		} catch (error) {
			console.error('Error saving profile:', error)
			setError('Error al guardar el perfil')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<p className="ml-2 text-gray-600">Cargando perfil...</p>
			</div>
		)
	}

	return (
		<div className="max-w-4xl mx-auto space-y-4">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Mi Currículum</h1>
					<p className="text-gray-600 mt-1">Construye y gestiona tu perfil profesional</p>
				</div>
				<button
					onClick={handleSave}
					disabled={saving}
					className="px-5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
				>
					{saving ? 'Guardando...' : 'Guardar Cambios'}
				</button>
			</div>

			{/* Success/Error Messages */}
			{success && (
				<div className="p-4 bg-green-50 border border-green-200 rounded-md">
					<p className="text-green-600">¡Perfil guardado exitosamente!</p>
				</div>
			)}
			{error && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-md">
					<p className="text-red-600">{error}</p>
				</div>
			)}

			{/* Basic Information */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200">
				<div className="p-4">
					<button
						onClick={() => toggleSection('basicInfo')}
						className="flex items-center gap-2 hover:bg-gray-50 p-2 -m-2 rounded-md transition-colors"
					>
						<h2 className="text-lg font-semibold text-gray-900">Información Básica</h2>
						<svg
							className={`w-5 h-5 text-gray-500 transition-transform ${
								expandedSections.basicInfo ? 'rotate-180' : ''
							}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</button>
				</div>
				{expandedSections.basicInfo && (
					<div className="px-4 pb-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
						<input
							type="text"
							value={profile.firstName}
							onChange={(e) => handleInputChange('firstName', e.target.value)}
							className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
						<input
							type="text"
							value={profile.lastName}
							onChange={(e) => handleInputChange('lastName', e.target.value)}
							className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
						<input
							type="email"
							value={profile.email}
							disabled
							className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
						<input
							type="tel"
							value={profile.phone || ''}
							onChange={(e) => handleInputChange('phone', e.target.value)}
							className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
						<input
							type="text"
							value={profile.location || ''}
							onChange={(e) => handleInputChange('location', e.target.value)}
							placeholder="Ciudad, Estado, País"
							className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Salario Deseado (MXN)</label>
						<input
							type="number"
							value={profile.desiredSalary || ''}
							onChange={(e) => handleInputChange('desiredSalary', e.target.value ? parseInt(e.target.value) : undefined)}
							className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
				</div>
				<div className="mt-3">
					<label className="block text-sm font-medium text-gray-700 mb-1">Resumen Profesional</label>
					<textarea
						value={profile.summary || ''}
						onChange={(e) => handleInputChange('summary', e.target.value)}
						rows={4}
						placeholder="Breve resumen de tu experiencia profesional y objetivos de carrera..."
						className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>
					</div>
				)}
			</div>

			{/* Work Experience */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200">
				<div className="p-4 flex justify-between items-center">
					<button
						onClick={() => toggleSection('experience')}
						className="flex items-center gap-2 hover:bg-gray-50 p-2 -m-2 rounded-md transition-colors"
					>
						<h2 className="text-lg font-semibold text-gray-900">Experiencia Laboral</h2>
						<svg
							className={`w-5 h-5 text-gray-500 transition-transform ${
								expandedSections.experience ? 'rotate-180' : ''
							}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					<button
						onClick={addExperience}
						className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
					>
						Agregar Experiencia
					</button>
				</div>
				{expandedSections.experience && (
					<div className="px-4 pb-4">
				<div className="space-y-3">
					{profile.experience.map((exp) => (
						<div key={exp.id} className="border border-gray-200 rounded-lg p-3">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
									<input
										type="text"
										value={exp.company}
										onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
										className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Posición</label>
									<input
										type="text"
										value={exp.position}
										onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
										className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
									<input
										type="date"
										value={exp.startDate}
										onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
										className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin</label>
									<input
										type="date"
										value={exp.endDate || ''}
										onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
										disabled={exp.current}
										className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
									/>
								</div>
							</div>
							<div className="mt-3 flex items-center">
								<input
									type="checkbox"
									id={`current-${exp.id}`}
									checked={exp.current}
									onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<label htmlFor={`current-${exp.id}`} className="ml-2 text-sm text-gray-700">
									Trabajo actualmente aquí
								</label>
							</div>
							<div className="mt-3">
								<label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
								<textarea
									value={exp.description}
									onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
									rows={3}
									className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
							<div className="mt-3 flex justify-end">
								<button
									onClick={() => removeExperience(exp.id)}
									className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
								>
									Eliminar
								</button>
							</div>
						</div>
					))}
				</div>
					</div>
				)}
			</div>

			{/* Education */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200">
				<div className="p-4 flex justify-between items-center">
					<button
						onClick={() => toggleSection('education')}
						className="flex items-center gap-2 hover:bg-gray-50 p-2 -m-2 rounded-md transition-colors"
					>
						<h2 className="text-lg font-semibold text-gray-900">Educación</h2>
						<svg
							className={`w-5 h-5 text-gray-500 transition-transform ${
								expandedSections.education ? 'rotate-180' : ''
							}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					<button
						onClick={addEducation}
						className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
					>
						Agregar Educación
					</button>
				</div>
				{expandedSections.education && (
					<div className="px-4 pb-4">
				<div className="space-y-3">
					{profile.education.map((edu) => (
						<div key={edu.id} className="border border-gray-200 rounded-lg p-3">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Institución</label>
									<input
										type="text"
										value={edu.institution}
										onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
										className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
									<input
										type="text"
										value={edu.degree}
										onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
										className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Campo de Estudio</label>
									<input
										type="text"
										value={edu.field}
										onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
										className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Promedio (Opcional)</label>
									<input
										type="text"
										value={edu.gpa || ''}
										onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
										className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
									<input
										type="date"
										value={edu.startDate}
										onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
										className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin</label>
									<input
										type="date"
										value={edu.endDate || ''}
										onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
										disabled={edu.current}
										className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
									/>
								</div>
							</div>
							<div className="mt-3 flex items-center">
								<input
									type="checkbox"
									id={`current-edu-${edu.id}`}
									checked={edu.current}
									onChange={(e) => updateEducation(edu.id, 'current', e.target.checked)}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<label htmlFor={`current-edu-${edu.id}`} className="ml-2 text-sm text-gray-700">
									Estudiando actualmente
								</label>
							</div>
							<div className="mt-3 flex justify-end">
								<button
									onClick={() => removeEducation(edu.id)}
									className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
								>
									Eliminar
								</button>
							</div>
						</div>
					))}
				</div>
					</div>
				)}
			</div>

			{/* Skills */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200">
				<div className="p-4">
					<button
						onClick={() => toggleSection('skills')}
						className="flex items-center gap-2 hover:bg-gray-50 p-2 -m-2 rounded-md transition-colors"
					>
						<h2 className="text-lg font-semibold text-gray-900">Habilidades</h2>
						<svg
							className={`w-5 h-5 text-gray-500 transition-transform ${
								expandedSections.skills ? 'rotate-180' : ''
							}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</button>
				</div>
				{expandedSections.skills && (
					<div className="px-4 pb-4">

				{/* Skill Search Input */}
				<div className="relative mb-3 skill-search-container">
					<div className="flex gap-2">
						<div className="flex-1 relative">
							<input
								type="text"
								value={skillSearch}
								onChange={(e) => handleSkillSearch(e.target.value)}
								onFocus={() => setShowSuggestions(skillSuggestions.length > 0)}
								onKeyDown={handleKeyPress}
								placeholder="Buscar habilidades (ej., JavaScript, Python, React...)"
								className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>

							{/* Suggestions Dropdown */}
							{showSuggestions && skillSuggestions.length > 0 && (
								<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
									{skillSuggestions.map((skill, index) => (
										<button
											key={index}
											onClick={() => addSkillFromSuggestion(skill)}
											className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
										>
											<span className="text-sm text-gray-900">{skill}</span>
										</button>
									))}
								</div>
							)}
						</div>

						{/* Categories Dropdown Button */}
						<div className="relative">
							<button
								onClick={() => setShowCategories(!showCategories)}
								className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-1"
							>
								<span>Ver Categorías</span>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							{/* Categories Dropdown */}
							{showCategories && (
								<div className="absolute z-20 right-0 mt-1 w-80 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
									<div className="p-2">
										<h3 className="text-sm font-semibold text-gray-700 mb-2">Categorías de Habilidades</h3>
										{Object.entries(skillCategories).map(([category, skills]) => (
											<div key={category} className="mb-3">
												<h4 className="text-xs font-medium text-gray-600 mb-1">{category}</h4>
												<div className="flex flex-wrap gap-1">
													{skills.slice(0, 6).map((skill, index) => (
														<button
															key={index}
															onClick={() => addSkillFromCategory(skill)}
															disabled={profile.skills.includes(skill)}
															className={`px-2 py-1 text-xs rounded-full border transition-colors ${
																profile.skills.includes(skill)
																	? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
																	: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
															}`}
														>
															{skill}
														</button>
													))}
													{skills.length > 6 && (
														<span className="text-xs text-gray-400 px-2 py-1">
															+{skills.length - 6} más
														</span>
													)}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>

					<button
						onClick={addSkill}
							disabled={!skillSearch.trim()}
							className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
							Agregar
					</button>
					</div>
					{skillSearch.length > 0 && skillSuggestions.length === 0 && (
						<p className="mt-1 text-sm text-gray-500">
							No se encontraron sugerencias. Presiona "Agregar" para añadir "{skillSearch}" como habilidad personalizada.
						</p>
					)}
				</div>

				{/* Current Skills */}
				<div className="flex flex-wrap gap-2">
					{profile.skills.length === 0 ? (
						<p className="text-gray-500 text-sm">No hay habilidades agregadas. Busca y agrega tus habilidades arriba.</p>
					) : (
						profile.skills.map((skill, index) => (
						<span
							key={index}
							className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
						>
							{skill}
							<button
								onClick={() => removeSkill(index)}
								className="ml-2 text-blue-600 hover:text-blue-800"
							>
								×
							</button>
						</span>
						))
					)}
				</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default ResumePage
