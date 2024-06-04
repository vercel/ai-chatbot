import { Hero } from '@/components/rag-hero';
import { Footer } from '@/components/footer';

export default async function RAGPage() {

  return (
    <main className="flex flex-col p-4">
      <Hero/>
    <Footer/>
    </main>
  )
}
