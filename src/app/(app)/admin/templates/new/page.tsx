import TemplateBuilder from "@/components/TemplateBuilder";

export default function NewTemplatePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">Nouveau formulaire</h1>
      </div>
      <TemplateBuilder mode="create" />
    </div>
  );
}
