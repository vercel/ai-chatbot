
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

import { ProfileForm } from './components/form'
import { Widget } from './components/TerraWidget'

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
            <Widget />
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
            <Link href="/chat">
              <h1>Chat with Teddy!</h1>
              <h3>Feeling under the weather? I can help!</h3>
            </Link>
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
