'use client'

import React, { useState, useEffect } from 'react'
import { db, auth } from '../../../lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import LocationSelector from '../../../components/ui/LocationSelector'
import PlaceAutocomplete from '../../../components/ui/PlaceAutocomplete'
import { formatNumberWithCommas, parseFormattedNumber } from '../../../lib/utils'
import { EDUCATION_DEGREE_OPTIONS } from '../../../lib/constants'

interface CandidateProfile {
	userId: string
	email: string
	location?: string
	summary?: string
	experience: WorkExperience[]
	education: Education[]
	skills: string[]
	languages?: Record<string, string>
	desiredSalary?: number
	availability?: string
	willingToRelocate?: boolean
}

interface WorkExperience {
	id: string
	company: string
	position: string
	location?: string // Location from Google Maps
	locationPlaceId?: string // Google Place ID for verification
	locationAddress?: string // Full address from Google Places
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
		email: '',
		location: '',
		summary: '',
		experience: [],
		education: [],
		skills: [],
		languages: {},
		desiredSalary: undefined,
		availability: '',
		willingToRelocate: false,
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
	const [formattedSalary, setFormattedSalary] = useState('')
	const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
	const [userAccount, setUserAccount] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: ''
	})

	// Expandable sections state
	const [expandedSections, setExpandedSections] = useState({
		basicInfo: false,
		experience: false,
		education: false,
		skills: false
	})

	// Update formatted salary when profile changes
	useEffect(() => {
		if (profile.desiredSalary) {
			setFormattedSalary(formatNumberWithCommas(profile.desiredSalary))
		} else {
			setFormattedSalary('')
		}
	}, [profile.desiredSalary])

	// Fetch user account information
	const fetchUserAccount = async (userId: string) => {
		try {
			const accountRef = doc(db, 'userAccounts', userId)
			const accountSnap = await getDoc(accountRef)

			if (accountSnap.exists()) {
				const accountData = accountSnap.data()
				setUserAccount({
					firstName: accountData.firstName || '',
					lastName: accountData.lastName || '',
					email: accountData.email || '',
					phone: accountData.phone || ''
				})
			}
		} catch (error) {
			console.error('Error fetching user account:', error)
		}
	}

	// Skills organized by categories
	const skillCategories = {
		'👨‍🍳 Chef y Cocina - Tipos de Cocina': [
			'Cocina Mexicana', 'Cocina Italiana', 'Cocina Francesa', 'Cocina Española', 'Cocina Japonesa',
			'Cocina China', 'Cocina Tailandesa', 'Cocina India', 'Cocina Peruana', 'Cocina Argentina',
			'Cocina Mediterránea', 'Cocina Fusión', 'Cocina Molecular', 'Cocina Vegetariana', 'Cocina Vegana',
			'Cocina Internacional', 'Cocina Regional', 'Cocina Contemporánea', 'Alta Cocina', 'Cocina de Autor'
		],
		'🔪 Chef y Cocina - Especialidades': [
			'Parrillero', 'Asador', 'Saucier (Salsas)', 'Garde Manger (Entradas Frías)', 'Pastelero',
			'Repostero', 'Panadero', 'Chocolatero', 'Pizzero', 'Sushiman',
			'Carnicero', 'Pescadero', 'Sous Chef', 'Chef de Partie', 'Commis de Cocina',
			'Chef Ejecutivo', 'Chef de Banquetes', 'Chef de Catering', 'Chef Privado'
		],
		'🍳 Cocina - Técnicas y Habilidades': [
			'Corte de Vegetales', 'Fileteado de Pescado', 'Deshuese de Carnes', 'Emplatado', 'Presentación de Platos',
			'Cocción a la Parrilla', 'Cocción al Horno', 'Fritura', 'Cocción al Vapor', 'Sous Vide',
			'Preparación de Salsas', 'Preparación de Caldos', 'Preparación de Masas', 'Fermentación',
			'Manejo de Cuchillos', 'Control de Porciones', 'Control de Costos', 'HACCP', 'Manipulación de Alimentos',
			'Seguridad e Higiene', 'Almacenamiento de Alimentos', 'Inventario de Cocina'
		],
		'☕ Barista y Café': [
			'Preparación de Espresso', 'Latte Art', 'Cappuccino', 'Americano', 'Macchiato',
			'Café de Filtro', 'Prensa Francesa', 'Chemex', 'V60', 'Aeropress',
			'Cold Brew', 'Café Helado', 'Métodos de Extracción', 'Calibración de Molienda',
			'Máquina de Espresso', 'Molino de Café', 'Vaporización de Leche', 'Tostado de Café',
			'Catación de Café', 'Café Specialty', 'Certificación Barista', 'SCA Certification'
		],
		'🍹 Bartender y Mixología': [
			'Preparación de Cocteles', 'Mixología', 'Flair Bartending', 'Coctelería Clásica',
			'Coctelería Molecular', 'Margarita', 'Mojito', 'Martini', 'Manhattan', 'Negroni',
			'Old Fashioned', 'Caipirinha', 'Pisco Sour', 'Daiquiri', 'Cosmopolitan',
			'Destilados', 'Vinos', 'Cervezas Artesanales', 'Licores', 'Vermut',
			'Bar Setup', 'Inventario de Bar', 'Cost Control', 'Servicio de Vinos', 'Maridaje',
			'Certificación TIPS', 'Certificación WSET', 'Sommelier'
		],
		'🍽️ Mesero y Servicio de Restaurante': [
			'Servicio a la Mesa', 'Toma de Órdenes', 'Servicio Emplatado', 'Servicio Francés',
			'Servicio Inglés', 'Servicio Americano', 'Servicio de Buffet', 'Room Service',
			'Manejo de Bandeja', 'Apertura de Vinos', 'Servicio de Vinos', 'Flambeo',
			'Descripción de Menú', 'Sugerencias de Platillos', 'Upselling', 'Cross-selling',
			'Manejo de Quejas', 'POS (Punto de Venta)', 'Facturación', 'Cobro',
			'Atención al Cliente', 'Hospitalidad', 'Etiqueta de Servicio', 'Protocolo de Eventos'
		],
		'🏨 Hotel - Recepción y Front Desk': [
			'Check-in', 'Check-out', 'Reservaciones', 'Sistema PMS', 'Opera PMS',
			'Atención al Huésped', 'Resolución de Problemas', 'Facturación Hotelera',
			'Manejo de Efectivo', 'Tarjetas de Crédito', 'Night Audit', 'Concierge',
			'Información Turística', 'Reservas de Tours', 'Reservas de Restaurantes',
			'Manejo de Equipaje', 'Valet Parking', 'Bell Boy', 'Portero'
		],
		'🧹 Hotel - Housekeeping y Limpieza': [
			'Limpieza de Habitaciones', 'Tendido de Camas', 'Cambio de Sábanas', 'Limpieza de Baños',
			'Reabastecimiento de Amenidades', 'Room Attendant', 'Camarera de Piso', 'Supervisora de Pisos',
			'Limpieza Profunda', 'Limpieza de Áreas Públicas', 'Lavandería', 'Planchado',
			'Doblado de Toallas', 'Manejo de Químicos de Limpieza', 'Inventario de Amenidades',
			'Estándares de Limpieza', 'Turn Down Service', 'Lost & Found'
		],
		'🍴 Restaurante - Gestión y Administración': [
			'Gestión de Restaurante', 'Gerencia de Alimentos y Bebidas', 'Control de Costos',
			'Inventario de Alimentos', 'Compras', 'Negociación con Proveedores', 'Food Cost',
			'Beverage Cost', 'Planificación de Menú', 'Ingeniería de Menú', 'Pricing',
			'Supervisión de Personal', 'Capacitación de Staff', 'Horarios de Personal',
			'Nómina', 'HACCP', 'Cumplimiento Sanitario', 'Permisos y Licencias'
		],
		'🎉 Banquetes y Eventos': [
			'Servicio de Banquetes', 'Montaje de Eventos', 'Catering', 'Buffet',
			'Servicio de Bodas', 'Eventos Corporativos', 'Cocteles de Pie', 'Coffee Break',
			'Coordinación de Eventos', 'Logística de Eventos', 'Capitán de Meseros',
			'Servicio Francés (Banquetes)', 'Russian Service', 'Family Style Service'
		],
		'🥐 Panadería y Repostería': [
			'Panadería', 'Repostería', 'Pastelería', 'Panadería Artesanal', 'Masa Madre',
			'Pan Francés', 'Pan Dulce Mexicano', 'Bollería', 'Croissants', 'Danishes',
			'Pasteles', 'Tartas', 'Cupcakes', 'Macarons', 'Galletas', 'Brownies',
			'Decoración de Pasteles', 'Fondant', 'Buttercream', 'Ganache', 'Royal Icing',
			'Chocolatería', 'Bombones', 'Trufas', 'Temperado de Chocolate'
		],
		'☕ Cafetería y Coffee Shop': [
			'Operación de Cafetería', 'Atención en Mostrador', 'Caja Registradora', 'POS',
			'Preparación de Bebidas', 'Bebidas Calientes', 'Bebidas Frías', 'Smoothies',
			'Frappes', 'Tés', 'Infusiones', 'Preparación de Alimentos Ligeros',
			'Sandwiches', 'Ensaladas', 'Wraps', 'Bagels', 'Muffins', 'Scones',
			'Display de Productos', 'Visual Merchandising', 'Inventario de Cafetería'
		],
		'🍕 Comida Rápida y Fast Food': [
			'Preparación Rápida de Alimentos', 'Línea de Ensamblaje', 'Freidora',
			'Parrilla', 'Plancha', 'Preparación de Hamburguesas', 'Pizzas', 'Hot Dogs',
			'Tacos', 'Tortas', 'Alitas', 'Papas Fritas', 'Drive Thru', 'Toma de Órdenes',
			'Empaque de Alimentos', 'Delivery', 'Apps de Delivery', 'Uber Eats', 'Rappi', 'DiDi Food'
		],
		'🏨 Hotel - Otros Departamentos': [
			'Spa', 'Masajista', 'Terapias', 'Gimnasio', 'Instructor de Fitness',
			'Animación Turística', 'Recreación', 'Kids Club', 'Actividades',
			'Seguridad Hotelera', 'Mantenimiento Hotelero', 'Jardinería',
			'Piscina', 'Salvavidas', 'Valet Parking', 'Room Service'
		],
		'📋 Certificaciones y Seguridad Alimentaria': [
			'Manejo Higiénico de Alimentos', 'HACCP', 'Distintivo H', 'ServSafe',
			'Food Handler Certificate', 'TIPS Certification', 'Alcohol Service',
			'Primeros Auxilios', 'RCP', 'Prevención de Incendios',
			'Seguridad en el Trabajo', 'Prevención de Riesgos Laborales'
		],
		'💻 Sistemas y Software para Hospitalidad': [
			'POS (Punto de Venta)', 'Micros', 'Aloha', 'Toast', 'Square',
			'Opera PMS', 'Sistemas de Reservaciones', 'OpenTable', 'Resy',
			'Gestión de Inventarios', 'Control de Costos', 'Excel',
			'Uber Eats Manager', 'Rappi Manager', 'DiDi Food Manager'
		],
		'🌍 Idiomas': [
			'Español', 'Inglés', 'Francés', 'Alemán', 'Portugués', 'Italiano',
			'Chino', 'Japonés', 'Coreano', 'Árabe', 'Ruso'
		],
		'✨ Habilidades Blandas para Hospitalidad': [
			'Atención al Cliente', 'Servicio al Cliente', 'Hospitalidad', 'Trabajo en Equipo',
			'Comunicación Efectiva', 'Resolución de Conflictos', 'Manejo de Quejas',
			'Trabajo Bajo Presión', 'Multitasking', 'Organización', 'Puntualidad',
			'Responsabilidad', 'Proactividad', 'Actitud Positiva', 'Empatía',
			'Adaptabilidad', 'Flexibilidad de Horario', 'Disponibilidad Fines de Semana',
			'Presentación Personal', 'Higiene Personal', 'Ética Profesional'
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
					// Fetch user account information
					await fetchUserAccount(currentUser.uid)

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

	const handleSalaryChange = (value: string) => {
		// Update the formatted display
		setFormattedSalary(value)

		// Parse and update the actual numeric value
		const numericValue = parseFormattedNumber(value)
		handleInputChange('desiredSalary', numericValue || undefined)
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

	const toggleCategoryExpansion = (category: string) => {
		setExpandedCategories(prev => ({
			...prev,
			[category]: !prev[category]
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
						<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
							<p className="text-sm text-blue-700">
								<strong>Nota:</strong> Para cambiar tu nombre, apellido, correo electrónico o teléfono,
								ve a la página de <a href="/candidate/account" className="text-blue-600 hover:text-blue-800 underline">Configuración de Cuenta</a>.
							</p>
						</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
						<input
							type="text"
							value={userAccount.firstName}
							disabled
							className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
						<input
							type="text"
							value={userAccount.lastName}
							disabled
							className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
						<input
							type="email"
							value={userAccount.email}
							disabled
							className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
						<input
							type="tel"
							value={userAccount.phone || ''}
							disabled
							className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
						<LocationSelector
							value={profile.location || ''}
							onChange={(location) => {
								if (location) {
									const locationString = location.city + (location.state ? `, ${location.state}` : '')
									handleInputChange('location', locationString)
								} else {
									handleInputChange('location', '')
								}
							}}
							placeholder="Selecciona tu ciudad"
							className="w-full"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Salario Deseado (MXN)</label>
						<input
							type="text"
							value={formattedSalary}
							onChange={(e) => handleSalaryChange(e.target.value)}
							placeholder="Ej: 25,000"
							className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div className="md:col-span-2">
						<div className="flex items-center">
							<input
								type="checkbox"
								id="willingToRelocate"
								checked={profile.willingToRelocate || false}
								onChange={(e) => handleInputChange('willingToRelocate', e.target.checked)}
								className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<label htmlFor="willingToRelocate" className="ml-2 text-sm text-gray-700">
								Dispuesto a reubicación
							</label>
						</div>
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
							{/* First Row: Empresa and Posición */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
									<input
										type="text"
										value={exp.company}
										onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
										placeholder="Ej: Starbucks, Hotel Marriott, etc."
										className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Posición</label>
									<input
										type="text"
										value={exp.position}
										onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
										placeholder="Ej: Mesero, Chef, Recepcionista, etc."
										className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
							</div>

							{/* Second Row: Ubicación en Google Maps, Fecha de Inicio, Fecha de Fin */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Ubicación en Google Maps
										<span className="text-xs text-gray-500 ml-1">(Opcional)</span>
									</label>
									<PlaceAutocomplete
										value={exp.location || ''}
										onChange={(place) => {
											// Update location with full details
											const displayValue = place.address
												? `${place.name} - ${place.address}`
												: place.name
											updateExperience(exp.id, 'location', displayValue)
											// Store place ID and address separately
											if (place.placeId) {
												updateExperience(exp.id, 'locationPlaceId', place.placeId)
											}
											if (place.address) {
												updateExperience(exp.id, 'locationAddress', place.address)
											}
										}}
										onManualChange={(value) => {
											// Allow manual entry as fallback
											updateExperience(exp.id, 'location', value)
										}}
										placeholder="Buscar ubicación exacta"
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
									<label className="block text-sm font-medium text-gray-700 mb-1">Nivel Educativo</label>
									<select
										value={edu.degree}
										onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
										className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									>
										<option value="">Selecciona un nivel</option>
										{EDUCATION_DEGREE_OPTIONS.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
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
													{(expandedCategories[category] ? skills : skills.slice(0, 6)).map((skill, index) => (
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
														<button
															onClick={() => toggleCategoryExpansion(category)}
															className="px-2 py-1 text-xs rounded-full border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
														>
															{expandedCategories[category] ? 'Ver menos' : `+${skills.length - 6} más`}
														</button>
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
