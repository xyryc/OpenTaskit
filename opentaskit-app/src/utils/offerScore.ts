import type { Offer, User } from '../types';

export function scoreOffer(offer: Offer, provider: User, budget: number): number {
  const priceScore = Math.max(0, 1 - Math.abs(offer.price - budget * 0.92) / Math.max(budget, 1)) * 34;
  const ratingScore = provider.rating / 5 * 30;
  const trustScore = provider.successRate / 100 * 16 + (provider.verified ? 8 : 0);
  const experienceScore = Math.min(provider.completedJobs / 200, 1) * 12;
  return priceScore + ratingScore + trustScore + experienceScore;
}

export function bestMatchId(
offers: Offer[],
userById: (id: string) => User,
budget: number)
: string | undefined {
  const pending = offers.filter((offer) => offer.status === 'pending');
  if (pending.length < 2) return pending[0]?.id;
  return [...pending].sort(
    (a, b) => scoreOffer(b, userById(b.providerId), budget) - scoreOffer(a, userById(a.providerId), budget)
  )[0]?.id;
}