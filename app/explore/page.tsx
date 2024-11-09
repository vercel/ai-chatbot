import Image from 'next/image';
import Link from 'next/link';

import CompanyCard from '@/components/custom/CompayCard';
import { Button } from '@/components/ui/button';
import { getCompanyData } from '@/data/companyData';

import * as AuraImage from '../../public/images/aura.png';

export default async function Page() {
  const companies = getCompanyData();
  const featuredCompanies = companies.slice(0, 2);

  return (
    <div>
      <div className="bg-gray-800 py-14 px-8 relative z-0">
        <div className="pr-24">
          <h2 className="text-white text-xl">Welcome Matti!</h2>
          <p className="text-white text-xl">Tell us what matters to you!</p>
        </div>
        <div className="absolute rocket h-56 top-2 right-2 overflow-hidden z-10" />
      </div>
      <div className="half-bg-gray-800 mb-10 px-8">
        <div className="bg-primary rounded-lg p-4 flex flex-col gap-4">
          <h3 className="text-white font-bold text-base">
            Ready to find your perfect fit?
          </h3>
          <div className="flex gap-4">
            <div className="shrink-0">
              <Image src={AuraImage} alt="Aura" className="w-18" />
            </div>
            <p className="text-white">
              Create your profile to unlock matches with companies that share
              your values and support your well-being.
            </p>
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/profile">Create your profile</Link>
          </Button>
        </div>
      </div>
      <div className="px-8 pb-4">
        <h2 className="pb-2">Companies</h2>
        <p className="pb-4">Create a profile and find your match</p>
        <div className="flex flex-col gap-4">
          {featuredCompanies.map((company) => (
            <CompanyCard company={company} key={company.businessId} />
          ))}
        </div>
      </div>
    </div>
  );
}
