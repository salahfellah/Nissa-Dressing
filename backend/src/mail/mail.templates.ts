import { formatPrice } from '@nissa/shared';

/**
 * E-mails transactionnels du parcours — CDC §2.2, §3.1, §3.3, §3.6, §3.7.
 * Le ton (tutoiement, « sœur ») reprend celui des écrans du site.
 */

export interface RenderedMail {
  subject: string;
  html: string;
  text: string;
}

const BRAND = {
  gold: '#C8A96A',
  brown: '#4A4136',
  cream: '#F6F1E8',
  sand: '#E8E1D6',
};

const layout = (title: string, bodyHtml: string, cta?: { label: string; url: string }): string => `
<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.brown};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BRAND.sand};border-radius:4px;overflow:hidden;">
        <tr><td style="background:${BRAND.brown};padding:28px 32px;text-align:center;">
          <div style="color:${BRAND.gold};font-size:26px;letter-spacing:6px;text-transform:uppercase;font-weight:600;">Nissa</div>
          <div style="color:${BRAND.cream};font-size:11px;letter-spacing:4px;text-transform:uppercase;margin-top:6px;">Dressing</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 20px;font-size:20px;font-weight:600;color:${BRAND.brown};">${title}</h1>
          <div style="font-size:14px;line-height:1.65;color:${BRAND.brown};">${bodyHtml}</div>
          ${
            cta
              ? `<div style="margin:32px 0 8px;text-align:center;">
                   <a href="${cta.url}" style="display:inline-block;background:${BRAND.gold};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:3px;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:500;">${cta.label}</a>
                 </div>
                 <p style="font-size:11px;color:#B8ADA0;text-align:center;word-break:break-all;">Si le bouton ne fonctionne pas : ${cta.url}</p>`
              : ''
          }
        </td></tr>
        <tr><td style="background:${BRAND.sand};padding:20px 32px;text-align:center;font-size:11px;color:${BRAND.brown};">
          Nissa Dressing — marketplace entre sœurs.<br>
          Paiement sécurisé via Stripe. Merci de ne pas répondre à cet e-mail.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const toText = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const mail = (subject: string, title: string, body: string, cta?: { label: string; url: string }): RenderedMail => {
  const html = layout(title, body, cta);
  return { subject, html, text: toText(html) };
};

// ————— Parcours d'inscription (CDC §3.1) —————

export const templates = {
  /** 1. Accusé de réception de la candidature. */
  signupReceived: (p: { prenom: string; accessFeeCents: number }) =>
    mail(
      'Ta demande d’inscription a bien été reçue',
      `Merci ${p.prenom} !`,
      `<p>Ta demande d’inscription à Nissa Dressing a bien été transmise à notre équipe.</p>
       <p>Elle sera examinée avec attention, y compris ton message audio. Tu recevras un e-mail dès qu’une décision aura été prise.</p>
       <p><strong>En cas d’acceptation</strong>, une participation financière unique de ${formatPrice(
         p.accessFeeCents,
       )} te sera demandée. Elle te donne un accès à vie à la plateforme, ainsi qu’un boost d’annonce offert pendant 1 mois.</p>
       <p>Qu’Allah te facilite.</p>`,
    ),

  /** 2. Candidature acceptée → lien de paiement des frais d'accès. */
  applicationAccepted: (p: { prenom: string; accessFeeCents: number; freeBoostDays: number; paymentUrl: string }) =>
    mail(
      'Ta candidature est acceptée — dernière étape',
      `Bienvenue parmi nous, ${p.prenom} !`,
      `<p>Bonne nouvelle : ta demande d’inscription a été <strong>acceptée</strong> par l’administratrice.</p>
       <p>Il ne te reste qu’une étape : régler la participation unique de <strong>${formatPrice(
         p.accessFeeCents,
       )}</strong>.</p>
       <ul>
         <li>Accès <strong>à vie</strong> à la plateforme</li>
         <li><strong>${p.freeBoostDays} jours</strong> de boost d’annonce offerts</li>
         <li>Paiement 100 % sécurisé via Stripe</li>
       </ul>`,
      { label: 'Procéder au paiement', url: p.paymentUrl },
    ),

  /** 3. Candidature refusée. */
  applicationRejected: (p: { prenom: string; reason?: string | null }) =>
    mail(
      'Suite à ta demande d’inscription',
      `Bonjour ${p.prenom}`,
      `<p>Nous te remercions pour l’intérêt que tu portes à Nissa Dressing.</p>
       <p>Après examen, ta demande d’inscription n’a pas pu être retenue.</p>
       ${p.reason ? `<p><strong>Motif :</strong> ${p.reason}</p>` : ''}
       <p>Nous te prions de bien vouloir nous en excuser, et te souhaitons le meilleur.</p>`,
    ),

  /** 4. Paiement des frais d'accès confirmé — CDC §3.1 (message de bienvenue). */
  accessFeePaid: (p: { prenom: string; loginUrl: string }) =>
    mail(
      'Paiement accepté — bienvenue sur Nissa Dressing',
      'Paiement accepté',
      `<p>Merci ${p.prenom} ! Ton paiement a bien été accepté.</p>
       <p>Tu peux désormais te connecter avec tes identifiants et rejoindre la communauté.</p>
       <p>Avant de vendre, pense à compléter ton compte : informations personnelles, adresse postale et coordonnées bancaires (collectées directement par Stripe — aucune donnée bancaire n’est conservée sur le site).</p>
       <p>Qu’Allah bénisse tes ventes.</p>`,
      { label: 'Clique ici pour rejoindre le site', url: p.loginUrl },
    ),

  // ————— Annonces (CDC §3.3) —————

  listingSubmitted: (p: { prenom: string; title: string }) =>
    mail(
      'Ton annonce a été transmise pour validation',
      'Annonce reçue',
      `<p>Merci ${p.prenom}, ton annonce <strong>« ${p.title} »</strong> a bien été transmise à l’administratrice.</p>
       <p>Elle sera examinée avant publication afin de garantir la conformité des articles proposés. Tu recevras un e-mail dès qu’une décision aura été prise.</p>`,
    ),

  listingApproved: (p: { prenom: string; title: string; listingUrl: string }) =>
    mail(
      'Ton annonce est en ligne',
      'Annonce publiée',
      `<p>Bonne nouvelle ${p.prenom} : ton annonce <strong>« ${p.title} »</strong> a été validée et est désormais visible dans le catalogue.</p>
       <p>Tu recevras un e-mail dès qu’une sœur l’aura achetée.</p>`,
      { label: 'Voir mon annonce', url: p.listingUrl },
    ),

  listingRejected: (p: { prenom: string; title: string; reason?: string | null }) =>
    mail(
      'Ton annonce n’a pas été validée',
      'Annonce refusée',
      `<p>Bonjour ${p.prenom},</p>
       <p>Ton annonce <strong>« ${p.title} »</strong> n’a pas pu être publiée en l’état.</p>
       ${p.reason ? `<p><strong>Motif :</strong> ${p.reason}</p>` : ''}
       <p>Tu peux la modifier et la soumettre à nouveau depuis ton espace « Mes annonces ».</p>`,
    ),

  // ————— Commandes (CDC §3.6) —————

  orderPaidBuyer: (p: { prenom: string; reference: string; title: string; totalCents: number; orderUrl: string }) =>
    mail(
      `Commande ${p.reference} confirmée`,
      'Ta commande est confirmée',
      `<p>Merci ${p.prenom}, ton paiement de <strong>${formatPrice(p.totalCents)}</strong> a bien été reçu.</p>
       <p>Article : <strong>${p.title}</strong><br>Référence : <strong>${p.reference}</strong></p>
       <p>Ton argent est <strong>conservé en sécurité</strong> et ne sera reversé à la vendeuse qu’une fois que tu auras confirmé la bonne réception du colis.</p>
       <p>La vendeuse a été prévenue et prépare ton colis.</p>`,
      { label: 'Suivre ma commande', url: p.orderUrl },
    ),

  orderPaidSeller: (p: {
    prenom: string;
    reference: string;
    title: string;
    payoutCents: number;
    orderUrl: string;
  }) =>
    mail(
      `Ton article « ${p.title} » est vendu !`,
      'Tu as une vente',
      `<p>Félicitations ${p.prenom} ! Ton article <strong>« ${p.title} »</strong> vient d’être acheté.</p>
       <p>Référence : <strong>${p.reference}</strong><br>Tu recevras <strong>${formatPrice(
         p.payoutCents,
       )}</strong> dès que l’acheteuse aura confirmé la réception du colis.</p>
       <p><strong>À faire maintenant :</strong> télécharge le bordereau d’envoi depuis ta commande, imprime-le, colle-le sur le colis et poste-le. Indique ensuite « Colis expédié » sur le site.</p>`,
      { label: 'Télécharger mon bordereau', url: p.orderUrl },
    ),

  orderShipped: (p: { prenom: string; reference: string; title: string; orderUrl: string }) =>
    mail(
      `Commande ${p.reference} expédiée`,
      'Ton colis est en route',
      `<p>Bonne nouvelle ${p.prenom} : la vendeuse a expédié ton article <strong>« ${p.title} »</strong>.</p>
       <p>Dès réception, pense à <strong>confirmer la bonne réception</strong> sur le site : c’est cette confirmation qui libère le paiement en faveur de la vendeuse.</p>
       <p>Si l’article est endommagé ou non conforme, ouvre une demande de retour depuis la même page.</p>`,
      { label: 'Confirmer la réception', url: p.orderUrl },
    ),

  /**
   * Réception confirmée par l'acheteuse. Le reversement n'est pas encore parti :
   * c'est l'administratrice qui le déclenche après vérification. Ce message ne
   * doit donc rien annoncer qui ne soit pas déjà fait.
   */
  orderReceivedSeller: (p: { prenom: string; reference: string; payoutCents: number }) =>
    mail(
      `Réception confirmée — commande ${p.reference}`,
      'Ton acheteuse a bien reçu son colis',
      `<p>Bonne nouvelle ${p.prenom} : l’acheteuse a confirmé la réception de son colis et sa conformité.</p>
       <p>Ton reversement de <strong>${formatPrice(
         p.payoutCents,
       )}</strong> est en cours de validation par l’administratrice. Tu recevras un e-mail dès qu’il sera parti.</p>
       <p>Merci pour ta vente et à bientôt sur Nissa Dressing.</p>`,
    ),

  /**
   * Réception acquise faute de réponse. Le message doit être franc : la
   * fenêtre de réclamation se ferme, et l'acheteuse doit comprendre pourquoi.
   */
  receptionAutoConfirmed: (p: { prenom: string; reference: string; jours: number }) =>
    mail(
      `Réception acquise — commande ${p.reference}`,
      'Ta commande est considérée comme reçue',
      `<p>${p.prenom}, ta commande ${p.reference} a été expédiée il y a plus de ${p.jours} jours et nous n’avons pas eu de retour de ta part.</p>
       <p>Elle est donc considérée comme bien reçue et conforme : le paiement va être reversé à la vendeuse et il n’est plus possible d’ouvrir une demande de retour.</p>
       <p>Si quelque chose ne va pas malgré tout, écris-nous depuis le centre d’aide : nous regarderons ta situation.</p>`,
    ),

  /** Reversement effectivement transféré, après validation par l'administratrice. */
  payoutReleased: (p: { prenom: string; reference: string; payoutCents: number }) =>
    mail(
      `Paiement libéré — commande ${p.reference}`,
      'Ton paiement a été libéré',
      `<p>${p.prenom}, ton reversement pour la commande ${p.reference} vient d’être validé.</p>
       <p>Le montant de <strong>${formatPrice(
         p.payoutCents,
       )}</strong> a été transféré vers ton compte Stripe. Le virement vers ton compte bancaire suit le calendrier habituel de Stripe.</p>
       <p>Merci pour ta vente et à bientôt sur Nissa Dressing.</p>`,
    ),

  // ————— Retours & remboursements (CDC §3.7) —————

  returnRequested: (p: { prenom: string; reference: string }) =>
    mail(
      `Demande de retour — commande ${p.reference}`,
      'Ta demande a bien été reçue',
      `<p>Bonjour ${p.prenom},</p>
       <p>Ta demande de retour concernant la commande <strong>${p.reference}</strong> a bien été transmise à l’administratrice.</p>
       <p>Elle sera examinée avec attention, photos à l’appui. Tu recevras une réponse par e-mail.</p>`,
    ),

  /** Message d'excuse type imposé par le CDC §3.7. */
  returnAccepted: (p: { prenom: string; reference: string; returnSlipUrl: string }) =>
    mail(
      `Retour accepté — commande ${p.reference}`,
      'Nous sommes navrées d’apprendre…',
      `<p>Nous sommes navrées d’apprendre que l’article reçu ne correspond pas à ce que tu attendais. Nous te prions de bien vouloir nous en excuser.</p>
       <p>Ta demande de retour a été <strong>acceptée</strong>. Tu trouveras ci-dessous ton bordereau de retour : imprime-le, colle-le sur le colis et dépose-le au point d’envoi.</p>
       <p>Dès que le retour sera confirmé, tu seras remboursée via Stripe sur le moyen de paiement utilisé lors de la commande.</p>`,
      { label: 'Télécharger mon bordereau de retour', url: p.returnSlipUrl },
    ),

  returnRejected: (p: { prenom: string; reference: string; note?: string | null }) =>
    mail(
      `Suite à ta demande de retour — commande ${p.reference}`,
      'Ta demande de retour',
      `<p>Bonjour ${p.prenom},</p>
       <p>Après examen, ta demande de retour concernant la commande <strong>${p.reference}</strong> n’a pas pu être acceptée.</p>
       ${p.note ? `<p><strong>Motif :</strong> ${p.note}</p>` : ''}
       <p>Si tu penses qu’il s’agit d’une erreur, tu peux nous écrire depuis la page d’aide.</p>`,
    ),

  refundIssued: (p: { prenom: string; reference: string; amountCents: number }) =>
    mail(
      `Remboursement effectué — commande ${p.reference}`,
      'Tu as été remboursée',
      `<p>Bonjour ${p.prenom},</p>
       <p>Le remboursement de <strong>${formatPrice(
         p.amountCents,
       )}</strong> pour la commande <strong>${p.reference}</strong> a été effectué via Stripe.</p>
       <p>Selon ta banque, le montant peut mettre 5 à 10 jours ouvrés à apparaître sur ton compte.</p>
       <p>Encore toutes nos excuses pour ce désagrément.</p>`,
    ),

  // ————— Divers —————

  passwordReset: (p: { prenom: string; resetUrl: string }) =>
    mail(
      'Réinitialisation de ton mot de passe',
      'Mot de passe oublié',
      `<p>Bonjour ${p.prenom},</p>
       <p>Tu as demandé à réinitialiser ton mot de passe. Ce lien est valable <strong>1 heure</strong>.</p>
       <p>Si tu n’es pas à l’origine de cette demande, ignore simplement cet e-mail : ton mot de passe reste inchangé.</p>`,
      { label: 'Choisir un nouveau mot de passe', url: p.resetUrl },
    ),

  boostActivated: (p: { prenom: string; title: string; until: string }) =>
    mail(
      'Ton annonce est mise en avant',
      'Boost activé',
      `<p>Merci ${p.prenom} ! Ton annonce <strong>« ${p.title} »</strong> apparaît désormais en tête des résultats de recherche.</p>
       <p>Mise en avant active jusqu’au <strong>${p.until}</strong>.</p>`,
    ),

  /** Formulaire de contact de la page d'aide — transmis à l'administratrice (CDC §3.8). */
  contactToAdmin: (p: { email: string; pseudo: string; message: string }) =>
    mail(
      `[Aide] Nouveau message de ${p.pseudo}`,
      'Nouvelle demande de support',
      `<p><strong>Pseudo / kunya :</strong> ${p.pseudo}<br>
          <strong>E-mail :</strong> ${p.email}</p>
       <p><strong>Message :</strong></p>
       <p style="white-space:pre-wrap;background:#F6F1E8;padding:16px;border-radius:3px;">${p.message}</p>`,
    ),

  newApplicationToAdmin: (p: { pseudo: string; adminUrl: string }) =>
    mail(
      `[Modération] Nouvelle candidature de ${p.pseudo}`,
      'Une candidature attend ta validation',
      `<p><strong>${p.pseudo}</strong> vient de déposer une demande d’inscription, accompagnée de son audio de serment.</p>`,
      { label: 'Ouvrir la file de validation', url: p.adminUrl },
    ),

  newListingToAdmin: (p: { pseudo: string; title: string; adminUrl: string }) =>
    mail(
      `[Modération] Nouvelle annonce de ${p.pseudo}`,
      'Une annonce attend ta modération',
      `<p><strong>${p.pseudo}</strong> vient de déposer l’annonce <strong>« ${p.title} »</strong>.</p>`,
      { label: 'Ouvrir la file de modération', url: p.adminUrl },
    ),

  newReturnToAdmin: (p: { pseudo: string; reference: string; adminUrl: string }) =>
    mail(
      `[Litige] Demande de retour ${p.reference}`,
      'Une demande de retour attend ton examen',
      `<p><strong>${p.pseudo}</strong> a ouvert une demande de retour sur la commande <strong>${p.reference}</strong>.</p>`,
      { label: 'Ouvrir le litige', url: p.adminUrl },
    ),
};

export type MailTemplate = keyof typeof templates;
