import { QUESTION_BANK } from "./bank";
import {
  AnswerValue,
  AnswersMap,
  ANSWER_OPTIONS,
  Depth,
  DEPTH_QUESTIONS_PER_CATEGORY,
  GeneratedQuestion,
} from "./types";

const SCORE_BY_VALUE: Record<AnswerValue, number> = Object.fromEntries(
  ANSWER_OPTIONS.map((o) => [o.value, o.score])
) as Record<AnswerValue, number>;

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Randomly draws `count` base questions for a category from the bank,
 * favouring higher-weight questions without making the selection
 * deterministic — each audit run can surface a different question set.
 */
function pickBaseQuestions(categoryId: string, count: number): GeneratedQuestion[] {
  const candidates = QUESTION_BANK.filter((q) => q.categoryId === categoryId && !q.dependsOn);
  const byWeightDesc = [3, 2, 1].flatMap((w) => shuffle(candidates.filter((q) => q.weight === w)));
  return byWeightDesc.slice(0, count).map((q) => ({ ...q, isFollowUp: false }));
}

export function generateBaseAudit(categoryIds: string[], depth: Depth): GeneratedQuestion[] {
  const perCategory = DEPTH_QUESTIONS_PER_CATEGORY[depth];
  return categoryIds.flatMap((categoryId) => pickBaseQuestions(categoryId, perCategory));
}

/**
 * Given the answers collected so far, dynamically resolves any follow-up
 * questions unlocked by weak answers (score at or below the configured
 * threshold), excluding questions already present in the session.
 */
export function generateFollowUps(
  answers: AnswersMap,
  alreadyIncludedIds: Iterable<string>
): GeneratedQuestion[] {
  const included = new Set(alreadyIncludedIds);
  return QUESTION_BANK.filter((q) => {
    if (!q.dependsOn || included.has(q.id)) return false;
    const parentAnswer = answers[q.dependsOn.questionId];
    if (!parentAnswer) return false;
    return SCORE_BY_VALUE[parentAnswer] <= SCORE_BY_VALUE[q.dependsOn.whenValueAtMost];
  }).map((q) => ({ ...q, isFollowUp: true }));
}
