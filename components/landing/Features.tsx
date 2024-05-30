import { FeatureCard } from './FeatureCard'

export const Features = () => {
  const cards = [
    {
      title: 'Interact',
      description:
        'Interact with your organisational data at speed with our chatbot. Powered by intelligent language models, we deliver response at speed.'
    },
    {
      title: 'Vision',
      description:
        'Share a picture of your doc and our models are smart enough to understand and relate to your requirements. It’s smart, accurate and powerful.'
    },
    {
      title: 'Context',
      description:
        'Powered by the data connections in your organisation, our chatbot has secure access to your organisational data with access layers.'
    },
    {
      title: 'Reports',
      description:
        'Generate on-demand reports, compare data, analytics and cross monitor data for better decision making and to improve clarity in operations.'
    },
    {
      title: 'Secure',
      description:
        'Our systems are secured and monitored heavily with industry standard security measures. We operate at high alert to ensure security.'
    },
    {
      title: 'Evolution',
      description:
        'Our continuous improvement environment will provide consistent features that will match to futuristic features launching across the world in AI.'
    }
  ]

  return (
    <div className="features-section mb-24 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Access. Accelerate.</h2>
      <div className="grid grid-cols-3 gap-7">
        {cards.map((item, index) => (
          <FeatureCard
            key={index}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </div>
  )
}
