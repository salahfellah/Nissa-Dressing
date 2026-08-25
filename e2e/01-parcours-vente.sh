#!/usr/bin/env bash
# Scénario principal : de l'inscription d'une candidate au remboursement.
#
# C'est le parcours décrit par le CDC §3.1 à §3.7, joué en entier contre l'API
# réelle. Rejouable : le script crée ses propres données et raisonne en écarts,
# jamais en valeurs absolues, pour ne pas dépendre de l'état laissé par un run
# précédent.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
require_api

STAMP=$(date +%s)

step "1. Connexions"
R=$(login admin "admin@nissa-dressing.fr" "Admin1234")
[ "$(echo "$R" | get role)" = "ADMIN" ] && ok "administratrice connectée" || fail "admin: $R"
R=$(login buyer "amina@exemple.fr" "Soeur1234")
[ "$(echo "$R" | get status)" = "MEMBER" ] && ok "acheteuse connectée" || fail "acheteuse: $R"

step "2. Le back-office est fermé aux membres"
C=$(code -b "$(jar buyer)" "$API/admin/stats")
[ "$C" = "403" ] && ok "membre refusée sur /admin/stats (403)" || fail "attendu 403, reçu $C"

step "3. Inscription : formulaire multipart + audio de serment (CDC 3.1)"
printf 'faux-audio-de-serment' > "$JARS/serment.webm"
R=$(curl -s -X POST "$API/auth/signup" \
      -F "prenom=Nour" -F "nom=T." -F "pseudo=nour$STAMP" \
      -F "email=nour$STAMP@exemple.fr" -F "password=Soeur1234" \
      -F "isVeiled=true" -F "acceptsTerms=true" \
      -F "audio=@$JARS/serment.webm;type=audio/webm")
echo "$R" | grep -q "transmise" && ok "candidature déposée avec son audio" || fail "signup: $R"

R=$(login cand "nour$STAMP@exemple.fr" "Soeur1234")
[ "$(echo "$R" | get status)" = "PENDING_REVIEW" ] && ok "statut PENDING_REVIEW" || fail "statut: $R"
C=$(code -b "$(jar cand)" "$API/listings/mine")
[ "$C" = "403" ] && ok "candidate non validée refusée sur une route membre" || fail "attendu 403, reçu $C"

R=$(curl -s -X POST "$API/auth/signup" \
      -F "prenom=Doublon" -F "nom=T." -F "pseudo=autre$STAMP" \
      -F "email=nour$STAMP@exemple.fr" -F "password=Soeur1234" \
      -F "isVeiled=true" -F "acceptsTerms=true" \
      -F "audio=@$JARS/serment.webm;type=audio/webm")
echo "$R" | grep -q "déjà utilisée" && ok "e-mail déjà inscrit refusé" || fail "doublon: $R"

step "3b. Validation de la candidature"
APP_ID=$(as admin "$API/admin/applications" | evaljs "(d.find(a=>a.pseudo==='nour$STAMP')||{}).id||''")
[ -n "$APP_ID" ] && ok "candidature retrouvée dans la file" || fail "candidature absente de la file"
R=$(as admin -X POST "$API/admin/applications/$APP_ID/review" -H 'Content-Type: application/json' -d '{"accepted":true}')
echo "$R" | grep -q "accept" && ok "candidature acceptée, e-mail de paiement envoyé" || fail "review: $R"

step "3c. Frais d'accès de 5 EUR (CDC 3.1)"
R=$(as cand -X POST "$API/account/access-fee/checkout")
echo "$R" | grep -q "paiement-simule" && ok "lien de paiement généré" || fail "checkout: $R"
CAND_ID=$(as cand "$API/auth/me" | get id)
R=$(as cand -X POST "$API/payments/simulate/confirm" -H 'Content-Type: application/json' -d "{\"intent\":\"acces\",\"ref\":\"$CAND_ID\"}")
echo "$R" | grep -q "accept" && ok "paiement confirmé" || fail "paiement: $R"
ME=$(as cand "$API/auth/me")
[ "$(echo "$ME" | get hasPaidAccessFee)" = "true" ] && ok "accès à vie acquis" || fail "accès: $ME"
[ -n "$(echo "$ME" | get freeBoostUntil)" ] && ok "mois de boost offert crédité" || fail "boost offert absent"

step "4. Dépôt d'annonce : upload photo puis création (CDC 3.3)"
login vend "safiya@exemple.fr" "Soeur1234" > /dev/null
node "$(dirname "${BASH_SOURCE[0]}")/fixtures/make-png.mjs" "$JARS/photo.png"

