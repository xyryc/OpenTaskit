import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  AppNotification,
  Dispute,
  DisputeOutcome,
  KycStatus,
  Language,
  Message,
  Offer,
  PaymentMethod,
  Review,
  Task,
  ToastMessage,
  Transaction,
  User,
  UserMode } from
'../types';
import { tasks as seedTasks } from '../data/tasks';
import { users as seedUsers, ME } from '../data/users';
import {
  disputes as seedDisputes,
  initialWallet,
  messages as seedMessages,
  notifications as seedNotifications,
  offers as seedOffers,
  reviews as seedReviews,
  transactions as seedTransactions } from
'../data/marketplace';
import { DELETION_PENALTY_RATE, commissionFor, deletionPenaltyFor } from '../utils/format';
import { paymentMethodLabel } from '../utils/payment';
import { translate } from '../utils/i18n';

type LocationPermission = 'unknown' | 'granted' | 'denied';

/**
 * What a guest was trying to do when we asked them to create an account.
 * Guests may browse and view every posted job; these two actions are the
 * conversion triggers.
 */
export type AccountGateIntent = 'offer' | 'post';

export interface NewTaskDraft {
  title: string;
  categoryId: string;
  description: string;
  images: string[];
  location: string;
  budget: number;
  flexibleBudget: boolean;
  schedule: Task['schedule'];
  paymentMethod: PaymentMethod;
}

