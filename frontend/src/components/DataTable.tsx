'use client';

import type { ReactNode } from 'react';

export interface Column<T> {
  /** En-tête de colonne, et libellé du champ dans la vue mobile. */
  header: string;
  cell: (row: T) => ReactNode;
  /** Masque le libellé en vue mobile (utile pour la colonne titre). */
  hideLabelOnMobile?: boolean;
  /** Retire la colonne de la vue mobile — pour les informations secondaires. */
  hideOnMobile?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
}

/**
 * Tableau du back-office, lisible sur tous les écrans.
 *
 * Un vrai `<table>` à partir de `md`, et une liste de cartes en dessous : sur un
 * téléphone, un tableau à huit colonnes n'est utilisable ni en défilement
 * horizontal ni en texte réduit. Les mêmes colonnes alimentent les deux rendus,
 * il n'y a donc qu'une seule définition à maintenir.
 */
export default function DataTable<T>({ columns, rows, rowKey, caption }: DataTableProps<T>) {
  const mobileColumns = columns.filter((column) => !column.hideOnMobile);

  return (
    <>
      {/* Vue tableau — à partir de md */}
      <div className="hidden md:block bg-white border border-sable rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-sable/50 text-left">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className="px-4 py-3 text-xs text-brunProfond font-semibold whitespace-nowrap"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-t border-sable">
                {columns.map((column) => (
                  <td key={column.header} className={`px-4 py-3 ${column.className ?? ''}`}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue cartes — en dessous de md */}
      <ul className="md:hidden space-y-3">
        {rows.map((row) => (
          <li key={rowKey(row)} className="bg-white border border-sable rounded-sm p-4">
            <dl className="space-y-2">
              {mobileColumns.map((column) => (
                <div
                  key={column.header}
                  className={
                    column.hideLabelOnMobile
                      ? 'mb-1'
                      : 'flex justify-between items-start gap-3 text-sm'
                  }
                >
                  {!column.hideLabelOnMobile && (
                    <dt className="text-xs text-taupe shrink-0 pt-0.5">
                      {column.header}
                    </dt>
                  )}
                  <dd
                    className={
                      column.hideLabelOnMobile
                        ? 'text-base font-medium text-brunProfond'
                        : 'text-right text-brunProfond min-w-0'
                    }
                  >
                    {column.cell(row)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
