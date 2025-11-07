import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Top-right AI Chat button */}
      <div className="pointer-events-none fixed right-4 top-4 z-50 md:right-8 md:top-8">
        <Button
          asChild
          className="pointer-events-auto"
          size="sm"
          variant="default"
        >
          <Link aria-label="Go to AI Chat" href="/chat">
            AI Chat
          </Link>
        </Button>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:py-20 md:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Tirth Bhatt
        </h1>
        <p className="mt-3 max-w-3xl text-balance text-muted-foreground sm:text-lg">
          Dynamic and detail-oriented SDET with 4 years of automation
          experience. I leverage AI tools to streamline testing and lift product
          quality across UIs, APIs, microservices, and LLM pipelines.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <Link
            className="text-primary underline-offset-4 hover:underline"
            href="tel:+447341544376"
          >
            +44 7341544376
          </Link>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <Link
            className="text-primary underline-offset-4 hover:underline"
            href="mailto:tirthbhatt7@gmail.com"
          >
            tirthbhatt7@gmail.com
          </Link>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <Link
            className="text-primary underline-offset-4 hover:underline"
            href="https://linkedin.com/in/tirthbhatt7"
            rel="noopener"
            target="_blank"
          >
            linkedin.com/in/tirthbhatt7
          </Link>
        </div>
      </section>

      {/* Profile */}
      <section aria-labelledby="profile-heading" className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
          <h2 id="profile-heading" className="text-xl font-semibold">
            Profile
          </h2>
          <p className="mt-3 max-w-4xl text-muted-foreground">
            Proven record improving feedback loops and reducing production
            issues. Built prompt-driven test harnesses and automated checks for
            LLM features (accuracy, consistency, sentiment, basic hallucination
            flags). Experienced across CI/CD, API/DB testing, Testcontainers,
            and Docker/Kubernetes on Azure. Collaborate cross-functionally on
            prompt engineering, RAG, and pipeline orchestration. Comfortable in
            Agile/Scrum and mentoring juniors.
          </p>
        </div>
      </section>

      {/* Tools & Tech */}
      <section aria-labelledby="tools-heading" className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
          <h2 id="tools-heading" className="text-xl font-semibold">
            Tools and Tech
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-medium">Languages</h3>
              <p className="mt-1 text-muted-foreground">
                JavaScript/TypeScript, Java, Python, R, C#
              </p>
            </div>
            <div>
              <h3 className="font-medium">Cloud</h3>
              <p className="mt-1 text-muted-foreground">
                AWS, Microsoft Azure, GCP
              </p>
            </div>
            <div>
              <h3 className="font-medium">Frameworks</h3>
              <p className="mt-1 text-muted-foreground">
                Playwright, Cypress, Appium, Selenium, Node.js, .NET
              </p>
            </div>
            <div>
              <h3 className="font-medium">API & Performance</h3>
              <p className="mt-1 text-muted-foreground">
                Postman, Gatling, JMeter, WireMock
              </p>
            </div>
            <div>
              <h3 className="font-medium">CI/CD</h3>
              <p className="mt-1 text-muted-foreground">
                GitHub Actions, Jenkins, Azure DevOps
              </p>
            </div>
            <div>
              <h3 className="font-medium">Containers</h3>
              <p className="mt-1 text-muted-foreground">Docker, Kubernetes</p>
            </div>
            <div>
              <h3 className="font-medium">Databases</h3>
              <p className="mt-1 text-muted-foreground">
                SQL, PostgreSQL, Redis, MongoDB
              </p>
            </div>
            <div>
              <h3 className="font-medium">Version Control</h3>
              <p className="mt-1 text-muted-foreground">GitHub, BitBucket</p>
            </div>
          </div>
        </div>
      </section>

      {/* Experience */}
      <section aria-labelledby="experience-heading" className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
          <h2 id="experience-heading" className="text-xl font-semibold">
            Experience
          </h2>

          <div className="mt-6 space-y-8">
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium">
                  Testend Ltd. — SDET II, Guildford, UK
                </h3>
                <p className="text-sm text-muted-foreground">
                  Oct 2023 – Present
                </p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                IT services and consulting with multiple international clients.
              </p>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="font-medium">
                    AI Customer Service Platform (CCaaS, Europe) — Agent Assist
                    & Voice Analytics
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>
                      Automated a wide matrix of agent-assist configurations
                      with Playwright, expanding coverage and validating flows.
                    </li>
                    <li>
                      Built a speech testing harness (TTS → Chromium via
                      PulseAudio) and evaluated transcripts with WER to flag
                      accuracy regressions.
                    </li>
                    <li>
                      Added transcript QA and reporting (timing alignment,
                      intent checks, confidence thresholds), including
                      noisy/accented audio scenarios.
                    </li>
                    <li>
                      Created API tests and schedules, supporting stable
                      releases and backend robustness.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">
                    University Client — AI Student Support Chatbot & Learning
                    Assistant
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>
                      Designed a dynamic, prompt-driven test framework to
                      simulate personas and validate tone and content.
                    </li>
                    <li>
                      Built anomaly detection and sentiment pipelines for
                      model-behavior monitoring.
                    </li>
                    <li>
                      Added basic hallucination flags and context-match scoring
                      with regression dashboards for faster feedback.
                    </li>
                    <li>
                      Managed CI/CD with Jenkins to ensure seamless integration
                      and delivery.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">
                    FinTech Giant — Trading & Risk Platform
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>
                      Built E2E automation using Playwright/Cypress to improve
                      release quality and efficiency.
                    </li>
                    <li>
                      Developed backend test frameworks with Python and
                      Testcontainers to validate critical integrations.
                    </li>
                    <li>
                      Implemented Dockerised mock servers on Kubernetes to
                      simulate trading workflows.
                    </li>
                    <li>
                      Migrated legacy Cypress suites to Playwright and aligned
                      testing with business goals via Scrum/JIRA.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium">Envinida LLP — SDET I (Remote)</h3>
                <p className="text-sm text-muted-foreground">
                  Sept 2022 – Oct 2023
                </p>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>
                  Automated UI test suites with Cypress/JavaScript, increasing
                  coverage by 60% and reducing deployment risks.
                </li>
                <li>
                  Owned API testing integrated with GitHub Actions for
                  continuous testing in CI/CD.
                </li>
                <li>
                  Collaborated with backend engineers to shorten bug resolution
                  time and benchmarked key APIs for performance gains.
                </li>
              </ul>
            </div>

            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium">
                  WhiteHat Jr — QA Automation Engineer, Mumbai, India
                </h3>
                <p className="text-sm text-muted-foreground">
                  June 2020 – Aug 2021
                </p>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>
                  Built Selenium test suites, cutting manual QA effort by 40%.
                </li>
                <li>Automated regression workflows via GitHub Actions.</li>
                <li>
                  Conducted performance testing with JMeter and validated
                  microservices stability via REST tests.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Education */}
      <section aria-labelledby="education-heading" className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
          <h2 id="education-heading" className="text-xl font-semibold">
            Education
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  University of Surrey — MSc Data Science, Guildford, UK
                </p>
                <span className="text-sm text-muted-foreground">
                  Sept 2021 – Aug 2022
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Modules: Data Science Principles, Database Management, IT
                Infrastructure, Information Security, ML & Data Mining, Advanced
                Web Tech, Cloud Computing, NLP, Practical Business Analytics
              </p>
            </div>
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  Symbiosis Institute of Technology — B.E. Mechanical
                  Engineering, Pune, India
                </p>
                <span className="text-sm text-muted-foreground">
                  July 2016 – June 2020
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Modules: Programming, Engineering & Applied Mathematics,
                Mechatronics, Robotics, CFD, CAD/CAM, Cyber Security
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects & Achievements */}
      <section aria-labelledby="projects-heading" className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
          <h2 id="projects-heading" className="text-xl font-semibold">
            Projects and Achievements
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Python-based campus study-space chatbot using spaCy (NLP), Flask
              (backend), and JS/HTML/CSS (UI).
            </li>
            <li>
              EV Battery Cooling System Design — Highest mark in year for
              final-year project through data-driven evaluation.
            </li>
            <li>
              Youngest departmental head for Formula Student team; led Vehicle
              Dynamics and used R analytics to improve tire performance — 2nd
              place in National Design Award (SUPRA SAE 2018).
            </li>
          </ul>
        </div>
      </section>

      {/* Interests */}
      <section aria-labelledby="interests-heading" className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
          <h2 id="interests-heading" className="text-xl font-semibold">
            Interests and Hobbies
          </h2>
          <p className="mt-3 text-muted-foreground">
            Formula 1 · Swimming · Golf
          </p>
        </div>
      </section>
    </main>
  );
}
