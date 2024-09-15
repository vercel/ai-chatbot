
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
