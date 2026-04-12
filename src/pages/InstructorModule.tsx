import { useState } from 'react'
import { useParams } from 'react-router-dom'
import type { VenueSpace, Location } from '../lib/types'
import NearbyScreen from '../components/instructor/NearbyScreen'
import VenueCreateWizard from '../components/instructor/VenueCreateWizard'
import VenueSpacesScreen from '../components/instructor/VenueSpacesScreen'
import SpaceWizard from '../components/instructor/SpaceWizard'

type LocationRow = Pick<Location, 'id' | 'name' | 'lat' | 'lon' | 'logo_url' | 'address' | 'venue_code' | 'venue_type'>

type Screen =
  | { type: 'nearby' }
  | { type: 'create-venue'; lat: number; lon: number }
  | { type: 'venue-spaces'; location: LocationRow }
  | { type: 'space-wizard'; location: LocationRow; existing?: VenueSpace; presetType?: 'inde' | 'ude' }

export default function InstructorModule() {
  const { locationId } = useParams()
  const [screen, setScreen] = useState<Screen>({ type: 'nearby' })

  // If direct link with locationId, we'd need to fetch the location
  // For now, start at nearby screen

  if (screen.type === 'nearby') {
    return (
      <NearbyScreen
        onSelectVenue={(loc) => setScreen({ type: 'venue-spaces', location: loc })}
        onCreateVenue={(lat, lon) => setScreen({ type: 'create-venue', lat, lon })}
      />
    )
  }

  if (screen.type === 'create-venue') {
    return (
      <VenueCreateWizard
        initialLat={screen.lat}
        initialLon={screen.lon}
        onBack={() => setScreen({ type: 'nearby' })}
        onCreated={(id) => {
          setScreen({
            type: 'venue-spaces',
            location: { id, name: 'Nyt venue', lat: screen.lat, lon: screen.lon } as LocationRow,
          })
        }}
      />
    )
  }

  if (screen.type === 'venue-spaces') {
    const loc = screen.location
    return (
      <VenueSpacesScreen
        locationId={loc.id}
        venueName={loc.name}
        venueLat={loc.lat}
        venueLon={loc.lon}
        onBack={() => setScreen({ type: 'nearby' })}
        onAddSpace={(presetType) => setScreen({ type: 'space-wizard', location: loc, presetType })}
        onEditSpace={(space) => setScreen({ type: 'space-wizard', location: loc, existing: space })}
      />
    )
  }

  if (screen.type === 'space-wizard') {
    const loc = screen.location
    return (
      <SpaceWizard
        locationId={loc.id}
        venueLat={loc.lat}
        venueLon={loc.lon}
        existing={screen.existing}
        onBack={() => setScreen({ type: 'venue-spaces', location: loc })}
        onSaved={() => setScreen({ type: 'venue-spaces', location: loc })}
      />
    )
  }

  return null
}
