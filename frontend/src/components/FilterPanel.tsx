'use client';

import {
  CATEGORIES,
  COLOR_NAMES,
  CONDITIONS,
  CONDITION_LABELS,
  MATERIALS,
  SIZE_REFERENTIALS,
  findCategory,
  sizeGroupFor,
} from '@nissa/shared';
import { X } from 'lucide-react';
import { Button, Select } from './ui';

export interface Filters {
  q: string;
  /** Filtre « toutes les annonces de cette vendeuse ». Posé par le profil
      public, il n'apparaît pas dans le panneau mais doit être conservé. */
  sellerId: string;
  categoryId: string;
  subcategoryId: string;
  size: string;
  material: string;
  color: string;
  condition: string;
  brand: string;
  priceMin: string;
  priceMax: string;
  sort: string;
}

export const EMPTY_FILTERS: Filters = {
  q: '',
  sellerId: '',
  categoryId: '',
  subcategoryId: '',
  size: '',
  material: '',
  color: '',
  condition: '',
  brand: '',
  priceMin: '',
  priceMax: '',
  sort: 'recent',
};

interface FilterPanelProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
}

/** Panneau de filtres du catalogue — CDC §3.5. */
export default function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const category = filters.categoryId ? findCategory(filters.categoryId) : undefined;

  // Le référentiel de tailles suit la sous-catégorie choisie, sinon la catégorie.
  const sizeGroup = filters.subcategoryId
    ? sizeGroupFor(filters.categoryId, filters.subcategoryId)
    : category?.sizeGroup;
  const sizes = sizeGroup ? SIZE_REFERENTIALS[sizeGroup].values : [];

  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  // Le tri n'est pas un filtre : il a toujours une valeur.
  const activeCount = (Object.keys(EMPTY_FILTERS) as (keyof Filters)[]).filter(
    (key) => key !== 'sort' && filters[key] !== '',
  ).length;

  return (
    <aside className="bg-white border border-sable rounded-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-playfair text-lg text-brunProfond">
          Filtres {activeCount > 0 && <span className="text-orDore text-sm">({activeCount})</span>}
        </h2>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-taupe hover:text-orDore inline-flex items-center gap-1"
          >
            <X size={12} />
            Réinitialiser
          </button>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="filter-q"
          className="block text-xs font-semibold uppercase tracking-wider mb-2 text-brunProfond"
        >
          Mots-clés
        </label>
        <input
          id="filter-q"
          type="search"
          placeholder="Abaya, khimar, jilbeb…"
          value={filters.q}
          onChange={(event) => set({ q: event.target.value })}
          className="w-full p-2.5 bg-white border border-sable rounded-sm text-sm focus:outline-none focus:border-orDore"
        />
      </div>

      <Select
        label="Catégorie"
        value={filters.categoryId}
        onChange={(event) =>
          // Changer de catégorie invalide la sous-catégorie et la taille du référentiel précédent.
          set({ categoryId: event.target.value, subcategoryId: '', size: '' })
        }
      >
        <option value="">Toutes les catégories</option>
        {CATEGORIES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </Select>

      {category && (
        <Select
          label="Sous-catégorie"
          value={filters.subcategoryId}
          onChange={(event) => set({ subcategoryId: event.target.value, size: '' })}
        >
          <option value="">Toutes</option>
          {category.subcategories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      )}

      {sizes.length > 0 && (
        <Select label="Taille" value={filters.size} onChange={(event) => set({ size: event.target.value })}>
          <option value="">Toutes les tailles</option>
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      )}

      <Select
        label="État"
        value={filters.condition}
        onChange={(event) => set({ condition: event.target.value })}
      >
        <option value="">Tous les états</option>
        {CONDITIONS.map((condition) => (
          <option key={condition} value={condition}>
            {CONDITION_LABELS[condition]}
          </option>
        ))}
      </Select>

      <Select
        label="Matière"
        value={filters.material}
        onChange={(event) => set({ material: event.target.value })}
      >
        <option value="">Toutes les matières</option>
        {MATERIALS.map((material) => (
          <option key={material} value={material}>
            {material}
          </option>
        ))}
      </Select>

      <Select label="Couleur" value={filters.color} onChange={(event) => set({ color: event.target.value })}>
        <option value="">Toutes les couleurs</option>
        {COLOR_NAMES.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </Select>

      <div className="mb-4">
        <span className="block text-xs font-semibold uppercase tracking-wider mb-2 text-brunProfond">
          Prix (€)
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            aria-label="Prix minimum en euros"
            value={filters.priceMin}
            onChange={(event) => set({ priceMin: event.target.value })}
            className="w-full p-2.5 bg-white border border-sable rounded-sm text-sm focus:outline-none focus:border-orDore"
          />
          <span className="text-taupe">—</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            aria-label="Prix maximum en euros"
            value={filters.priceMax}
            onChange={(event) => set({ priceMax: event.target.value })}
            className="w-full p-2.5 bg-white border border-sable rounded-sm text-sm focus:outline-none focus:border-orDore"
          />
        </div>
      </div>

      <div className="mb-4">
        <label
          htmlFor="filter-brand"
          className="block text-xs font-semibold uppercase tracking-wider mb-2 text-brunProfond"
        >
          Marque
        </label>
        <input
          id="filter-brand"
          type="text"
          placeholder="Toutes les marques"
          value={filters.brand}
          onChange={(event) => set({ brand: event.target.value })}
          className="w-full p-2.5 bg-white border border-sable rounded-sm text-sm focus:outline-none focus:border-orDore"
        />
      </div>

      {activeCount > 0 && (
        <Button variant="ghost" onClick={onReset}>
          Tout effacer
        </Button>
      )}
    </aside>
  );
}
