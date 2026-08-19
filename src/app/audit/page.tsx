"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QuestionCard from "@/components/QuestionCard";
import ResultsView from "@/components/ResultsView";
import { computeResult } from "@/lib/audit/score";
import { AnswersMap, AnswerValue, AuditResult, GeneratedQuestion } from "@/lib/audit/types";

function AuditFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categories = searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
  const depth = searchParams.get("depth") ?? "standard";

  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [loading, setLoading] = useState(true);
  const [checkingFollowUps, setCheckingFollowUps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      router.replace("/");
      return;
    }
    let cancelled = false;
    fetch("/api/audit/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories, depth }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur lors de la génération des questions.");
        if (!cancelled) setQuestions(data.questions);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = useCallback(
    async (questionId: string, value: AnswerValue) => {
      const nextAnswers = { ...answers, [questionId]: value };
      setAnswers(nextAnswers);

      setCheckingFollowUps(true);
      try {
        const res = await fetch("/api/audit/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: nextAnswers,
            includedIds: [...questions.map((q) => q.id), questionId],
          }),
        });
        const data = await res.json();
        if (res.ok && data.questions.length > 0) {
          setQuestions((prev) => [...prev, ...data.questions]);
        }
      } finally {
        setCheckingFollowUps(false);
      }
    },
    [answers, questions]
  );

  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  function showResults() {
    setResult(computeResult(questions, answers));
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Génération des questions en cours…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (result) {
    return <ResultsView result={result} onRestart={() => router.push("/")} />;
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
        <span>
          {answeredCount} / {questions.length} questions répondues
        </span>
        {checkingFollowUps && <span>Vérification de nouvelles questions…</span>}
      </div>
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.1]">
        <div
          className="h-full rounded-full bg-black transition-all dark:bg-white"
          style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
        />
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={answers[question.id]}
            index={index}
            onAnswer={handleAnswer}
          />
        ))}
      </div>

      <button
        onClick={showResults}
        disabled={!allAnswered || checkingFollowUps}
        className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#ccc]"
      >
        Voir les résultats
      </button>
    </div>
  );
}

export default function AuditPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <Suspense fallback={<p className="text-sm text-zinc-500">Chargement…</p>}>
        <AuditFlow />
      </Suspense>
    </div>
  );
}
