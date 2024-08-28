function create_response({ data, status }: { data: any; status: number }) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export default create_response
