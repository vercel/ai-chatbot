import { redirect } from "next/navigation";

type LegacyPageParams = { pageId: string };
type LegacyPageSearchParams = Record<string, string | string[] | undefined>;

type LegacyPageProps = {
  params: LegacyPageParams | Promise<LegacyPageParams>;
  searchParams:
    | LegacyPageSearchParams
    | Promise<LegacyPageSearchParams>;
};

export default async function LegacyPageRedirect({
  params,
  searchParams,
}: LegacyPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const query = stringifySearchParams(resolvedSearchParams);
  const destination =
    query.length > 0
      ? `/pages/${resolvedParams.pageId}?${query}`
      : `/pages/${resolvedParams.pageId}`;

  redirect(destination);
}

function stringifySearchParams(
  searchParams: Record<string, string | string[] | undefined>
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((entry) => {
        params.append(key, entry);
      });
    }
  }

  return params.toString();
}

