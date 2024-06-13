"use client";
import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

import AnimatedGradientText from '@/components/magicui/animated-gradient-text'
import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/magicui/border-beam";
import { motion, useInView } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useRef } from "react";

export function LandingPage() {
  const fadeInRef = useRef(null);
  const fadeInInView = useInView(fadeInRef, {
    once: true,
  });

  const fadeUpVariants = {
    initial: {
      opacity: 0,
      y: 24,
    },
    animate: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <section id="hero">
      <div className="relative h-full overflow-hidden py-14">
        <div className="container z-10 flex flex-col">
          <div className="mt-5 grid grid-cols-1">
            <div className="flex flex-col items-center gap-1 pb-8 text-center">
            <div className="flex min-h-[2rem] mb-4 items-center justify-center">
                <AnimatedGradientText>
                🏈 <hr className="mx-2 h-4 w-[1px] shrink-0 bg-gray-300" />{" "}
                  <span
                    className={cn(
                      `inline animate-gradient bg-gradient-to-r from-[#5783fc] via-[#9c40ff] to-[#008cff] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent`,
                    )}
                  >
                    Sign up for the beta
                  </span>
                  <ChevronRight className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                </AnimatedGradientText>
              </div>
              <motion.h1
                ref={fadeInRef}
                className="text-balance bg-gradient-to-br from-black from-30% to-black/60 bg-clip-text py-3 text-3xl font-medium leading-none tracking-tighter text-transparent dark:from-white dark:to-white/40 sm:text-3xl md:text-3xl lg:text-3xl"
                animate={fadeInInView ? "animate" : "initial"}
                variants={fadeUpVariants}
                initial={false}
                transition={{
                  duration: 0.6,
                  delay: 0.1,
                  ease: [0.21, 0.47, 0.32, 0.98],
                  type: "spring",
                }}
              >
                AI-powered natural language interface to sports stats.
                
              </motion.h1>
              
              <motion.p
                className="text-balance text-lg tracking-tight text-gray-400 md:text-lg"
                animate={fadeInInView ? "animate" : "initial"}
                variants={fadeUpVariants}
                initial={false}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                  ease: [0.21, 0.47, 0.32, 0.98],
                  type: "spring",
                }}
              >
                Huddlechat is our first consumer product, built on top of the <ExternalLink href="/new">nflfastR</ExternalLink> database. 
                A natural language interface to sports stats, powered by AI.
              </motion.p>
            </div>
          </div>

          <motion.div
            animate={fadeInInView ? "animate" : "initial"}
            variants={fadeUpVariants}
            initial={false}
            transition={{
              duration: 1.4,
              delay: 0.4,
              ease: [0.21, 0.47, 0.32, 0.98],
              type: "spring",
            }}
            className="relative mt-3 h-full w-full rounded-xl after:absolute after:inset-0 
            after:z-10 after:[background:linear-gradient(to_top,#fff_30%,transparent)] 
            dark:after:[background:linear-gradient(to_top,#000000_30%,transparent)]"
          >
            <div
              className={cn(
                "absolute inset-0 bottom-1/2 h-full w-full transform-gpu [filter:blur(120px)]",
                // light styles
                "[background-image:linear-gradient(to_bottom,#0ea5e9,transparent_30%)]",

              )}
            />

            <BorderBeam size={150} />
            <BorderBeam size={150} delay={7} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
