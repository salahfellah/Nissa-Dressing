/**
 * Signature de la marque. Sans état : peut être rendue côté serveur.
 *
 * `asHeading` la promeut en `<h1>` : sur l'écran d'accueil, le logo *est* le
 * titre de la page. Ailleurs (en-tête, pied de page), il ne doit surtout pas en
 * être un — il y aurait alors plusieurs titres de premier niveau par page.
 *
 * Le nom complet « Nissa Dressing » est porté par `aria-label` : à l'écran la
 * composition reste en trois temps (Nissa / Dressing / Islamic Dresses), mais un
 * lecteur d'écran annonce une seule fois le nom de la marque au lieu d'épeler
 * les fragments décoratifs.
 */
export default function Logo({
  size = 'large',
  asHeading = false,
}: {
  size?: 'large' | 'small' | 'tiny';
  asHeading?: boolean;
}) {
  const titleClass =
    size === 'large' ? 'text-5xl md:text-6xl' : size === 'small' ? 'text-3xl' : 'text-xl';

  const Nom = asHeading ? 'h1' : 'span';

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <Nom
        aria-label="Nissa Dressing"
        className={`font-playfair tracking-[0.2em] uppercase leading-none text-orDore m-0 block ${titleClass}`}
      >
        Nissa
      </Nom>

      <span className="flex items-center justify-center w-full mt-2 mb-1" aria-hidden>
        <span className="h-px flex-1 bg-taupe" />
        <span className="mx-3 tracking-[0.3em] text-xs uppercase font-light text-brunProfond">
          Dressing
        </span>
        <span className="h-px flex-1 bg-taupe" />
      </span>

      {size !== 'tiny' && (
        <span
          className="tracking-[0.4em] text-[0.6rem] uppercase mt-1 font-semibold text-brunProfond"
          aria-hidden
        >
          Islamic Dresses
        </span>
      )}
    </div>
  );
}
