import { QuestionDef, QuestionType, SectionDef } from "./types";

const VALID_TYPES: QuestionType[] = ["SCALE", "YES_NO", "TEXT", "NUMBER"];

export class ValidationError extends Error {}

function sanitizeQuestion(raw: unknown, knownIds: Set<string>): QuestionDef {
  if (typeof raw !== "object" || raw === null) throw new ValidationError("Question invalide.");
  const q = raw as Record<string, unknown>;

  if (typeof q.id !== "string" || !q.id) throw new ValidationError("Identifiant de question manquant.");
  if (typeof q.text !== "string" || !q.text.trim()) throw new ValidationError("Le texte de la question est requis.");
  if (typeof q.type !== "string" || !VALID_TYPES.includes(q.type as QuestionType)) {
    throw new ValidationError("Type de question invalide.");
  }
  const weight = Number(q.weight);
  if (![1, 2, 3].includes(weight)) throw new ValidationError("Le poids doit être 1, 2 ou 3.");

  let dependsOn: QuestionDef["dependsOn"];
  if (q.dependsOn && typeof q.dependsOn === "object") {
    const d = q.dependsOn as Record<string, unknown>;
    if (typeof d.questionId !== "string" || !knownIds.has(d.questionId)) {
      throw new ValidationError("La question de dépendance référencée est invalide.");
    }
    if (!Array.isArray(d.triggerValues) || d.triggerValues.length === 0) {
      throw new ValidationError("Au moins une valeur déclenchante est requise pour une question conditionnelle.");
    }
    dependsOn = {
      questionId: d.questionId,
      triggerValues: d.triggerValues.filter((v): v is string => typeof v === "string"),
    };
  }

  return {
    id: q.id,
    text: q.text.trim(),
    type: q.type as QuestionType,
    weight: weight as 1 | 2 | 3,
    required: Boolean(q.required),
    dependsOn,
  };
}

export function sanitizeSections(raw: unknown): SectionDef[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ValidationError("Au moins une section est requise.");
  }

  const knownIds = new Set<string>();
  for (const section of raw) {
    const s = section as Record<string, unknown>;
    if (Array.isArray(s?.questions)) {
      for (const q of s.questions) {
        const id = (q as Record<string, unknown>)?.id;
        if (typeof id === "string") knownIds.add(id);
      }
    }
  }

  return raw.map((section, index) => {
    const s = section as Record<string, unknown>;
    if (typeof s.id !== "string" || !s.id) throw new ValidationError("Identifiant de section manquant.");
    if (typeof s.label !== "string" || !s.label.trim()) {
      throw new ValidationError(`La section #${index + 1} doit avoir un intitulé.`);
    }
    if (!Array.isArray(s.questions) || s.questions.length === 0) {
      throw new ValidationError(`La section "${s.label}" doit contenir au moins une question.`);
    }
    return {
      id: s.id,
      label: s.label.trim(),
      questions: s.questions.map((q) => sanitizeQuestion(q, knownIds)),
    };
  });
}
