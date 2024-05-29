'use client'

import clsx from "clsx";
import { ComponentProps, ReactNode } from "react";
// import { auth, signIn } from "@/auth";
// import { SignInIcon } from "@/icons";
import { MarketingLayout } from "@/layouts/Marketing";
import { Button, LinkButton } from "@/primitives/Button";
import { Container } from "@/primitives/Container";
import styles from "./page.module.css";
import { PinRightIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";

interface FeatureProps extends Omit<ComponentProps<"div">, "title"> {
  description: ReactNode;
  title: ReactNode;
}

function Feature({ title, description, className, ...props }: FeatureProps) {
  return (
    <div className={clsx(className, styles.featuresFeature)} {...props}>
      <h4 className={styles.featuresFeatureTitle}>{title}</h4>
      <p className={styles.featuresFeatureDescription}>{description}</p>
    </div>
  );
}

export default async function Index() {
//   const session = await auth();

  // If logged in, go to dashboard
  const router = useRouter();

  return (
    <MarketingLayout>
      <Container className={styles.section}>
        <div className={styles.heroInfo}>
          <h1 className={styles.heroTitle}>
          SuperBrain® powers your organisation.&nbsp;app
          </h1>
          <p className={styles.heroLead}>
            UAccelerate decision making speed and quality at work.  
            Network Inc, use SuperBrain to power their data-drive business intelligence.&nbsp;
          </p>
        </div>
        <div className={styles.heroActions}>
          <form
            // action={async () => {
            //   "use server";
            //   await signIn();
            // }}
          >
            <Button icon={<PinRightIcon/>} onClick={() => router.push('/login')}>Sign in</Button>
          </form>
        </div>
      </Container>
      <Container className={styles.section}>
        <h2 className={styles.sectionTitle}>Access. Accelerate.</h2>
        <div className={styles.featuresGrid}>
          <Feature
            description={
              <>
                Interact with your organisational data at speed with our chatbot.
                Powered by intelligent language models, we deliver response at speed.
              </>
            }
            title="Interact"
          />
          <Feature
            description={
              <>
                Best practices followed, using a mixture of SSR and custom API
                endpoints. Modify documents from both client and server.
              </>
            }
            title="Next.js"
          />
          <Feature
            description={
              <>
                Adjust our reusable interface & design system to fit your needs.
              </>
            }
            title="User Interface"
          />
          <Feature
            description={
              <>
                All custom client and server functions are fully typed, and easy
                to update.
              </>
            }
            title="TypeScript"
          />
          <Feature
            description={
              <>
                Complete authentication, compatible with any NextAuth provider,
                including GitHub, Google, Auth0, and many more.
              </>
            }
            title="NextAuth.js"
          />
          <Feature
            description={
              <>
                See data update live using the SWR (state-while-revalidate)
                library.
              </>
            }
            title="SWR"
          />
        </div>
      </Container>
    </MarketingLayout>
  );
}