interface AppState {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
  mode: UserMode;
  setMode: (m: UserMode) => void;
  authed: boolean;
  /** Browsing without an account. Can view everything, cannot offer or post. */
  guest: boolean;
  signIn: () => void;
  signOut: () => void;
  continueAsGuest: () => void;
  /** Set while the account prompt is on screen, describing what the guest tried to do. */
  gateIntent: AccountGateIntent | null;
  /**
   * Returns true when the member may go ahead. For a guest it opens the
   * create-account prompt and returns false, so callers can simply bail out.
   */
  requireAccount: (intent: AccountGateIntent) => boolean;
  closeGate: () => void;
  me: User;
  users: User[];
  available: boolean;
  toggleAvailable: () => void;
  kyc: KycStatus;
  setKyc: (s: KycStatus) => void;
  locationPermission: LocationPermission;
  setLocationPermission: (p: LocationPermission) => void;
  currentLocation: string;
  tasks: Task[];
  offers: Offer[];
  messages: Message[];
  notifications: AppNotification[];
  transactions: Transaction[];
  reviews: Review[];
  disputes: Dispute[];
  savedTaskIds: string[];
  wallet: typeof initialWallet;
  searchHistory: string[];
  addSearch: (term: string) => void;
  toasts: ToastMessage[];
  toast: (t: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  // derived
  taskById: (id: string) => Task | undefined;
  userById: (id: string) => User;
  offersForTask: (taskId: string) => Offer[];
  myOffer: (taskId: string) => Offer | undefined;
  messagesForTask: (taskId: string) => Message[];
  disputeForTask: (taskId: string) => Dispute | undefined;
  reviewsFor: (userId: string) => Review[];
  unreadNotifications: number;
  unreadMessages: number;
  pendingOfferCount: number;
  // actions
  createTask: (draft: NewTaskDraft) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  cancelTask: (id: string) => void;
  /** Removes a posted task. Returns the penalty charged, or 0 when it was free. */
  deleteTask: (id: string) => number;
  toggleSaved: (id: string) => void;
  submitOffer: (input: {taskId: string;price: number;eta: string;message: string;note?: string;}) => string;
  updateOffer: (id: string, patch: Partial<Offer>) => void;
  withdrawOffer: (id: string) => void;
  acceptOffer: (offerId: string) => void;
  rejectOffer: (offerId: string) => void;
  startJob: (taskId: string) => void;
  markCompleted: (taskId: string) => void;
  confirmCompletion: (taskId: string) => void;
  settlePayment: (taskId: string) => void;
  topUp: (amount: number, method: string) => void;
  sendMessage: (taskId: string, text: string, attachment?: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  raiseDispute: (input: {taskId: string;reason: string;description: string;evidence: string[];}) => void;
  respondToDispute: (taskId: string, text: string) => void;
  resolveDispute: (taskId: string, outcome: DisputeOutcome) => void;
  leaveReview: (input: {
    taskId: string;
    toId: string;
    rating: number;
    text: string;
    tags: string[];
    role: Review['role'];
  }) => void;
}

const AppContext = createContext<AppState | null>(null);

let counter = 100;
const nextId = (prefix: string) => `${prefix}${++counter}`;
const now = () => new Date().toISOString();

export function AppProvider({ children }: {children: React.ReactNode;}) {
  const [language, setLanguage] = useState<Language>('en');
  const [mode, setMode] = useState<UserMode>('requester');
  const [authed, setAuthed] = useState(false);
  const [guest, setGuest] = useState(false);
  const [gateIntent, setGateIntent] = useState<AccountGateIntent | null>(null);
  const [available, setAvailable] = useState(true);
  const [kyc, setKyc] = useState<KycStatus>('verified');
  const [locationPermission, setLocationPermission] = useState<LocationPermission>('granted');
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [offers, setOffers] = useState<Offer[]>(seedOffers);
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);
  const [transactions, setTransactions] = useState<Transaction[]>(seedTransactions);
  const [reviews, setReviews] = useState<Review[]>(seedReviews);
  const [disputes, setDisputes] = useState<Dispute[]>(seedDisputes);
  const [savedTaskIds, setSavedTaskIds] = useState<string[]>(['t1', 't13']);
  const [wallet, setWallet] = useState(initialWallet);
  const [searchHistory, setSearchHistory] = useState<string[]>([
  'deep cleaning',
  'plumber near me',
  'furniture assembly']
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const t = useCallback((key: string) => translate(language, key), [language]);

  const toast = useCallback((input: Omit<ToastMessage, 'id'>) => {
    const id = nextId('toast');
    setToasts((prev) => [...prev, { ...input, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3200);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const pushNotification = useCallback((n: Omit<AppNotification, 'id' | 'at' | 'read'>) => {
    setNotifications((prev) => [{ ...n, id: nextId('n'), at: now(), read: false }, ...prev]);
  }, []);

  const userById = useCallback(
    (id: string) => seedUsers.find((u) => u.id === id) ?? seedUsers[0],
    []
  );
  const me = useMemo(() => {
    const base = userById(ME);
    return { ...base, available, kyc, verified: kyc === 'verified' };
  }, [available, kyc, userById]);

  const taskById = useCallback((id: string) => tasks.find((x) => x.id === id), [tasks]);
  const offersForTask = useCallback(
    (taskId: string) => offers.filter((o) => o.taskId === taskId && o.status !== 'withdrawn'),
    [offers]
  );
  const myOffer = useCallback(
    (taskId: string) => offers.find((o) => o.taskId === taskId && o.providerId === ME && o.status !== 'withdrawn'),
    [offers]
  );
  const messagesForTask = useCallback(
    (taskId: string) =>
    messages.
    filter((m) => m.taskId === taskId).
    sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
    [messages]
  );
  const disputeForTask = useCallback((taskId: string) => disputes.find((d) => d.taskId === taskId), [disputes]);
  const reviewsFor = useCallback((userId: string) => reviews.filter((r) => r.toId === userId), [reviews]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const unreadMessages = 2;
  const pendingOfferCount = offers.filter(
    (o) => o.status === 'pending' && tasks.find((x) => x.id === o.taskId)?.requesterId === ME
  ).length;

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((x) => x.id === id ? { ...x, ...patch } : x));
  }, []);

  const createTask = useCallback(
    (draft: NewTaskDraft) => {
      const id = nextId('t');
      const task: Task = {
        id,
        title: draft.title,
        categoryId: draft.categoryId,
        description: draft.description,
        images: draft.images,
        budget: draft.budget,
        flexibleBudget: draft.flexibleBudget,
        location: draft.location,
        distanceKm: 0.6,
        pin: { x: 52, y: 36 },
        schedule: draft.schedule,
        paymentMethod: draft.paymentMethod,
        postedAt: now(),
        status: 'posted',
        requesterId: ME
      };
      setTasks((prev) => [task, ...prev]);
      // A provider discovers the task and offers shortly after posting.
      setTimeout(() => {
        const offerId = nextId('o');
        setOffers((prev) => [
        {
          id: offerId,
          taskId: id,
          providerId: 'p1',
          price: Math.max(1500, Math.round(draft.budget * 0.92 / 50) * 50),
          eta: 'Available this week · 3 hrs',
          message:
          'I saw your task and I am available. I bring my own supplies and can start whenever suits you.',
          status: 'pending',
          createdAt: now()
        },
        ...prev]
        );
        setTasks((prev) => prev.map((x) => x.id === id ? { ...x, status: 'receiving_offers' } : x));
        pushNotification({
          kind: 'offer',
          title: 'New offer received',
          body: `Ashen Fernando sent an offer for “${draft.title}”.`,
          taskId: id,
          actionLabel: 'View offers',
          actionTo: `/task/${id}/offers`
        });
        toast({ title: 'New offer received', description: 'Ashen Fernando sent an offer.', variant: 'info' });
      }, 4200);
      return id;
    },
    [pushNotification, toast]
  );

  const cancelTask = useCallback(
    (id: string) => {
      updateTask(id, { status: 'cancelled' });
      toast({ title: 'Task cancelled', variant: 'info' });
    },
    [toast, updateTask]
  );

  const deleteTask = useCallback(
    (id: string) => {
      const task = tasks.find((x) => x.id === id);
      if (!task) return 0;
      const penalty = deletionPenaltyFor(task.budget, task.status);

      setTasks((prev) => prev.filter((x) => x.id !== id));
      setOffers((prev) => prev.filter((o) => o.taskId !== id));
      setSavedTaskIds((prev) => prev.filter((x) => x !== id));

      if (penalty > 0) {
        setTransactions((prev) => [
        {
          id: nextId('tr'),
          kind: 'penalty',
          amount: -penalty,
          at: now(),
          title: 'Cancellation penalty',
          subtitle: `${task.title} · ${Math.round(DELETION_PENALTY_RATE * 100)}% of the posted price`,
          status: 'completed',
          method: paymentMethodLabel(task.paymentMethod)
        },
        ...prev]
        );
        setWallet((w) => ({ ...w, available: w.available - penalty }));
        pushNotification({
          kind: 'task',
          title: 'Task deleted · penalty charged',
          body: `“${task.title}” had someone assigned, so a ${Math.round(
            DELETION_PENALTY_RATE * 100
          )}% penalty of Rs ${penalty.toLocaleString()} was applied.`,
          actionLabel: 'Open wallet',
          actionTo: '/wallet'
        });
        toast({
          title: 'Task deleted',
          description: `Penalty of Rs ${penalty.toLocaleString()} charged — someone was already assigned.`,
          variant: 'info'
        });
      } else {
        toast({ title: 'Task deleted', description: 'No penalty — nobody had been assigned yet.', variant: 'success' });
      }
      return penalty;
    },
    [pushNotification, tasks, toast]
  );

  const toggleSaved = useCallback(
    (id: string) => {
      setSavedTaskIds((prev) => {
        const has = prev.includes(id);
        toast({ title: has ? 'Removed from saved' : 'Saved for later', variant: has ? 'info' : 'success' });
        return has ? prev.filter((x) => x !== id) : [id, ...prev];
      });
    },
    [toast]
  );

  const submitOffer = useCallback(
    (input: {taskId: string;price: number;eta: string;message: string;note?: string;}) => {
      const id = nextId('o');
      setOffers((prev) => [
      { id, status: 'pending', createdAt: now(), providerId: ME, ...input },
      ...prev]
      );
      toast({ title: 'Offer submitted', description: 'The requester has been notified.', variant: 'success' });
      return id;
    },
    [toast]
  );

  const updateOffer = useCallback((id: string, patch: Partial<Offer>) => {
    setOffers((prev) => prev.map((o) => o.id === id ? { ...o, ...patch } : o));
  }, []);

  const withdrawOffer = useCallback(
    (id: string) => {
      updateOffer(id, { status: 'withdrawn' });
      toast({ title: 'Offer withdrawn', variant: 'info' });
    },
    [toast, updateOffer]
  );

  const acceptOffer = useCallback(
    (offerId: string) => {
      const offer = offers.find((o) => o.id === offerId);
      if (!offer) return;
      setOffers((prev) =>
      prev.map((o) =>
      o.id === offerId ?
      { ...o, status: 'accepted' } :
      o.taskId === offer.taskId && o.status === 'pending' ?
      { ...o, status: 'rejected' } :
      o
      )
      );
      updateTask(offer.taskId, {
        status: 'assigned',
        assignedProviderId: offer.providerId,
        acceptedOfferId: offer.id,
        budget: offer.price
      });
      const task = tasks.find((x) => x.id === offer.taskId);
      pushNotification({
        kind: 'task',
        title: 'Provider assigned',
        body: `${userById(offer.providerId).name} is now assigned to “${task?.title ?? 'your task'}”.`,
        taskId: offer.taskId,
        actionLabel: 'View job',
        actionTo: `/job/${offer.taskId}`
      });
      setTransactions((prev) => [
      {
        id: nextId('tr'),
        kind: 'payment_released',
        amount: -offer.price,
        at: now(),
        title: 'Payment scheduled',
        subtitle: `${task?.title ?? 'Task'} · pays on completion`,
        taskId: offer.taskId,
        status: 'pending',
        method: task ? paymentMethodLabel(task.paymentMethod) : 'Cash'
      },
      ...prev]
      );
      toast({ title: 'Offer accepted', description: 'The task is now assigned.', variant: 'success' });
    },
    [offers, pushNotification, tasks, toast, updateTask, userById]
  );

  const rejectOffer = useCallback(
    (offerId: string) => {
      updateOffer(offerId, { status: 'rejected' });
      toast({ title: 'Offer declined', variant: 'info' });
    },
    [toast, updateOffer]
  );

  const startJob = useCallback(
    (taskId: string) => {
      updateTask(taskId, { status: 'in_progress' });
      toast({ title: 'Job started', description: 'Both sides can follow progress in chat.', variant: 'success' });
    },
    [toast, updateTask]
  );

  const markCompleted = useCallback(
    (taskId: string) => {
      updateTask(taskId, { status: 'awaiting_completion' });
      pushNotification({
        kind: 'task',
        title: 'Work marked as completed',
        body: 'Confirm completion to move to payment.',
        taskId,
        actionLabel: 'Confirm',
        actionTo: `/job/${taskId}`
      });
      toast({ title: 'Marked as completed', description: 'Waiting for the requester to confirm.', variant: 'success' });
    },
    [pushNotification, toast, updateTask]
  );

  const confirmCompletion = useCallback(
    (taskId: string) => {
      updateTask(taskId, { status: 'awaiting_completion' });
      toast({ title: 'Completion confirmed', description: 'Continue to payment.', variant: 'success' });
    },
    [toast, updateTask]
  );

  const settlePayment = useCallback(
    (taskId: string) => {
      const task = tasks.find((x) => x.id === taskId);
      if (!task) return;
      const commission = commissionFor(task.budget);
      const methodLabel = paymentMethodLabel(task.paymentMethod);
      updateTask(taskId, { status: 'completed', paid: true });
      setTransactions((prev) => [
      ...(task.assignedProviderId === ME ?
      [
      {
        id: nextId('tr'),
        kind: 'payment_received' as const,
        amount: task.budget,
        at: now(),
        title: `Payment received (${methodLabel.toLowerCase()})`,
        subtitle: task.title,
        taskId,
        status: 'completed' as const,
        method: methodLabel
      },
      {
        id: nextId('tr'),
        kind: 'commission' as const,
        amount: -commission,
        at: now(),
        title: 'Platform commission',
        subtitle: `${task.title} · 12%`,
        taskId,
        status: 'completed' as const
      }] :

      [
      {
        id: nextId('tr'),
        kind: 'payment_released' as const,
        amount: -task.budget,
        at: now(),
        title: `Payment released (${methodLabel.toLowerCase()})`,
        subtitle: task.title,
        taskId,
        status: 'completed' as const,
        method: methodLabel
      }]),

      ...prev.map((tr) => tr.taskId === taskId && tr.status === 'pending' ? { ...tr, status: 'completed' as const } : tr)]
      );
      if (task.assignedProviderId === ME) {
        setWallet((w) => ({
          ...w,
          available: w.available - commission,
          pending: Math.max(0, w.pending - task.budget),
          earnings: w.earnings + task.budget,
          commissions: w.commissions + commission
        }));
      }
      pushNotification({
        kind: 'payment',
        title: 'Payment settled',
        body: `${task.title} · ${methodLabel.toLowerCase()} payment confirmed. Commission ${
        commission > 0 ? `Rs ${commission.toLocaleString()}` : ''
        } applied.`,
        taskId,
        actionLabel: 'Open wallet',
        actionTo: '/wallet'
      });
      toast({ title: 'Payment confirmed', description: 'Wallet and history updated.', variant: 'success' });
    },
    [pushNotification, tasks, toast, updateTask]
  );

  const topUp = useCallback(
    (amount: number, method: string) => {
      setWallet((w) => ({ ...w, available: w.available + amount }));
      setTransactions((prev) => [
      {
        id: nextId('tr'),
        kind: 'topup',
        amount,
        at: now(),
        title: 'Wallet top-up',
        subtitle: method,
        status: 'completed',
        method
      },
      ...prev]
      );
      toast({ title: 'Top-up successful', description: `Rs ${amount.toLocaleString()} added.`, variant: 'success' });
    },
    [toast]
  );

  const sendMessage = useCallback((taskId: string, text: string, attachment?: string) => {
    const id = nextId('m');
    setMessages((prev) => [
    ...prev,
    { id, taskId, senderId: ME, text, at: now(), attachment, status: 'sent' }]
    );
    setTimeout(
      () => setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'delivered' } : m)),
      700
    );
    setTimeout(
      () => setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'seen' } : m)),
      1800
    );
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const raiseDispute = useCallback(
    (input: {taskId: string;reason: string;description: string;evidence: string[];}) => {
      const dispute: Dispute = {
        id: nextId('d'),
        taskId: input.taskId,
        raisedById: ME,
        reason: input.reason,
        description: input.description,
        evidence: input.evidence,
        status: 'submitted',
        timeline: [
        {
          id: nextId('de'),
          label: 'Dispute submitted',
          detail: `You submitted a dispute with ${input.evidence.length} file(s) of evidence.`,
          at: now(),
          done: true
        },
        {
          id: nextId('de'),
          label: 'Provider notified',
          detail: 'The other party has 48 hours to respond.',
          at: now(),
          done: true
        },
        { id: nextId('de'), label: 'Under review', detail: 'Support will review all evidence.', at: now(), done: false },
        { id: nextId('de'), label: 'Decision made', detail: 'An outcome will be shared here.', at: now(), done: false },
        { id: nextId('de'), label: 'Resolved', detail: 'Payment state updates automatically.', at: now(), done: false }],

        responses: []
      };
      setDisputes((prev) => [dispute, ...prev]);
      updateTask(input.taskId, { status: 'disputed' });
      pushNotification({
        kind: 'dispute',
        title: 'Dispute submitted',
        body: 'Support is reviewing your case. Payment is on hold.',
        taskId: input.taskId,
        actionLabel: 'Track dispute',
        actionTo: `/dispute/${input.taskId}`
      });
      // Other party responds, then review starts.
      setTimeout(() => {
        setDisputes((prev) =>
        prev.map((d) =>
        d.id === dispute.id ?
        {
          ...d,
          status: 'under_review',
          responses: [
          {
            id: nextId('dr'),
            authorId: 'p4',
            text: 'I have submitted my side with a photo taken right after finishing the work.',
            at: now()
          }],

          timeline: d.timeline.map((e, i) => i === 2 ? { ...e, done: true, at: now() } : e)
        } :
        d
        )
        );
        pushNotification({
          kind: 'dispute',
          title: 'Dispute under review',
          body: 'The other party responded and support is reviewing the case.',
          taskId: input.taskId,
          actionLabel: 'Track dispute',
          actionTo: `/dispute/${input.taskId}`
        });
        toast({ title: 'Dispute updated', description: 'The other party responded.', variant: 'info' });
      }, 5000);
      toast({ title: 'Dispute submitted', description: 'We will keep you updated.', variant: 'success' });
    },
    [pushNotification, toast, updateTask]
  );

