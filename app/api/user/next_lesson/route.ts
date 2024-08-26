export async function GET() {
  const data = {
    lesson_id: 'A1.1.1',
    title: 'Clase 1: Introducciones',
    lesson_progress: 80,
    total_lessons: 20
  }
  return Response.json({ data })
}
