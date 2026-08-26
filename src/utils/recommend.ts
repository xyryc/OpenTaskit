import type { Task, User } from '../types';

/**
 * How "Recommended for you" is filtered, for the provider ("I provide services") home screen.
 *
 * A task scores on two signals only, both explainable to the user:
 *
 *   1. Profile skills — the task category is one the member offers work in
 *      (User.categoryIds), or a skill word of theirs appears in the task title.
 *      This is the stronger signal and carries the most weight.
 *   2. Location      — closer tasks score higher, on a straight taper from the
 *      member's own doorstep out to MAX_DISTANCE_KM.
 *
 * Tasks with neither signal are dropped rather than shown with a low score, so the
 * section stays empty instead of filling up with irrelevant work.
 */

const SKILL_WEIGHT = 100;
const TITLE_MATCH_WEIGHT = 45;
const LOCATION_WEIGHT = 60;
export const MAX_DISTANCE_KM = 15;

function skillWords(user: User): string[] {
  return user.skills.
  flatMap((skill) => skill.toLowerCase().split(/[\s&/-]+/)).
  filter((word) => word.length > 3);
}

function locationScore(distanceKm: number): number {
  const closeness = 1 - Math.min(distanceKm, MAX_DISTANCE_KM) / MAX_DISTANCE_KM;
  return closeness * LOCATION_WEIGHT;
}

export interface RecommendationReason {
  /** The task category matches one the member works in. */
  skillMatch: boolean;
  /** Within a comfortable travelling distance. */
  nearby: boolean;
}

export function reasonFor(task: Task, user: User): RecommendationReason {
  return {
    skillMatch: user.categoryIds.includes(task.categoryId),
    nearby: task.distanceKm <= MAX_DISTANCE_KM / 2
  };
}

/** A short line explaining why a task surfaced, shown under the section heading. */
export function reasonLabel(task: Task, user: User): string {
  const reason = reasonFor(task, user);
  if (reason.skillMatch && reason.nearby) return 'Matches your skills · nearby';
  if (reason.skillMatch) return 'Matches your skills';
  if (reason.nearby) return 'Close to you';
  return 'Similar to your past work';
}

export function scoreTask(task: Task, user: User): number {
  const words = skillWords(user);
  const title = task.title.toLowerCase();

  let score = 0;
  if (user.categoryIds.includes(task.categoryId)) score += SKILL_WEIGHT;
  if (words.some((word) => title.includes(word))) score += TITLE_MATCH_WEIGHT;
  if (score === 0) return 0;

  return score + locationScore(task.distanceKm);
}

/** Highest-scoring open tasks for this member, best first. */
export function recommendedTasks(tasks: Task[], user: User, limit = 6): Task[] {
  return tasks.
  map((task) => ({ task, score: scoreTask(task, user) })).
  filter((entry) => entry.score > 0).
  sort((a, b) => b.score - a.score).
  slice(0, limit).
  map((entry) => entry.task);
}
