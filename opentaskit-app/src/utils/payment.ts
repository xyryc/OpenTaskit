import type { PaymentMethod } from '../types';

export interface PaymentMethodMeta {
  id: PaymentMethod;
  label: string;
  /** Shown to the poster while choosing. */
  description: string;
  /** Short form shown to taskers on the task, so they know what to expect. */
  taskerNote: string;
}

export const PAYMENT_METHODS: PaymentMethodMeta[] = [
{
  id: 'cash',
  label: 'Cash',
  description: 'Hand the agreed amount over once the work is confirmed done.',
  taskerNote: 'Paid in cash on completion — carry change if you can.'
},
{
  id: 'card',
  label: 'Card payment',
  description: 'Charged to your saved card when you confirm completion.',
  taskerNote: 'Paid by card through the app — no cash needed.'
},
{
  id: 'wallet',
  label: 'Digital wallet',
  description: 'Taken from your OpenTaskit wallet balance when you confirm completion.',
  taskerNote: 'Paid from the poster’s wallet through the app — no cash needed.'
}];


export function paymentMethodMeta(method: PaymentMethod): PaymentMethodMeta {
  return PAYMENT_METHODS.find((m) => m.id === method) ?? PAYMENT_METHODS[0];
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return paymentMethodMeta(method).label;
}

/**
 * The wallet can only cover the job when the cleared balance is at least the budget.
 * Used to grey the digital-wallet option out while posting.
 */
export function walletCovers(balance: number, budget: number): boolean {
  return budget > 0 && balance >= budget;
}
