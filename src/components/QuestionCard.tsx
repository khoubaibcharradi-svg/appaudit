import { ANSWER_OPTIONS, AnswerValue, GeneratedQuestion } from "@/lib/audit/types";
import { CATEGORIES } from "@/lib/audit/bank";

interface Props {
  question: GeneratedQuestion;
  value: AnswerValue | undefined;
  index: number;
  onAnswer: (questionId: string, value: AnswerValue) => void;
}

export default function QuestionCard({ question, value, index, onAnswer }: Props) {
  const categoryLabel = CATEGORIES.find((c) => c.id === question.categoryId)?.label ?? question.categoryId;

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        question.isFollowUp
          ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
          : "border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950"
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span>#{index + 1}</span>
        <span>·</span>
        <span>{categoryLabel}</span>
        {question.isFollowUp && (
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-100">
            Question de suivi
          </span>
        )}
      </div>
      <p className="mt-2 text-sm font-medium text-black dark:text-zinc-50">{question.text}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {ANSWER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onAnswer(question.id, option.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              value === option.value
                ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                : "border-black/[.12] text-zinc-700 hover:bg-black/[.04] dark:border-white/[.2] dark:text-zinc-300 dark:hover:bg-white/[.08]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
