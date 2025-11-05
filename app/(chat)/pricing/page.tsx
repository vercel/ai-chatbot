import { auth } from "@/app/(auth)/auth";
import { Pricing } from "@/components/pricing";
import { getProducts } from "@/lib/db/queries";

export default async function PricingPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const products = await getProducts();

  return <Pricing products={products} userId={userId} />;
}
