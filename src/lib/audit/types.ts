export type AnswerValue = "always" | "often" | "sometimes" | "rarely" | "never";

export const ANSWER_OPTIONS: { value: AnswerValue; label: string; score: number }[] = [
  { value: "always", label: "Toujours", score: 1 },
  { value: "often", label: "Souvent", score: 0.75 },
  { value: "sometimes", label: "Parfois", score: 0.5 },
  { value: "rarely", label: "Rarement", score: 0.25 },
  { value: "never", label: "Jamais", score: 0 },
];

export type Depth = "rapide" | "standard" | "approfondi";

export const DEPTH_QUESTIONS_PER_CATEGORY: Record<Depth, number> = {
  rapide: 3,
  standard: 5,
  approfondi: 8,
};

export interface CategoryDef {
  id: string;
  label: string;
  description: string;
}

export interface QuestionTemplate {
  id: string;
  categoryId: string;
  text: string;
  weight: 1 | 2 | 3;
  /** Only offered as a candidate when the answer to `dependsOn` matches `whenValueAtMost`. */
  dependsOn?: {
    questionId: string;
    whenValueAtMost: AnswerValue;
  };
}

export interface GeneratedQuestion extends QuestionTemplate {
  isFollowUp: boolean;
}

export type AnswersMap = Record<string, AnswerValue>;

export interface CategoryResult {
  categoryId: string;
  label: string;
  scorePercent: number;
  level: "critique" | "a_ameliorer" | "correct" | "excellent";
  recommendation: string;
}

export interface AuditResult {
  overallScorePercent: number;
  categories: CategoryResult[];
  answeredCount: number;
}
