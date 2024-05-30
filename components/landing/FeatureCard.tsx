interface FeatureCardProps {
  title: string
  description: string
}

export const FeatureCard = ({ title, description }: FeatureCardProps) => {
  return (
    <div className="feature-card border-[#ececee] dark:border-[#333338] border-[1px] rounded-[0.7rem] p-5">
      <div className="feature-card-title mb-2 font-bold">{title}</div>
      <div className="feature-card-description text-sm">{description}</div>
    </div>
  )
}
