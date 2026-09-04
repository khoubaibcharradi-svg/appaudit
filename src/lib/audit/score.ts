import { SCALE_OPTIONS } from "./types";
import { AnswerEntry, QuestionDef, SectionDef } from "./types";
import { answersToMap, getVisibleQuestions } from "./visibility";

const SCORE_BY_VALUE: Record<string, number> = Object.fromEntries(
  SCALE_OPTIONS.map((o) => [o.value, o.score])
);

export interface MaturityScore {
  scorePercent: number;
  scaleQuestionCount: number;
}

export interface CompletionSummary {
  visibleCount: number;
  answeredCount: number;
  requiredCount: number;
  requiredAnsweredCount: number;
}

/** Maturity score computed only from the SCALE-type questions that were shown and answered. */
export function computeMaturityScore(sections: SectionDef[], answers: AnswerEntry[]): MaturityScore | null {
  const answerMap = answersToMap(answers);
  const visible = getVisibleQuestions(sections, answerMap);
  const scaleQuestions = visible.filter((q): q is QuestionDef => q.type === "SCALE" && answerMap[q.id] !== undefined);
  if (scaleQuestions.length === 0) return null;

  let weightedSum = 0;
  let weightSum = 0;
  for (const q of scaleQuestions) {
    const score = SCORE_BY_VALUE[answerMap[q.id]] ?? 0;
    weightedSum += score * q.weight;
    weightSum += q.weight;
  }
  return {
    scorePercent: Math.round((weightedSum / weightSum) * 100),
    scaleQuestionCount: scaleQuestions.length,
  };
}

export function computeCompletion(sections: SectionDef[], answers: AnswerEntry[]): CompletionSummary {
  const answerMap = answersToMap(answers);
  const visible = getVisibleQuestions(sections, answerMap);
  const required = visible.filter((q) => q.required);
  return {
    visibleCount: visible.length,
    answeredCount: visible.filter((q) => answerMap[q.id] !== undefined && answerMap[q.id] !== "").length,
    requiredCount: required.length,
    requiredAnsweredCount: required.filter((q) => answerMap[q.id] !== undefined && answerMap[q.id] !== "").length,
  };
}
