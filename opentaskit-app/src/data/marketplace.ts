import type {
  AppNotification,
  Dispute,
  Message,
  Offer,
  Review,
  Transaction } from
'../types';
import { IMG } from './images';

const mins = (n: number) => new Date(Date.now() - n * 60000).toISOString();

export const offers: Offer[] = [
{
  id: 'o1',
  taskId: 't1',
  providerId: 'p1',
  price: 8000,
  eta: 'Sat morning · 4 hrs',
  message:
  'I can bring a two-person team and finish in about 4 hours. Eco-friendly supplies included, cabinets and balcony covered.',
  status: 'pending',
  createdAt: mins(30)
},
{
  id: 'o2',
  taskId: 't1',
  providerId: 'p4',
  price: 7200,
  eta: 'Sat morning · 5 hrs',
  message: 'Available Saturday from 8am. I focus on kitchens and bathrooms first.',
  status: 'pending',
  createdAt: mins(22)
},
{
  id: 'o4',
  taskId: 't2',
  providerId: 'p2',
  price: 4200,
  eta: 'Today · within 2 hrs',
  message: 'Can be there within two hours with replacement fittings on hand.',
  status: 'pending',
  createdAt: mins(12)
},
{
  id: 'o5',
  taskId: 't3',
  providerId: 'p5',
  price: 13500,
  eta: 'Sun 16 Aug · 5 hrs',
  message: 'Covered lorry, blankets and straps included. Two movers plus driver.',
  status: 'pending',
  createdAt: mins(110)
},
{
  id: 'o8',
  taskId: 't4',
  providerId: 'p4',
  price: 6000,
  eta: 'This week · 3 hrs',
  message: 'I can do the trimming and bag the waste for removal.',
  status: 'pending',
  createdAt: mins(200)
},
{
  id: 'o9',
  taskId: 't5',
  providerId: 'p2',
  price: 5300,
  eta: 'Fri evening · 2 hrs',
  message: 'Full service with gas top-up if pressure is low. Warranty for 1 month.',
  status: 'pending',
  createdAt: mins(60)
},
{
  id: 'o14',
  taskId: 't6',
  providerId: 'p3',
  price: 14500,
  eta: '2 days · starts Wed 19 Aug',
  message:
  'I will fill the two cracks, sand and apply two coats. Floors and furniture fully covered before I start. Putty, tape and sheets included in my price.',
  note: 'I can start a day earlier if that suits you better.',
  status: 'pending',
  createdAt: mins(150)
},
{
  id: 'o15',
  taskId: 't6',
  providerId: 'p2',
  price: 16200,
  eta: '2 days · starts Thu 20 Aug',
  message: 'Includes crack repair and premium emulsion finish. I also seal the ceiling edge lines.',
  status: 'pending',
  createdAt: mins(120)
},
{
  id: 'o16',
  taskId: 't6',
  providerId: 'p4',
  price: 12800,
  eta: '3 days · flexible start',
  message: 'Lowest price I can do. I work alone so it takes a little longer.',
  status: 'pending',
  createdAt: mins(80)
},
{
  id: 'o10',
  taskId: 't7',
  providerId: 'p3',
  price: 6800,
  eta: 'Thu 13 Aug · 3 hrs',
  message: 'I have assembled this wardrobe model before, should take about 3 hours.',
  status: 'accepted',
  createdAt: mins(1300)
},
{
  id: 'o11',
  taskId: 't8',
  providerId: 'p1',
  price: 5000,
  eta: 'Sat 2 Aug · 3 hrs',
  message: 'Weekly clean, same team each visit.',
  status: 'accepted',
  createdAt: mins(15900)
},
{
  id: 'o12',
  taskId: 't9',
  providerId: 'me',
  price: 6500,
  eta: 'Fri 14 Aug · 3 hrs',
  message:
  'I have assembled this desk model twice before and can cable-manage the monitor arm neatly. I bring my own drill and bits.',
  status: 'accepted',
  createdAt: mins(2500)
},
{
  id: 'o13',
  taskId: 't10',
  providerId: 'p4',
  price: 8600,
  eta: 'Mon 4 Aug · 4 hrs',
  message: 'Limescale removal and grout touch-up for both bathrooms.',
  status: 'accepted',
  createdAt: mins(12900)
},
{
  id: 'o7',
  taskId: 't4',
  providerId: 'me',
  price: 5800,
  eta: 'This weekend · 3 hrs',
  message:
  'Happy to take this on. I will shape the hedges and the lime tree, bag everything and take the waste away the same day.',
  status: 'pending',
  createdAt: mins(45)
}];


