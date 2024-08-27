function check_required_fields({
  fields,
  reqBody
}: {
  fields: string[]
  reqBody: any
}) {
  // 'fields' is an array of required field names
  // 'reqBody' is the JSON object parsed from the request

  const missingFields = fields.filter(field => {
    const value = reqBody[field]
    return value === undefined || value === null || value === '' // Check for missing or empty fields
  })

  if (missingFields.length === 0) {
    return true // All required fields are present and non-empty
  } else {
    return missingFields // Return the list of missing or empty fields
  }
}

export default check_required_fields
