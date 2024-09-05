/**
 * Checks that all the fields the API endpoint expects are actually present.
 * Will return false if all are present.
 * Use it as:
 * ```
 * const res = await request.json()
 * const missing_fields = check_missing_fields({
 *   fields: ['your', 'expected', 'fields']
 *   reqBody: res
 * })
 * if (missing_fields) { return Response.json({ missing_fields }) }
 * ```
 * @param {Object} params - The parameters object.
 * @param {string[]} params.fields - The array of required field names.
 * @param {any} params.reqBody - The JSON object parsed from the request.
 * @returns {false|string[]} - Returns false if no fields are missing, otherwise returns an array of missing field names.
 */
function check_missing_fields({
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
    return false // All required fields are present and non-empty
  } else {
    return missingFields // Return the list of missing or empty fields
  }
}

export default check_missing_fields
