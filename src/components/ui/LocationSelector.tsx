'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MEXICAN_CITIES } from '../../lib/constants'

interface LocationData {
  city: string
  state: string
  country: string
  standardized: string
  tier: 'tier-1' | 'tier-2' | 'tier-3' | 'other'
}

interface LocationSelectorProps {
  value?: string
  onChange: (location: LocationData | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  value = '',
  onChange,
  placeholder = 'Selecciona tu ciudad',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCities, setFilteredCities] = useState<LocationData[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Flatten all cities into a single array with metadata
  const allCities: LocationData[] = [
    ...MEXICAN_CITIES['tier-1'].map(city => ({
      city: city.label.split(',')[0],
      state: city.label.split(',')[1]?.trim() || '',
      country: 'México',
      standardized: city.value,
      tier: 'tier-1' as const
    })),
    ...MEXICAN_CITIES['tier-2'].map(city => ({
      city: city.label.split(',')[0],
      state: city.label.split(',')[1]?.trim() || '',
      country: 'México',
      standardized: city.value,
      tier: 'tier-2' as const
    })),
    ...MEXICAN_CITIES['tier-3'].map(city => ({
      city: city.label.split(',')[0],
      state: city.label.split(',')[1]?.trim() || '',
      country: 'México',
      standardized: city.value,
      tier: 'tier-3' as const
    }))
  ]

  // Filter cities based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCities(allCities)
    } else {
      const filtered = allCities.filter(city =>
        city.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.standardized.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCities(filtered)
    }
  }, [searchTerm])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    setIsOpen(true)

    // If user clears the input, clear selection
    if (term === '') {
      setSelectedLocation(null)
      onChange(null)
    }
  }

  // Handle city selection
  const handleCitySelect = (city: LocationData) => {
    setSelectedLocation(city)
    setSearchTerm(city.city + (city.state ? `, ${city.state}` : ''))
    setIsOpen(false)
    onChange(city)
  }

  // Handle "Other" option
  const handleOtherSelect = () => {
    const otherLocation: LocationData = {
      city: searchTerm,
      state: '',
      country: 'México',
      standardized: 'other',
      tier: 'other'
    }
    setSelectedLocation(otherLocation)
    setIsOpen(false)
    onChange(otherLocation)
  }

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true)
    if (searchTerm === '' && selectedLocation) {
      setSearchTerm(selectedLocation.city + (selectedLocation.state ? `, ${selectedLocation.state}` : ''))
    }
  }

  // Handle input blur
  const handleBlur = () => {
    // Delay closing to allow for clicks on dropdown items
    setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Initialize with existing value
  useEffect(() => {
    if (value && !selectedLocation) {
      const existingCity = allCities.find(city =>
        city.standardized === value ||
        city.city === value ||
        `${city.city}, ${city.state}` === value
      )
      if (existingCity) {
        setSelectedLocation(existingCity)
        setSearchTerm(existingCity.city + (existingCity.state ? `, ${existingCity.state}` : ''))
      } else if (value) {
        // Handle "other" locations
        const otherLocation: LocationData = {
          city: value,
          state: '',
          country: 'México',
          standardized: 'other',
          tier: 'other'
        }
        setSelectedLocation(otherLocation)
        setSearchTerm(value)
      }
    }
  }, [value])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredCities.length > 0 ? (
            <>
              {filteredCities.map((city, index) => (
                <div
                  key={`${city.standardized}-${index}`}
                  onClick={() => handleCitySelect(city)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div>
                    <div className="font-medium text-gray-900">{city.city}</div>
                    {city.state && (
                      <div className="text-sm text-gray-500">{city.state}</div>
                    )}
                  </div>
                </div>
              ))}

              {/* Other option */}
              {searchTerm.trim() !== '' && (
                <div
                  onClick={handleOtherSelect}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-t border-gray-200 bg-gray-50"
                >
                  <div className="text-sm text-gray-600">
                    <strong>Otro:</strong> {searchTerm}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="px-3 py-2 text-gray-500 text-sm">
              No se encontraron ciudades
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LocationSelector
