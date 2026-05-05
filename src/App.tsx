import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import IntroAnimation from './components/IntroAnimation'
import VenueList from './pages/VenueList'
import VenuePortal from './pages/VenuePortal'
import InstructorModule from './pages/InstructorModule'
import ClientVenuePortal from './pages/ClientVenuePortal'
import PublicLocations from './pages/PublicLocations'

export default function App() {
  const [introSeen, setIntroSeen] = useState(() => {
    return sessionStorage.getItem('venue_intro_seen') === '1'
  })

  const skipIntro = new URLSearchParams(window.location.search).has('skip_intro')

  function handleIntroDone() {
    sessionStorage.setItem('venue_intro_seen', '1')
    setIntroSeen(true)
  }

  return (
    <BrowserRouter>
      {!introSeen && !skipIntro && <IntroAnimation onDone={handleIntroDone} />}
      <Routes>
        <Route path="/" element={<VenueList />} />
        <Route path="/v/:code" element={<VenuePortal />} />
        <Route path="/c/:code" element={<ClientVenuePortal />} />
        <Route path="/i" element={<InstructorModule />} />
        <Route path="/i/:locationId" element={<InstructorModule />} />
        <Route path="/locations" element={<PublicLocations />} />
      </Routes>
    </BrowserRouter>
  )
}
