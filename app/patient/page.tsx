'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PatientForm } from './components/form'

export default function PatientPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const authStatus = searchParams.get('auth')
    if (authStatus === 'success') {
      console.log('Device connected successfully')
      // Handle successful connection (e.g., show a success message, update user state)
    } else if (authStatus === 'failure') {
      console.log('Device connection failed')
      // Handle failed connection (e.g., show an error message)
    }
  }, [searchParams])

  return (
    <>
  <div className="main-container flex column" style={{}}>
    <div className="heading flex" id="name-heading" style={{ fontWeight: 900 }}>
      Welcome back,.
    </div>
    <div className="flex">
      <div className="flex column" style={{ flexBasis: "60%" }}>
        <div className="box-section" id="graph" style={{ height: "40vh" }}>
          <h1>Your Sleep Trends</h1>
        </div>
        <div className="flex">
          <div className="box-section fifty" id="upcoming">
            <h2>Upcoming Appointments</h2>
          </div>
          <div className="box-section fifty" id="alerts">
            <h2>Medical Alerts</h2>
          </div>
        </div>
      </div>
      <div className="flex column flex-grow">
        <div
          className="box-section flex clickable"
          style={{ minHeight: "30vh" }}
        >
          <div style={{ alignContent: "center" }}>
            <h1>Chat with Teddy!</h1>
            <h3>Feeling under the weather? I can help!</h3>
          </div>
          <img
            src="teddy.png"
            alt="A cute teddy bear."
            style={{
              maxWidth: "50%",
              maxHeight: "100%",
              flexBasis: "35%",
              alignSelf: "center"
            }}
          />
        </div>
        <div className="box-section flex-grow">
          <h1>Health Tips</h1>
          <div id="health-tips" />
        </div>
      </div>
    </div>
  </div>
</>

  )
}
