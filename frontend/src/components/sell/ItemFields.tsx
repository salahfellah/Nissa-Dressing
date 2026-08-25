'use client';

import {
  CATEGORIES,
  COLORS,
  CONDITIONS,
  CONDITION_HELP,
  CONDITION_LABELS,
  MATERIALS,
  NEW_ONLY_CONDITIONS,
  SIZE_REFERENTIALS,
  findCategory,
  findSubcategory,
  sizeGroupFor,
  type ListingInput,
} from '@nissa/shared';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { Alert, Card, Input, Select, Textarea } from '@/components/ui';

/**
 * Description de l'article — CDC §3.3.
 *
 * Les mentions conditionnelles de la sous-catégorie (burkini mastour, manteaux
 * légiférés, articles neufs uniquement) s'affichent dès qu'elle est choisie :
 * la vendeuse les lit avant de remplir la suite, pas après un refus.
 */
export default function ItemFields({
  form,
  noBrand,
  onNoBrandChange,
}: {
  form: UseFormReturn<ListingInput>;
  noBrand: boolean;
  onNoBrandChange: (value: boolean) => void;
}) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const categoryId = watch('categoryId');
  const subcategoryId = watch('subcategoryId');

  const category = categoryId ? findCategory(categoryId) : undefined;
  const subcategory = subcategoryId ? findSubcategory(subcategoryId)?.subcategory : undefined;

  const sizes =
    categoryId && subcategoryId
      ? SIZE_REFERENTIALS[sizeGroupFor(categoryId, subcategoryId)].values
      : [];

  const conditions = subcategory?.newOnly ? NEW_ONLY_CONDITIONS : CONDITIONS;

  return (
    <Card className="mb-6">
      <h2 className="font-playfair text-lg text-brunProfond mb-5">Ton article</h2>

      <Input
        label="Titre de l’annonce"
        placeholder="Ex. Abaya Dubaï brodée manches larges"
        hint="80 caractères maximum."
        required
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="flex flex-col sm:flex-row sm:gap-4">
        <div className="flex-1">
          <Select
            label="Catégorie"
            required
            error={errors.categoryId?.message}
            {...register('categoryId', {
              onChange: () => {
                // Changer de catégorie invalide la sous-catégorie et la taille,
                // qui appartenaient au référentiel précédent.
                setValue('subcategoryId', '');
                setValue('size', '');
              },
            })}
          >
            <option value="">Choisir…</option>
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex-1">
          <Select
            label="Sous-catégorie"
            required
            disabled={!category}
            error={errors.subcategoryId?.message}
            {...register('subcategoryId', { onChange: () => setValue('size', '') })}
          >
            <option value="">{category ? 'Choisir…' : 'Choisis d’abord une catégorie'}</option>
            {category?.subcategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {subcategory?.note && (
        <Alert variant="warning" title={`${subcategory.label} — à vérifier avant de continuer`}>
          {subcategory.note}
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:gap-4">
        <div className="flex-1">
          <Select
            label="Taille"
            required
            disabled={!sizes.length}
            error={errors.size?.message}
            {...register('size')}
          >
            <option value="">{sizes.length ? 'Choisir…' : 'Choisis d’abord une sous-catégorie'}</option>
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex-1">
          <Select label="Matière" required error={errors.material?.message} {...register('material')}>
            <option value="">Choisir…</option>
            {MATERIALS.map((material) => (
              <option key={material} value={material}>
                {material}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:gap-4">
        <div className="flex-1">
          <Select label="Couleur" required error={errors.color?.message} {...register('color')}>
            <option value="">Choisir…</option>
            {COLORS.map((color) => (
              <option key={color.name} value={color.name}>
                {color.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex-1">
          <Select label="État" required error={errors.condition?.message} {...register('condition')}>
            <option value="">Choisir…</option>
            {conditions.map((condition) => (
              <option key={condition} value={condition}>
                {CONDITION_LABELS[condition]} — {CONDITION_HELP[condition]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {subcategory?.newOnly && (
        <Alert variant="info">
          Par respect pour les sœurs qui achèteront, cette catégorie n’accepte que des articles{' '}
          <strong>neufs</strong>.
        </Alert>
      )}

      <div className="mb-4">
        <span className="block text-xs font-semibold uppercase tracking-wider mb-2 text-brunProfond">
          Marque <span className="text-orDore">*</span>
        </span>

        <label className="flex items-center gap-2 text-sm text-brunProfond mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={noBrand}
            onChange={(event) => {
              onNoBrandChange(event.target.checked);
              setValue('brand', event.target.checked ? null : '');
            }}
          />
          Sans marque
        </label>

        {!noBrand && (
          <Controller
            name="brand"
            control={control}
            render={({ field }) => (
              <input
                type="text"
                placeholder="Ex. Sunna Kids"
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                className="w-full p-3 bg-white border border-sable rounded-sm text-noirIntense focus:outline-none focus:border-orDore"
              />
            )}
          />
        )}
        {errors.brand && <p className="mt-1.5 text-xs text-red-600">{errors.brand.message}</p>}
      </div>

      <Textarea
        label="Description"
        rows={6}
        placeholder="Précise la coupe, la longueur, l’opacité du tissu, d’éventuels petits défauts…"
        hint="Plus tu es sincère, plus les sœurs achètent en confiance — et moins il y a de retours."
        required
        error={errors.description?.message}
        {...register('description')}
      />
    </Card>
  );
}
