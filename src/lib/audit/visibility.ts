import { AnswerEntry, QuestionDef, SectionDef } from "./types";

export function allQuestions(sections: SectionDef[]): QuestionDef[] {
  return sections.flatMap((s) => s.questions);
}

export function isQuestionVisible(question: QuestionDef, answers: Record<string, string>): boolean {
  if (!question.dependsOn) return true;
  const parentValue = answers[question.dependsOn.questionId];
  if (parentValue === undefined) return false;
  return question.dependsOn.triggerValues.includes(parentValue);
}

/**
 * Questions unlock or disappear in real time as answers come in — the
 * questionnaire a user sees is generated dynamically from the template's
 * conditional rules rather than being a fixed static list.
 */
export function getVisibleQuestions(sections: SectionDef[], answers: Record<string, string>): QuestionDef[] {
  return allQuestions(sections).filter((q) => isQuestionVisible(q, answers));
}

export function answersToMap(answers: AnswerEntry[]): Record<string, string> {
  return Object.fromEntries(answers.map((a) => [a.questionId, a.value]));
}
