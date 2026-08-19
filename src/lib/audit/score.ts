import { CATEGORIES } from "./bank";
import { AnswersMap, ANSWER_OPTIONS, AnswerValue, AuditResult, CategoryResult, GeneratedQuestion } from "./types";

const SCORE_BY_VALUE: Record<AnswerValue, number> = Object.fromEntries(
  ANSWER_OPTIONS.map((o) => [o.value, o.score])
) as Record<AnswerValue, number>;

function levelFor(scorePercent: number): CategoryResult["level"] {
  if (scorePercent < 40) return "critique";
  if (scorePercent < 65) return "a_ameliorer";
  if (scorePercent < 85) return "correct";
  return "excellent";
}

const RECOMMENDATIONS: Record<CategoryResult["level"], string> = {
  critique: "Risque élevé : traitez ces points en priorité avant toute mise en production.",
  a_ameliorer: "Des lacunes notables subsistent : planifiez des actions correctives à court terme.",
  correct: "Le niveau est globalement satisfaisant, quelques ajustements restent utiles.",
  excellent: "Bonnes pratiques bien en place : maintenez ce niveau lors des évolutions futures.",
};

export function computeResult(questions: GeneratedQuestion[], answers: AnswersMap): AuditResult {
  const byCategory = new Map<string, GeneratedQuestion[]>();
  for (const q of questions) {
    if (!byCategory.has(q.categoryId)) byCategory.set(q.categoryId, []);
    byCategory.get(q.categoryId)!.push(q);
  }

  const categories: CategoryResult[] = [];
  let totalWeighted = 0;
  let totalWeight = 0;

  for (const [categoryId, qs] of byCategory) {
    const answered = qs.filter((q) => answers[q.id]);
    if (answered.length === 0) continue;
    let weightedSum = 0;
    let weightSum = 0;
    for (const q of answered) {
      const score = SCORE_BY_VALUE[answers[q.id]];
      weightedSum += score * q.weight;
      weightSum += q.weight;
    }
    const scorePercent = Math.round((weightedSum / weightSum) * 100);
    const level = levelFor(scorePercent);
    categories.push({
      categoryId,
      label: CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId,
      scorePercent,
      level,
      recommendation: RECOMMENDATIONS[level],
    });
    totalWeighted += weightedSum;
    totalWeight += weightSum;
  }

  categories.sort((a, b) => a.scorePercent - b.scorePercent);

  return {
    overallScorePercent: totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 100) : 0,
    categories,
    answeredCount: Object.keys(answers).length,
  };
}