UP=$(as vend -X POST "$API/uploads/photos" -F "files=@$JARS/photo.png;type=image/png")
PHOTO=$(echo "$UP" | get 0.path)
case "$PHOTO" in
  photos/*.webp) ok "photo téléversée et réencodée en WebP (EXIF supprimés)" ;;
  *) fail "upload: $UP" ;;
esac

R=$(as vend -X POST "$API/listings" -H 'Content-Type: application/json' -d "{
  \"title\":\"Khimar de test $STAMP\",\"categoryId\":\"femme\",\"subcategoryId\":\"femme-khimar\",
  \"size\":\"Taille unique\",\"material\":\"Soie\",\"color\":\"Beige\",\"condition\":\"NEUF\",\"brand\":null,
  \"priceCents\":2200,\"photos\":[\"$PHOTO\"],\"packageFormat\":\"PETIT\",
  \"description\":\"Khimar deux voiles depose par le test de bout en bout.\"}")
LID=$(echo "$R" | get id)
[ "$(echo "$R" | get status)" = "PENDING_REVIEW" ] && ok "annonce créée en attente de modération" || fail "création: $R"
[ "$(curl -s "$API/listings?perPage=60" | evaljs "d.items.some(i=>i.id==='$LID')")" = "false" ] \
  && ok "invisible au catalogue avant validation" || fail "annonce publiée sans modération"

step "4b. Règles de conformité (CDC 3.4)"
R=$(as vend -X POST "$API/listings" -H 'Content-Type: application/json' -d "{
  \"title\":\"Chaussettes usagees\",\"categoryId\":\"accessoires\",\"subcategoryId\":\"acc-chaussettes\",
  \"size\":\"38\",\"material\":\"Coton\",\"color\":\"Noir\",\"condition\":\"BON_ETAT\",\"brand\":null,
  \"priceCents\":500,\"photos\":[\"$PHOTO\"],\"packageFormat\":\"PETIT\",
  \"description\":\"Doit etre refuse : categorie neuf uniquement.\"}")
echo "$R" | grep -q "neufs" && ok "chaussettes non neuves refusées" || fail "règle neuf: $R"

R=$(as vend -X POST "$API/listings" -H 'Content-Type: application/json' -d "{
  \"title\":\"Paire incoherente\",\"categoryId\":\"femme\",\"subcategoryId\":\"eg-qamis\",
  \"size\":\"Taille unique\",\"material\":\"Coton\",\"color\":\"Noir\",\"condition\":\"NEUF\",\"brand\":null,
  \"priceCents\":500,\"photos\":[\"$PHOTO\"],\"packageFormat\":\"PETIT\",
  \"description\":\"Sous-categorie etrangere a la categorie choisie.\"}")
[ "$(echo "$R" | champ_en_erreur subcategoryId)" = "true" ]   && ok "sous-catégorie étrangère à la catégorie refusée" || fail "paire: $R"

R=$(as vend -X POST "$API/listings" -H 'Content-Type: application/json' -d "{
  \"title\":\"Taille hors referentiel\",\"categoryId\":\"femme\",\"subcategoryId\":\"femme-abaya\",
  \"size\":\"XXXXL\",\"material\":\"Coton\",\"color\":\"Noir\",\"condition\":\"NEUF\",\"brand\":null,
  \"priceCents\":500,\"photos\":[\"$PHOTO\"],\"packageFormat\":\"PETIT\",
  \"description\":\"Taille absente du referentiel de la categorie.\"}")
echo "$R" | grep -q "référentiel" && ok "taille hors référentiel refusée" || fail "taille: $R"

step "4c. Modération (CDC 3.9)"
R=$(as admin -X POST "$API/admin/listings/$LID/review" -H 'Content-Type: application/json' -d '{"accepted":true}')
echo "$R" | grep -q "publi" && ok "annonce publiée" || fail "review: $R"
[ "$(curl -s "$API/listings?perPage=60" | evaljs "d.items.some(i=>i.id==='$LID')")" = "true" ] \
  && ok "visible au catalogue après validation" || fail "toujours invisible"

step "5. Catalogue : annonces boostées en tête (CDC 3.5)"
[ "$(curl -s "$API/listings?perPage=5" | get items.0.isBoosted)" = "true" ] \
  && ok "la première annonce est boostée" || fail "tri boost incorrect"

step "6. Favoris (CDC 3.5)"
R=$(as buyer -X POST "$API/favorites/$LID")
[ "$(echo "$R" | get isFavorite)" = "true" ] && ok "favori ajouté" || fail "favori: $R"
[ "$(as buyer "$API/listings?perPage=60" | evaljs "d.items.find(i=>i.id==='$LID').isFavorite")" = "true" ] \
  && ok "marqué dans le catalogue pour la membre connectée" || fail "non marqué au catalogue"
[ -z "$(curl -s "$API/listings?perPage=60" | evaljs "d.items.find(i=>i.id==='$LID').isFavorite ?? ''")" ] \
  && ok "aucun favori exposé à une visiteuse anonyme" || fail "favori exposé publiquement"
R=$(as buyer -X POST "$API/favorites/$LID")
[ "$(echo "$R" | get isFavorite)" = "false" ] && ok "bascule du favori" || fail "bascule: $R"
as buyer -X POST "$API/favorites/$LID" > /dev/null

step "7. Commande (CDC 3.6)"
login seller "safiya@exemple.fr" "Soeur1234" > /dev/null

# L'adresse est reprise telle quelle depuis /auth/me, comme le fait le front au
# moment de commander — et non réécrite à la main. Une adresse fabriquée omet les
# champs nuls (`line2`, `phone`) et masquerait un schéma incapable d'accepter sa
# propre sortie.
ADRESSE=$(as buyer "$API/auth/me" | evaljs "JSON.stringify(d.address)")
[ "$ADRESSE" != "null" ] && ok "adresse de livraison reprise du profil" || fail "profil sans adresse"

R=$(as buyer -X POST "$API/orders" -H 'Content-Type: application/json' -d "{
  \"listingId\":\"$LID\",
  \"shippingAddress\":$ADRESSE}")
OID=$(echo "$R" | get order.id)
TOTAL=$(echo "$R" | get order.price.totalCents)
COMM=$(echo "$R" | get order.price.commissionCents)
PAYOUT=$(echo "$R" | get order.price.sellerPayoutCents)
[ -n "$OID" ] && ok "commande $(echo "$R" | get order.reference) créée" || fail "commande: $R"
[ "$TOTAL" = "2910" ] && ok "total 2910c = 2200 article + 490 port + 220 commission" || fail "total: $TOTAL"
[ "$PAYOUT" = "2200" ] && ok "reversement vendeuse = prix de l'article" || fail "reversement: $PAYOUT"

ADRESSE_VENDEUSE=$(as seller "$API/auth/me" | evaljs "JSON.stringify(d.address)")
R=$(as seller -X POST "$API/orders" -H 'Content-Type: application/json' -d "{
  \"listingId\":\"$LID\",
  \"shippingAddress\":$ADRESSE_VENDEUSE}")
echo "$R" | grep -qE "propre article|autre s" && ok "achat de son propre article refusé" || fail "auto-achat: $R"

step "8. Paiement et mise sous séquestre"
ESCROW0=$(as admin "$API/admin/stats" | get escrowCents)
REVENUE0=$(as admin "$API/admin/stats" | get revenueCents)
R=$(as buyer -X POST "$API/payments/simulate/confirm" -H 'Content-Type: application/json' -d "{\"intent\":\"commande\",\"ref\":\"$OID\"}")
echo "$R" | grep -q "accept" && ok "paiement confirmé" || fail "paiement: $R"
[ "$(as buyer "$API/orders/$OID" | get status)" = "PAID" ] && ok "commande PAID" || fail "statut incorrect"
ESCROW1=$(as admin "$API/admin/stats" | get escrowCents)
[ "$(( ESCROW1 - ESCROW0 ))" = "$PAYOUT" ] && ok "séquestre +${PAYOUT}c" || fail "séquestre: $ESCROW0 -> $ESCROW1"
[ "$(curl -s "$API/listings?perPage=60" | evaljs "d.items.some(i=>i.id==='$LID')")" = "false" ] \
  && ok "annonce vendue retirée du catalogue" || fail "toujours au catalogue"

step "9. Bordereau d'envoi PDF (CDC 3.6)"
as seller -o "$JARS/bordereau.pdf" "$API/orders/$OID/bordereau" > /dev/null
[ "$(head -c 4 "$JARS/bordereau.pdf")" = "%PDF" ] \
  && ok "PDF généré ($(wc -c < "$JARS/bordereau.pdf") octets)" || fail "PDF invalide"
C=$(code -b "$(jar buyer)" "$API/orders/$OID/bordereau")
[ "$C" = "403" ] && ok "bordereau refusé à l'acheteuse" || fail "attendu 403, reçu $C"

step "10. Expédition et messagerie"
R=$(as seller -X POST "$API/orders/$OID/expedie")
[ "$(echo "$R" | get status)" = "SHIPPED" ] && ok "commande SHIPPED" || fail "expedie: $R"
UNREAD0=$(as seller "$API/messages/unread-count" | get count)
R=$(as buyer -X POST "$API/messages/$OID" -H 'Content-Type: application/json' -d '{"body":"Salam, merci pour envoi rapide"}')
[ -n "$(echo "$R" | get id)" ] && ok "message envoyé" || fail "message: $R"
UNREAD1=$(as seller "$API/messages/unread-count" | get count)
[ "$(( UNREAD1 - UNREAD0 ))" = "1" ] && ok "vendeuse : +1 non lu" || fail "non lus $UNREAD0 -> $UNREAD1"
C=$(code -b "$(jar cand)" "$API/messages/$OID")
[ "$C" = "403" ] && ok "conversation fermée aux tiers" || fail "attendu 403, reçu $C"

step "11. Confirmation de réception : libération du séquestre"
C=$(code -b "$(jar seller)" -X POST "$API/orders/$OID/reception")
[ "$C" = "403" ] && ok "la vendeuse ne peut pas confirmer à la place de l'acheteuse" || fail "attendu 403, reçu $C"
R=$(as buyer -X POST "$API/orders/$OID/reception")
[ "$(echo "$R" | get status)" = "RECEIVED" ] && ok "commande RECEIVED" || fail "reception: $R"
ESCROW2=$(as admin "$API/admin/stats" | get escrowCents)
REVENUE1=$(as admin "$API/admin/stats" | get revenueCents)
[ "$(( ESCROW1 - ESCROW2 ))" = "$PAYOUT" ] && ok "séquestre libéré (-${PAYOUT}c)" || fail "séquestre: $ESCROW1 -> $ESCROW2"
[ "$(( REVENUE1 - REVENUE0 ))" = "$COMM" ] && ok "commission encaissée +${COMM}c" || fail "revenu: $REVENUE0 -> $REVENUE1"

step "12. Identifiants Stripe distincts"
# La charge (ch_) et le PaymentIntent (pi_) ne sont pas interchangeables :
# le transfert s'appuie sur la première, le remboursement sur le second.
IDS=$(as admin "$API/admin/orders" | evaljs "d.length")
[ -n "$IDS" ] && ok "commandes visibles en back-office ($IDS)" || fail "liste admin vide"

step "13. Retour et remboursement (CDC 3.7)"
R=$(as buyer -X POST "$API/returns/order/$OID" -H 'Content-Type: application/json' -d "{
  \"reason\":\"NOT_AS_DESCRIBED\",\"description\":\"Le tissu est plus transparent que sur la photo.\",
  \"photos\":[\"$PHOTO\"]}")
RID=$(echo "$R" | get id)
[ -n "$RID" ] && ok "demande de retour ouverte" || fail "retour: $R"
R=$(as admin -X POST "$API/admin/returns/$RID/review" -H 'Content-Type: application/json' -d '{"accepted":true}')
[ "$(echo "$R" | get status)" = "ACCEPTED" ] && ok "retour accepté (message d'excuse type envoyé)" || fail "review retour: $R"
as buyer -o "$JARS/retour.pdf" "$API/returns/$RID/bordereau" > /dev/null
[ "$(head -c 4 "$JARS/retour.pdf")" = "%PDF" ] && ok "bordereau de retour généré" || fail "PDF retour invalide"
R=$(as admin -X POST "$API/admin/returns/$RID/refund")
[ "$(echo "$R" | get status)" = "REFUNDED" ] && ok "remboursement effectué" || fail "remboursement: $R"
[ "$(as buyer "$API/orders/$OID" | get status)" = "REFUNDED" ] && ok "commande REFUNDED" || fail "statut commande"

step "14. Validation des entrées"
R=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"email":"pas-un-email","password":"x"}')
[ "$(echo "$R" | champ_en_erreur email)" = "true" ] && ok "e-mail malformé rejeté" || fail "validation: $R"
R=$(as vend -X POST "$API/listings" -H 'Content-Type: application/json' -d '{"title":"x"}')
echo "$R" | grep -q "fieldErrors" && ok "erreurs par champ renvoyées au front" || fail "fieldErrors: $R"

step "15. Journal des e-mails"
ERRORS=$(as admin "$API/admin/emails" | evaljs "d.filter(e=>e.error).length")
COUNT=$(as admin "$API/admin/emails" | evaljs "d.length")
[ "$ERRORS" = "0" ] && ok "$COUNT e-mails journalisés, aucun en échec" || fail "$ERRORS e-mails en échec"

summary
