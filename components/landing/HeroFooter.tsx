import { FooterLogo } from "../assets/logo/FooterLogo"

export const HeroFooter = () => {
  return (
    <footer className="border-t-[1px] py-[25px] border-[#ececee]">
      <div className="max-w-5xl mx-auto flex text-[#52525b] text-sm">
        <FooterLogo width={220} height={30}/>
      </div>
    </footer>
  )
}
