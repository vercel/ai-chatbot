import { motion } from 'framer-motion';
import Image from 'next/image';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex flex-col md:flex-row items-center gap-8 p-6 rounded-xl">
        {/* Left Section: Image */}
        <div className="shrink-0">
          <Image
            src="/images/lemme.png" // Replace with your actual image path
            alt="Lemme Robot"
            width={130}
            height={130}
          />
        </div>

        {/* Right Section: Text */}
        <div className="flex flex-col gap-4 text-left max-w-lg">
          <h1 className="font-bold text-xl p-1 rounded-md">Welcome to Lemme</h1>
          <p>
            I&apos;m your AI assistant at HumanGood, here to help you navigate
            our organization. Need info on company policies, IT support, HR
            guidelines, or departmental procedures?
          </p>
          <p>
            Just ask! I&apos;ll provide quick, accurate answers from our
            employee handbook and internal processes.
          </p>
          <p>
            While I can&apos;t access personal data like paystubs, I&apos;m here
            to make your workday easier with instant HumanGood knowledge.
          </p>
          <p>How can I assist you today?</p>
        </div>
      </div>
    </motion.div>
  );
};
