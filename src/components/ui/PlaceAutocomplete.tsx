'use client'

import { useEffect, useRef, useState } from 'react'

// Extend Window interface to include google
declare global {
	interface Window {
		google: typeof google
	}
}

interface PlaceAutocompleteProps {
	value: string
	onChange: (place: { name: string; address?: string; placeId?: string }) => void
	onManualChange?: (value: string) => void
	placeholder?: string
	className?: string
}

const PlaceAutocomplete = ({ value, onChange, onManualChange, placeholder, className }: PlaceAutocompleteProps) => {
	const inputRef = useRef<HTMLInputElement>(null)
	const [inputValue, setInputValue] = useState(value)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

	useEffect(() => {
		setInputValue(value)
	}, [value])

	useEffect(() => {
		// Check if Google Maps API key is available
		const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

		if (!apiKey) {
			setError('Google Maps API key no configurada')
			return
		}

		// Check if the script is already loaded or loading
		const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)

		if (window.google && window.google.maps && window.google.maps.places) {
			// Google Maps is already loaded, just initialize
			initializeAutocomplete()
			return
		}

		if (existingScript) {
			// Script is loading, wait for it
			const handleLoad = () => {
				setIsLoading(false)
				initializeAutocomplete()
			}
			existingScript.addEventListener('load', handleLoad)
			setIsLoading(true)

			return () => {
				existingScript.removeEventListener('load', handleLoad)
				if (autocompleteRef.current) {
					google.maps.event.clearInstanceListeners(autocompleteRef.current)
				}
			}
		}

		// Load Google Maps script for the first time
		const script = document.createElement('script')
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es`
		script.async = true
		script.defer = true
		script.id = 'google-maps-script'

		script.onload = () => {
			setIsLoading(false)
			initializeAutocomplete()
		}

		script.onerror = () => {
			setError('Error al cargar Google Maps API')
			setIsLoading(false)
		}

		setIsLoading(true)
		document.head.appendChild(script)

		return () => {
			// Cleanup: remove autocomplete listener
			if (autocompleteRef.current) {
				google.maps.event.clearInstanceListeners(autocompleteRef.current)
			}
		}
	}, [])

	const initializeAutocomplete = () => {
		if (!inputRef.current) return

		// Check if Google Maps is fully loaded
		if (!window.google || !window.google.maps || !window.google.maps.places) {
			console.error('Google Maps not fully loaded yet')
			return
		}

		// Clear existing autocomplete if it exists
		if (autocompleteRef.current) {
			google.maps.event.clearInstanceListeners(autocompleteRef.current)
			autocompleteRef.current = null
		}

		try {
			// Create autocomplete instance
			const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
				types: ['establishment'], // Only businesses/establishments
				fields: ['name', 'formatted_address', 'place_id', 'geometry', 'address_components'],
				componentRestrictions: { country: ['mx', 'us', 'co', 'ar', 'pe', 'cl', 'br'] } // Latin America + US
			})

			autocompleteRef.current = autocomplete

			// Listen for place selection
			autocomplete.addListener('place_changed', () => {
				const place = autocomplete.getPlace()

				if (!place || !place.name) {
					setError('No se pudo obtener información del lugar')
					return
				}

				// Format the display value
				const displayValue = place.formatted_address
					? `${place.name} - ${place.formatted_address}`
					: place.name

				setInputValue(displayValue)
				setError(null)

				// Call the onChange callback with place data
				onChange({
					name: place.name,
					address: place.formatted_address,
					placeId: place.place_id
				})
			})

			setError(null)
		} catch (err) {
			console.error('Error initializing autocomplete:', err)
			setError('Error al inicializar autocompletado')
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
		setInputValue(newValue)

		// Allow manual entry as fallback
		if (onManualChange) {
			onManualChange(newValue)
		}
	}

	const handleBlur = () => {
		// If user typed something but didn't select from autocomplete,
		// treat it as manual entry
		if (inputValue && onManualChange) {
			onManualChange(inputValue)
		}
	}

	if (error && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
		// Fallback to regular input if API key is not configured
		return (
			<div className="w-full">
				<input
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					placeholder={placeholder || "Nombre de la empresa"}
					className={className || "w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
				/>
				<p className="text-xs text-yellow-600 mt-1">
					💡 Configurando búsqueda de negocios...
				</p>
			</div>
		)
	}

	return (
		<div className="w-full">
			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onBlur={handleBlur}
					placeholder={placeholder || "Buscar negocio (ej: Starbucks Universidad)..."}
					className={className || "w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
					disabled={isLoading}
				/>
				{isLoading && (
					<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
					</div>
				)}
			</div>
			{error && (
				<p className="text-xs text-red-600 mt-1">{error}</p>
			)}
			{!error && !isLoading && (
				<p className="text-xs text-gray-500 mt-1">
					💡 Escribe para buscar negocios en tu área o ingresa manualmente
				</p>
			)}
		</div>
	)
}

export default PlaceAutocomplete

