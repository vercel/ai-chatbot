export default async function () {
    return (
        <>
  <meta charSet="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Patient Information</title>
  <link rel="stylesheet" href="styles.css" />
  <div className="main-container flex column">
    <div className="flex" style={{ height: "30vh" }}>
        
      <div
        className="flex-grow flex column"
      >
        <h3 style={{paddingLeft: 20}}>Patient Name</h3>
        <h1 style={{ fontSize: 40, paddingLeft: 20 }}>Clark Kent</h1>
        <div className="box-section flex-grow">
          Description of patient
        </div>
      </div>
    </div>
    <div className="flex" style={{ height: "60vh"}}>
      <div className="box-section" style={{ flexBasis: "55%" }}>
        ehr
      </div>
      <div className="flex column flex-grow">
        <div className="box-section flex-grow">
          <h1>Health Trends</h1>
        </div>
        <div className="box-section flex-grow">
          <h1>Symptom Logs</h1>
        </div>
      </div>
    </div>
  </div>
</>

    )
}