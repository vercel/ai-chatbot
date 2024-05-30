import { FooterLogo } from "../assets/logo/FooterLogo"

export const HeroFooter = () => {
  return (
    <footer className="border-t-[1px] py-[25px] border-[#ececee] dark:border-[#333338]">
      <div className="max-w-5xl mx-auto flex text-[#52525b] dark:text-white/75 text-sm">
        <FooterLogo width={220} height={30}/>
      </div>
    </footer>
  )
}
