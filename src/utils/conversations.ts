import type { Message, Offer, Task } from '../types';
import { ME } from '../data/users';

export function counterpartyId(task: Task, offers: Offer[], withId?: string | null): string {
  if (withId) return withId;
  if (task.assignedProviderId && task.assignedProviderId !== ME) return task.assignedProviderId;
  if (task.requesterId !== ME) return task.requesterId;
  const offer = offers.find((o) => o.taskId === task.id && o.status === 'accepted') ??
  offers.find((o) => o.taskId === task.id);
  return offer?.providerId ?? task.requesterId;
}

export interface Conversation {
  taskId: string;
  otherId: string;
  lastMessage: Message;
  unread: number;
}

export function conversationList(tasks: Task[], messages: Message[], offers: Offer[]): Conversation[] {
  const taskIds = Array.from(new Set(messages.map((m) => m.taskId)));
  return taskIds.
  map((taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;
    const thread = messages.
    filter((m) => m.taskId === taskId).
    sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    const lastMessage = thread[thread.length - 1];
    if (!lastMessage) return null;
    const unread = thread.filter((m) => m.senderId !== ME && m.status !== 'seen').length;
    return { taskId, otherId: counterpartyId(task, offers), lastMessage, unread };
  }).
  filter((item): item is Conversation => item !== null).
  sort((a, b) => new Date(b.lastMessage.at).getTime() - new Date(a.lastMessage.at).getTime());
}