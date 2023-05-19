import { BillingPlan } from './create';

export interface Session {
  vercelToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatar: string;
    name?: string;
    plan: BillingPlan;
  };
}
