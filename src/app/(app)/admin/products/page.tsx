import CreateProductForm from "@/components/CreateProductForm";
import ImportProductsForm from "@/components/ImportProductsForm";
import { listProducts } from "@/lib/store/products";

function formatPrice(value: number | undefined): string {
  return value === undefined ? "—" : `${value.toFixed(3)} DT`;
}

export default async function ProductsPage() {
  const products = await listProducts();
  const families = new Map<string, number>();
  for (const p of products) {
    const key = p.famille ?? "Sans famille";
    families.set(key, (families.get(key) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">Produits</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Catalogue utilisé pour la tâche d&apos;inventaire des missions (comptage par produit).
        </p>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Importer des articles</h2>
        <div className="mt-4">
          <ImportProductsForm />
        </div>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Ajouter un article</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Code article (ex. code SAP), famille, colisage et jusqu&apos;à 6 prix de vente.
        </p>
        <div className="mt-4">
          <CreateProductForm />
        </div>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        {products.length === 0 && (
          <p className="p-6 text-sm text-zinc-500">Aucun article créé pour le moment.</p>
        )}
        <div className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {Array.from(families.keys())
            .sort()
            .map((famille) => (
              <div key={famille} className="flex flex-col">
                <p className="bg-black/[.02] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-white/[.04]">
                  {famille}
                </p>
                {products
                  .filter((p) => (p.famille ?? "Sans famille") === famille)
                  .map((p) => (
                    <div key={p.code} className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-medium text-black dark:text-zinc-50">
                          {p.designation} <span className="font-normal text-zinc-500">· {p.code}</span>
                        </p>
                        <p className="text-xs text-zinc-500">
                          Colisage : {p.colisage ?? "—"} · Achat : {formatPrice(p.prixAchat)}
                        </p>
                      </div>
                      <div className="hidden flex-wrap justify-end gap-1 text-xs text-zinc-500 sm:flex">
                        {[p.prixVente1, p.prixVente2, p.prixVente3, p.prixVente4, p.prixVente5, p.prixVente6].map(
                          (v, i) =>
                            v !== undefined && (
                              <span
                                key={i}
                                className="rounded-full bg-black/[.06] px-2 py-0.5 dark:bg-white/[.1]"
                              >
                                PV{i + 1} : {v.toFixed(3)}
                              </span>
                            )
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