export const messages: Message[] = [
{
  id: 'm1',
  taskId: 't6',
  senderId: 'p3',
  text: 'Hi Kavindu, thanks for looking at my offer. Do you already have the paint colour picked?',
  at: mins(140),
  status: 'seen'
},
{
  id: 'm2',
  taskId: 't6',
  senderId: 'me',
  text: 'Yes — a warm off-white for the walls and pure white ceiling.',
  at: mins(132),
  status: 'seen'
},
{
  id: 'm3',
  taskId: 't6',
  senderId: 'p3',
  text: 'Perfect. Two coats will cover it well. I can start Wednesday 9am if you accept the offer.',
  at: mins(128),
  status: 'delivered'
},
{
  id: 'm4',
  taskId: 't7',
  senderId: 'p3',
  text: 'On my way, should be there in 20 minutes.',
  at: mins(95),
  status: 'seen'
},
{
  id: 'm5',
  taskId: 't7',
  senderId: 'me',
  text: 'Great, the boxes are in the bedroom.',
  at: mins(90),
  status: 'seen'
},
{
  id: 'm6',
  taskId: 't7',
  senderId: 'p3',
  text: 'Wardrobe frame is up. Starting on the drawers now.',
  at: mins(20),
  attachment: IMG.cleaning,
  status: 'delivered'
},
{
  id: 'm7',
  taskId: 't9',
  senderId: 'r1',
  text: 'Morning! Friday 9am still works for you?',
  at: mins(300),
  status: 'seen'
},
{
  id: 'm8',
  taskId: 't9',
  senderId: 'me',
  text: 'Yes, I will be there at 9. Do you have a stud finder or should I bring mine?',
  at: mins(290),
  status: 'seen'
},
{
  id: 'm9',
  taskId: 't9',
  senderId: 'r1',
  text: 'Please bring yours. See you Friday.',
  at: mins(285),
  status: 'seen'
},
{
  id: 'm10',
  taskId: 't10',
  senderId: 'me',
  text: 'The second bathroom glass still has limescale marks and the grout was not touched.',
  at: mins(12300),
  status: 'seen'
},
{
  id: 'm11',
  taskId: 't10',
  senderId: 'p4',
  text: 'I cleaned what was reachable. The grout needed materials that were not agreed in the price.',
  at: mins(12200),
  status: 'seen'
}];


export const notifications: AppNotification[] = [
{
  id: 'n1',
  kind: 'offer',
  title: 'New offer on your painting task',
  body: 'Tharindu Jayasuriya offered Rs 14,500 · starts Wed 19 Aug.',
  at: mins(150),
  read: false,
  taskId: 't6',
  actionLabel: 'View offers',
  actionTo: '/task/t6/offers'
},
{
  id: 'n2',
  kind: 'offer',
  title: '2 more offers to compare',
  body: 'Nuwan Silva and Dilini Rathnayake sent offers for “Repaint bedroom walls”.',
  at: mins(80),
  read: false,
  taskId: 't6',
  actionLabel: 'Compare offers',
  actionTo: '/task/t6/compare'
},
{
  id: 'n3',
  kind: 'message',
  title: 'Tharindu sent you a photo',
  body: 'Wardrobe frame is up. Starting on the drawers now.',
  at: mins(20),
  read: false,
  taskId: 't7',
  actionLabel: 'Open chat',
  actionTo: '/chat/t7'
},
{
  id: 'n4',
  kind: 'task',
  title: 'Your offer was accepted',
  body: 'Menaka Gunasekara accepted your offer for the home office setup.',
  at: mins(2400),
  read: true,
  taskId: 't9',
  actionLabel: 'View job',
  actionTo: '/job/t9'
},
{
  id: 'n5',
  kind: 'dispute',
  title: 'Dispute decision made',
  body: 'A partial payment of Rs 5,200 was decided for the bathroom tile task.',
  at: mins(400),
  read: false,
  taskId: 't10',
  actionLabel: 'View dispute',
  actionTo: '/dispute/t10'
},
{
  id: 'n6',
  kind: 'payment',
  title: 'Commission deducted',
  body: 'Rs 600 platform commission was deducted for the weekly cleaning task.',
  at: mins(15000),
  read: true,
  taskId: 't8',
  actionLabel: 'Open wallet',
  actionTo: '/wallet'
},
{
  id: 'n7',
  kind: 'review',
  title: 'Menaka left you a 5-star review',
  body: '“Fast, tidy and explained everything as he worked.”',
  at: mins(9000),
  read: true,
  actionLabel: 'View profile',
  actionTo: '/profile'
},
{
  id: 'n8',
  kind: 'system',
  title: 'Identity verification approved',
  body: 'Your verified badge is now visible on every task and offer.',
  at: mins(20000),
  read: true
}];


