import { Hero, Navbar } from "@/components/landing";
import { Features } from "@/components/landing/Features";
import { HeroFooter } from "@/components/landing/HeroFooter";

export default async function HomePageIndex() {
    return (
        <>
            <Navbar />
            <Hero />
            <Features />
            <HeroFooter />
        </>
    )
}