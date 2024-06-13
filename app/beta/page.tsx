import { Footer } from '@/components/footer';

export default async function RAGPage() {

  return (
    <main className="flex flex-col p-4">
      <h1 className="text-xl sm:text-3xl text-center mt-3">Sign up for the Huddlechat Beta Program</h1>
        <p className="text-sm sm:text-lg mt-4 text-center">We're excited to have you join us! Please fill out the form below to get started.</p>
        <div className="mt-4">
          <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSdylidr2omc6dBD0Xi86xTQlB8pYRZ5ckwRv54iwSGueAgI2A/viewform?usp=sf_link" 
          width="100%" height="600" frameBorder="0" marginHeight={0} marginWidth={0}>Loading…</iframe>
        </div>
    </main>
  )
}