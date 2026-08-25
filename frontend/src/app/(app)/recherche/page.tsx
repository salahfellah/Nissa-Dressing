'use client';

import { toCents, type ListingDto, type PaginatedDto } from '@nissa/shared';
import { PackageSearch, SlidersHorizontal, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import FilterPanel, { EMPTY_FILTERS, type Filters } from '@/components/FilterPanel';
import ListingCard from '@/components/ListingCard';
import { Alert, Button, EmptyState, Select, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

/** Convertit les filtres d'écran en paramètres d'API (les prix passent en centimes). */
function toQuery(filters: Filters, page: number): Record<string, string | number | undefined> {
  return {
    q: filters.q || undefined,
    sellerId: filters.sellerId || undefined,
    categoryId: filters.categoryId || undefined,
    subcategoryId: filters.subcategoryId || undefined,
    size: filters.size || undefined,
    material: filters.material || undefined,
    color: filters.color || undefined,
    condition: filters.condition || undefined,
    brand: filters.brand || undefined,
    priceMin: filters.priceMin ? toCents(Number(filters.priceMin)) : undefined,
    priceMax: filters.priceMax ? toCents(Number(filters.priceMax)) : undefined,
    sort: filters.sort,
    page,
    perPage: 24,
  };
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // L'URL est la source de vérité : une recherche reste partageable et le bouton
  // « retour » du navigateur fonctionne comme attendu.
  const initialFilters = useMemo<Filters>(
    () => ({
      ...EMPTY_FILTERS,
      q: searchParams.get('q') ?? '',
      sellerId: searchParams.get('sellerId') ?? '',
      categoryId: searchParams.get('categoryId') ?? '',
      subcategoryId: searchParams.get('subcategoryId') ?? '',
      size: searchParams.get('size') ?? '',
      material: searchParams.get('material') ?? '',
      color: searchParams.get('color') ?? '',
      condition: searchParams.get('condition') ?? '',
      brand: searchParams.get('brand') ?? '',
      priceMin: searchParams.get('priceMin') ?? '',
      priceMax: searchParams.get('priceMax') ?? '',
      sort: searchParams.get('sort') ?? 'recent',
    }),
    [searchParams],
  );

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedDto<ListingDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => setFilters(initialFilters), [initialFilters]);

  const search = useCallback(async (current: Filters, currentPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      setResult(
        await api.get<PaginatedDto<ListingDto>>('/listings', { query: toQuery(current, currentPage) }),
      );
    } catch {
      setError('La recherche a échoué. Vérifie que l’API est démarrée.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Anti-rebond : la saisie du prix ou de la marque ne déclenche pas une requête
  // à chaque frappe.
  useEffect(() => {
    const timer = setTimeout(() => void search(filters, page), 250);
    return () => clearTimeout(timer);
  }, [filters, page, search]);

  const applyFilters = (next: Filters) => {
    setFilters(next);
    setPage(1);

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value && !(key === 'sort' && value === 'recent')) params.set(key, value);
    }
    router.replace(params.toString() ? `/recherche?${params}` : '/recherche', { scroll: false });
  };

  const reset = () => applyFilters(EMPTY_FILTERS);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-6">
        <h1 className="font-playfair text-2xl md:text-3xl text-noirIntense">
          {filters.sellerId
            ? // Le pseudo vient des résultats : on n'expose pas d'identifiant à l'écran.
              `Le dressing de ${result?.items[0]?.seller?.pseudo ?? 'cette sœur'}`
            : filters.q
              ? `Résultats pour « ${filters.q} »`
              : 'Tout le catalogue'}
        </h1>
        {result && (
          <p className="text-taupe text-sm mt-2">
            {result.total} article{result.total > 1 ? 's' : ''} trouvé
            {result.total > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-64 shrink-0">
          <Button
            variant="secondary"
            className="md:hidden mb-4"
            onClick={() => setShowMobileFilters((open) => !open)}
          >
            {showMobileFilters ? <X size={16} /> : <SlidersHorizontal size={16} />}
            {showMobileFilters ? 'Masquer les filtres' : 'Filtrer'}
          </Button>

          <div className={`${showMobileFilters ? 'block' : 'hidden'} md:block md:sticky md:top-28`}>
            <FilterPanel filters={filters} onChange={applyFilters} onReset={reset} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-end mb-4">
            <div className="w-56">
              <Select
                label="Trier par"
                value={filters.sort}
                onChange={(event) => applyFilters({ ...filters, sort: event.target.value })}
              >
                <option value="recent">Plus récentes</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </Select>
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          {isLoading && !result ? (
            <Spinner label="Recherche en cours…" />
          ) : result && result.items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch size={36} />}
              title="Aucun article ne correspond"
              description="Essaie d’élargir tes critères : une autre taille, une autre couleur, ou une fourchette de prix plus large."
              action={
                <Button variant="secondary" fullWidth={false} onClick={reset}>
                  Réinitialiser les filtres
                </Button>
              }
            />
          ) : (
            <>
              <div
                className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 transition-opacity ${
                  isLoading ? 'opacity-50' : ''
                }`}
              >
                {result?.items.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {result && result.totalPages > 1 && (
                <nav className="flex justify-center items-center gap-4 mt-10" aria-label="Pagination">
                  <Button
                    variant="secondary"
                    fullWidth={false}
                    disabled={page <= 1}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-taupe">
                    Page {result.page} sur {result.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    fullWidth={false}
                    disabled={page >= result.totalPages}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Suivant
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SearchContent />
    </Suspense>
  );
}