  const respondToDispute = useCallback((taskId: string, text: string) => {
    setDisputes((prev) =>
    prev.map((d) =>
    d.taskId === taskId ?
    { ...d, responses: [...d.responses, { id: nextId('dr'), authorId: ME, text, at: now() }] } :
    d
    )
    );
  }, []);

  const resolveDispute = useCallback(
    (taskId: string, outcome: DisputeOutcome) => {
      const task = tasks.find((x) => x.id === taskId);
      const amount =
      outcome === 'full_payment' ?
      task?.budget ?? 0 :
      outcome === 'partial_payment' ?
      Math.round((task?.budget ?? 0) * 0.6) :
      0;
      setDisputes((prev) =>
      prev.map((d) =>
      d.taskId === taskId ?
      {
        ...d,
        status: 'resolved',
        outcome,
        outcomeAmount: amount,
        timeline: d.timeline.map((e) => ({ ...e, done: true }))
      } :
      d
      )
      );
      updateTask(taskId, { status: 'completed', paid: true });
      if (amount > 0) {
        setTransactions((prev) => [
        {
          id: nextId('tr'),
          kind: outcome === 'partial_payment' ? 'partial_payment' : 'payment_released',
          amount: outcome === 'refund' ? amount : -amount,
          at: now(),
          title: outcome === 'partial_payment' ? 'Partial payment · dispute decision' : 'Dispute settlement',
          subtitle: task?.title ?? 'Task',
          taskId,
          status: 'completed'
        },
        ...prev]
        );
      }
      toast({ title: 'Dispute resolved', description: 'Payment state updated.', variant: 'success' });
    },
    [tasks, toast, updateTask]
  );