export const transactions: Transaction[] = [
{
  id: 'tr1',
  kind: 'commission',
  amount: -600,
  at: mins(15000),
  title: 'Platform commission',
  subtitle: 'Weekly apartment cleaning · 12%',
  taskId: 't8',
  status: 'completed'
},
{
  id: 'tr2',
  kind: 'payment_received',
  amount: 5000,
  at: mins(15010),
  title: 'Payment received (cash)',
  subtitle: 'Weekly apartment cleaning',
  taskId: 't8',
  status: 'completed',
  method: 'Cash'
},
{
  id: 'tr3',
  kind: 'topup',
  amount: 5000,
  at: mins(11000),
  title: 'Wallet top-up',
  subtitle: 'Bank transfer · ****4417',
  status: 'completed',
  method: 'Bank transfer'
},
{
  id: 'tr4',
  kind: 'partial_payment',
  amount: 5200,
  at: mins(400),
  title: 'Partial payment · dispute decision',
  subtitle: 'Bathroom tile deep clean',
  taskId: 't10',
  status: 'completed'
},
{
  id: 'tr5',
  kind: 'adjustment',
  amount: -408,
  at: mins(390),
  title: 'Commission adjustment',
  subtitle: 'Recalculated after dispute decision',
  taskId: 't10',
  status: 'completed'
},
{
  id: 'tr6',
  kind: 'payment_released',
  amount: -6800,
  at: mins(1200),
  title: 'Payment scheduled',
  subtitle: 'Wardrobe assembly · pays on completion',
  taskId: 't7',
  status: 'pending',
  method: 'Cash'
}];


export const reviews: Review[] = [
{
  id: 'rv1',
  taskId: 't8',
  fromId: 'me',
  toId: 'p1',
  rating: 5,
  text: 'Ashen and his team were spotless and quick. Kitchen looked brand new.',
  tags: ['Professional', 'On time', 'High quality'],
  at: mins(14800),
  role: 'provider'
},
{
  id: 'rv2',
  taskId: 't8',
  fromId: 'p1',
  toId: 'me',
  rating: 5,
  text: 'Clear instructions and easy access. Would work with Kavindu again.',
  tags: ['Great communication', 'Reliable'],
  at: mins(14700),
  role: 'requester'
},
{
  id: 'rv3',
  taskId: 't9',
  fromId: 'r1',
  toId: 'me',
  rating: 5,
  text: 'Fast, tidy and explained everything as he worked.',
  tags: ['On time', 'Professional', 'Friendly'],
  at: mins(9000),
  role: 'provider'
},
{
  id: 'rv4',
  taskId: 't7',
  fromId: 'r2',
  toId: 'p3',
  rating: 5,
  text: 'Excellent finish on the walls, no mess left behind at all.',
  tags: ['High quality', 'Professional'],
  at: mins(30000),
  role: 'provider'
},
{
  id: 'rv5',
  taskId: 't1',
  fromId: 'r1',
  toId: 'p3',
  rating: 5,
  text: 'Second time hiring Tharindu. Always on time and careful.',
  tags: ['On time', 'Reliable'],
  at: mins(46000),
  role: 'provider'
},
{
  id: 'rv6',
  taskId: 't1',
  fromId: 'r3',
  toId: 'p1',
  rating: 4,
  text: 'Good clean overall, arrived 20 minutes late.',
  tags: ['High quality'],
  at: mins(52000),
  role: 'provider'
}];


export const disputes: Dispute[] = [
{
  id: 'd1',
  taskId: 't10',
  raisedById: 'me',
  reason: 'Poor quality',
  description:
  'Grout touch-up was not done and the second bathroom shower glass still has heavy limescale marks. Photos attached from right after the job was marked complete.',
  evidence: [IMG.plumbing, IMG.cleaning],
  status: 'decision_made',
  outcome: 'partial_payment',
  outcomeAmount: 5200,
  timeline: [
  {
    id: 'de1',
    label: 'Dispute submitted',
    detail: 'You submitted a dispute with 2 photos of evidence.',
    at: mins(12100),
    done: true
  },
  {
    id: 'de2',
    label: 'Provider notified',
    detail: 'Dilini Rathnayake was asked to respond within 48 hours.',
    at: mins(12000),
    done: true
  },
  {
    id: 'de3',
    label: 'Provider responded',
    detail: 'Dilini submitted a response and 1 photo.',
    at: mins(9000),
    done: true
  },
  {
    id: 'de4',
    label: 'Under review',
    detail: 'Support reviewed the chat history, evidence and the agreed scope.',
    at: mins(2000),
    done: true
  },
  {
    id: 'de5',
    label: 'Decision made',
    detail: 'Partial payment of Rs 5,200 approved for the work completed.',
    at: mins(400),
    done: true
  },
  {
    id: 'de6',
    label: 'Resolved',
    detail: 'Waiting for both sides to acknowledge the decision.',
    at: mins(0),
    done: false
  }],

  responses: [
  {
    id: 'dr1',
    authorId: 'p4',
    text: 'Grout re-sealing was not part of the price we agreed in chat. I cleaned all tiles and glass that were reachable.',
    at: mins(9000)
  },
  {
    id: 'dr2',
    authorId: 'me',
    text: 'The task description mentioned grout touch-up where discoloured, so I expected it to be included.',
    at: mins(8000)
  }]

}];


export const initialWallet = {
  available: 12450,
  pending: 6500,
  earnings: 148200,
  commissions: 17780
};

export const recentSearches = ['deep cleaning', 'plumber near me', 'furniture assembly', 'AC service'];
export const popularSearches = ['House cleaning', 'Painting', 'Moving lorry', 'Electrician', 'Tutoring'];