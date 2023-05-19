import { type Session } from './types';

export async function createSession(vercelToken: string): Promise<Session> {
  const [user, teams] = await Promise.all([
    fetchUser(vercelToken),
    fetchTeams(vercelToken),
  ]);
  const plan = getHighestAccountLevel(teams);
  return {
    user: {
      id: user.uid,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: `https://vercel.com/api/www/avatar/?u=${user.username}`,
      plan,
    },
    vercelToken,
  };
}

interface VercelUser {
  uid: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
}

type BillingStatus = 'active' | 'trialing' | 'overdue' | 'canceled' | 'expired';

export const billingPlans = ['hobby', 'pro', 'enterprise'] as const;

export type BillingPlan = (typeof billingPlans)[number];

export interface Billing {
  addons?: string | null;
  language?: string | null;
  plan: BillingPlan;
  // TODO: Make this required once the migration has completed
  status?: BillingStatus;
  name?: string | null;
  overdue?: boolean | null;
  period: { start: number; end: number } | null;
  purchaseOrder?: string | null;
  platform?: 'stripe' | 'stripeTestMode';
  email?: string;
  trial: { start: number; end: number } | null;
}
export interface VercelTeam {
  id: string;
  slug: string;
  name: string;
  avatar?: string;
  billing?: Billing;
  created?: string;
}
async function fetchUser(token: string) {
  const response = await fetch('https://vercel.com/api/user', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const { user } = (await response.json()) as { user: VercelUser };

  return user;
}
export async function fetchTeams(token: string) {
  const response = await fetch('https://vercel.com/api/teams', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const { teams } = (await response.json()) as { teams: VercelTeam[] };
  return teams;
}

export function hasActiveProOrEnterpriseAccount(teams: VercelTeam[]) {
  return teams.some(
    (team) =>
      (team.billing?.plan === 'pro' && team.billing.status === 'active') ||
      (team.billing?.plan === 'enterprise' && team.billing.status === 'active')
  );
}

export function hasActiveProAccount(teams: VercelTeam[]) {
  return teams.some(
    (team) => team.billing?.plan === 'pro' && team.billing.status === 'active'
  );
}

export function isInTrial(teams: VercelTeam[]) {
  return (
    !hasActiveProOrEnterpriseAccount(teams) &&
    teams.some(
      (team) =>
        team.billing?.plan === 'pro' && team.billing.status === 'trialing'
    )
  );
}

export function getHighestAccountLevel(teams: VercelTeam[]): BillingPlan {
  const plans = teams
    .filter(
      (team) => team.billing?.plan && team.billing.status === 'active'
      // (team.billing?.plan && team.billing.status === 'trialing')
    )
    .map((team) => team.billing?.plan);
  return plans.includes('enterprise')
    ? 'enterprise'
    : plans.includes('pro')
    ? 'pro'
    : 'hobby';
}
