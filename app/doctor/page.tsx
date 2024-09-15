import * as React from "react"
import Image from "next/image"
 
import { ScrollArea } from "@/components/ui/scroll-area"

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`
)

export default async function () {
  return (
    <>
  <meta charSet="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Document</title>
  <link rel="stylesheet" href="styles.css" />
  <div className="main-container">
    <div className="heading flex" id="name-heading" style={{ fontWeight: 900 }}>
      Welcome back Dr.{"{"}name{"}"}!
    </div>
    <div className="flex" style={{ height: "75vh" }}>
      <div className="box-section fifty">
        <h1>Patients</h1>
        <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
  Jokester began sneaking into the castle in the middle of the night and leaving
  jokes all over the place: under the king's pillow, in his soup, even in the
  royal toilet. The king was furious, but he couldn't seem to stop Jokester. And
  then, one day, the people of the kingdom discovered that the jokes left by
  Jokester were so funny that they couldn't help but laugh. And once they
  started laughing, they couldn't stop.
    </ScrollArea>
        
      </div>
      <div className="flex column fifty">
        <div className="box-section flex-grow" style={{ maxHeight: "100%" }}>
          <h1>Upcoming Appointments</h1>
        </div>
        <div className="box-section flex-grow">
          <h1>Urgent Medical</h1>
        </div>
      </div>
    </div>
  </div>
</>

  )
}