  const leaveReview = useCallback(
    (input: {taskId: string;toId: string;rating: number;text: string;tags: string[];role: Review['role'];}) => {
      setReviews((prev) => [{ ...input, id: nextId('rv'), fromId: ME, at: now() }, ...prev]);
      updateTask(
        input.taskId,
        input.role === 'provider' ? { reviewedByRequester: true } : { reviewedByProvider: true }
      );
      toast({ title: 'Review published', description: 'Thanks for keeping the marketplace honest.', variant: 'success' });
    },
    [toast, updateTask]
  );

  const addSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    setSearchHistory((prev) => [term, ...prev.filter((x) => x !== term)].slice(0, 6));
  }, []);

  const value: AppState = {
    language,
    setLanguage,
    t,
    mode,
    setMode,
    authed,
    guest,
    signIn: () => {
      setAuthed(true);
      setGuest(false);
      setGateIntent(null);
    },
    signOut: () => {
      setAuthed(false);
      setGuest(false);
      setGateIntent(null);
    },
    continueAsGuest: () => {
      setGuest(true);
      setAuthed(false);
    },
    gateIntent,
    requireAccount: (intent: AccountGateIntent) => {
      if (authed) return true;
      setGateIntent(intent);
      return false;
    },
    closeGate: () => setGateIntent(null),
    me,
    users: seedUsers,
    available,
    toggleAvailable: () => {
      setAvailable((a) => {
        toast({
          title: a ? 'You are now unavailable' : 'You are available again',
          description: a ? 'You will not receive new opportunities.' : 'New tasks nearby will reach you.',
          variant: 'info'
        });
        return !a;
      });
    },
    kyc,
    setKyc,
    locationPermission,
    setLocationPermission,
    currentLocation: locationPermission === 'granted' ? 'Kirulapone, Colombo 05' : 'Location off',
    tasks,
    offers,
    messages,
    notifications,
    transactions,
    reviews,
    disputes,
    savedTaskIds,
    wallet,
    searchHistory,
    addSearch,
    toasts,
    toast,
    dismissToast,
    taskById,
    userById,
    offersForTask,
    myOffer,
    messagesForTask,
    disputeForTask,
    reviewsFor,
    unreadNotifications,
    unreadMessages,
    pendingOfferCount,
    createTask,
    updateTask,
    cancelTask,
    deleteTask,
    toggleSaved,
    submitOffer,
    updateOffer,
    withdrawOffer,
    acceptOffer,
    rejectOffer,
    startJob,
    markCompleted,
    confirmCompletion,
    settlePayment,
    topUp,
    sendMessage,
    markNotificationRead,
    markAllNotificationsRead,
    raiseDispute,
    respondToDispute,
    resolveDispute,
    leaveReview
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
