import { LEGAL_PAGES, LEGAL_PLACEHOLDER_MARKER, findLegalPage } from '@nissa/shared';
import { marked } from 'marked';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Pages légales — CDC §2.2.
 *
 * Un seul composant sert les huit pages ; le contenu vit dans
 * apps/web/content/legal/<slug>.md. La maîtrise d'ouvrage remplace le texte dans
 * ces fichiers, sans toucher au code (le forfait couvre l'intégration, pas la
 * rédaction — CDC §2.4).
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = findLegalPage(slug);
  if (!page) return { title: 'Page introuvable' };

  return { title: page.title, description: page.description };
}

async function readLegalMarkdown(slug: string): Promise<string | null> {
  try {
    return await readFile(join(process.cwd(), 'content', 'legal', `${slug}.md`), 'utf8');
  } catch {
    return null;
  }
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = findLegalPage(slug);
  if (!page) notFound();

  const markdown = await readLegalMarkdown(slug);
  // Le contenu provient du dépôt (jamais d'une saisie utilisateur) : le rendu
  // HTML direct est sans risque d'injection ici.
  const html = markdown ? await marked.parse(markdown) : null;
  const awaitingContent = markdown?.includes(LEGAL_PLACEHOLDER_MARKER) ?? false;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Pages légales">
        {LEGAL_PAGES.map((item) => (
          <Link
            key={item.slug}
            href={`/legal/${item.slug}`}
            className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${
              item.slug === slug
                ? 'bg-brunProfond text-beigeClair border-brunProfond'
                : 'bg-white text-taupe border-sable hover:text-brunProfond hover:border-taupe'
            }`}
          >
            {item.navLabel}
          </Link>
        ))}
      </nav>

      <p className="text-sm text-taupe mb-6 leading-relaxed">{page.description}</p>

      {awaitingContent && (
        <div
          className="flex gap-3 p-4 rounded-sm text-sm mb-8 bg-amber-50 border-l-3 border-amber-500 text-amber-900"
          role="note"
        >
          <div>
            <p className="font-semibold mb-1">Texte en attente</p>
            <p className="leading-relaxed">
              Certains passages de cette page portent la mention{' '}
              <code className="bg-amber-100 px-1 rounded-sm">{LEGAL_PLACEHOLDER_MARKER}</code> : le
              texte définitif doit être fourni par la maîtrise d’ouvrage. Il se remplace dans{' '}
              <code className="bg-amber-100 px-1 rounded-sm">
                apps/web/content/legal/{slug}.md
              </code>
              , sans intervention sur le code.
            </p>
          </div>
        </div>
      )}

      {html ? (
        <article
          className="legal-content text-brunProfond"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="text-sm text-taupe">
          Le contenu de cette page n’a pas encore été rédigé.
        </p>
      )}
    </div>
  );
}
