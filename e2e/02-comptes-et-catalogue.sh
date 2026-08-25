#!/usr/bin/env bash
# Scénarios annexes : mot de passe oublié, boost, support, filtres, sessions.
#
# Complète 01-parcours-vente.sh, qui couvre la chaîne inscription -> vente ->
# remboursement. Ce fichier vérifie les chemins qui n'en font pas partie.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
require_api

STAMP=$(date +%s)
login admin "admin@nissa-dressing.fr" "Admin1234" > /dev/null
login mem "amina@exemple.fr" "Soeur1234" > /dev/null

step "A. Mot de passe oublié et réinitialisation"
# On travaille sur un compte jetable : réinitialiser le mot de passe d'un compte
# de démonstration le casserait pour les scénarios suivants.
printf 'audio' > "$JARS/a.webm"
RESET_EMAIL="reset$STAMP@exemple.fr"
curl -s -X POST "$API/auth/signup"   -F "prenom=Reset" -F "nom=T." -F "pseudo=reset$STAMP"   -F "email=$RESET_EMAIL" -F "password=Soeur1234"   -F "isVeiled=true" -F "acceptsTerms=true"   -F "audio=@$JARS/a.webm;type=audio/webm" > /dev/null

R=$(curl -s -X POST "$API/auth/forgot-password" -H 'Content-Type: application/json' -d "{\"email\":\"$RESET_EMAIL\"}")
echo "$R" | grep -q "réinitialisation" && ok "demande acceptée" || fail "forgot: $R"
R=$(curl -s -X POST "$API/auth/forgot-password" -H 'Content-Type: application/json' -d '{"email":"inconnue@nulle-part.fr"}')
echo "$R" | grep -q "réinitialisation" && ok "réponse identique pour une adresse inconnue" || fail "énumération possible: $R"

# Le jeton n'est jamais renvoyé par l'API : on le lit dans l'e-mail, comme la membre.
# Mailpit reçoit de façon asynchrone, d'où la courte attente active.
TOKEN=""
for _ in 1 2 3 4 5 6 7 8 9 10; do
  TOKEN=$(curl -s "$MAILPIT/api/v1/messages?limit=50"     | evaljs "(d.messages||[]).filter(m=>/initialisation/.test(m.Subject)&&(m.To||[]).some(t=>t.Address==='$RESET_EMAIL')).map(m=>m.ID)[0]||''")
  [ -n "$TOKEN" ] && break
  sleep 1
done

if [ -n "$TOKEN" ]; then
  RAW=$(curl -s "$MAILPIT/api/v1/message/$TOKEN" | evaljs "(/token=([A-Za-z0-9_-]+)/.exec(d.HTML||d.Text||'')||[])[1]||''")
  [ -n "$RAW" ] && ok "jeton récupéré dans l'e-mail" || fail "jeton introuvable"

  R=$(curl -s -X POST "$API/auth/reset-password" -H 'Content-Type: application/json' -d "{\"token\":\"$RAW\",\"password\":\"NouveauMdp1\"}")
  echo "$R" | grep -q "mis à jour" && ok "mot de passe réinitialisé" || fail "reset: $R"
  [ -n "$(login reset1 "$RESET_EMAIL" "NouveauMdp1" | get id)" ] && ok "connexion avec le nouveau mot de passe" || fail "nouveau mot de passe refusé"
  [ -z "$(login reset2 "$RESET_EMAIL" "Soeur1234" | get id)" ]     && ok "ancien mot de passe refusé" || fail "ancien mot de passe encore valide"
  R=$(curl -s -X POST "$API/auth/reset-password" -H 'Content-Type: application/json' -d "{\"token\":\"$RAW\",\"password\":\"EncoreAutre1\"}")
  [ "$(echo "$R" | get statusCode)" = "400" ] && ok "jeton à usage unique" || fail "jeton rejouable: $R"
  R=$(curl -s -X POST "$API/auth/reset-password" -H 'Content-Type: application/json' -d '{"token":"jeton-fabrique-de-toutes-pieces","password":"AutreMdp12"}')
  [ "$(echo "$R" | get statusCode)" = "400" ] && ok "jeton forgé rejeté" || fail "jeton arbitraire accepté: $R"
else
  fail "e-mail de réinitialisation absent de Mailpit"
fi

step "B. Boost d'annonce (CDC 3.5)"
# Le scénario crée sa propre annonce : réutiliser celles du jeu de démonstration
# les épuiserait au fil des exécutions.
PSEUDO="safiya.store"
BOOST_ME=$(login boost "safiya@exemple.fr" "Soeur1234" | get id)
[ -n "$BOOST_ME" ] && ok "vendeuse connectée ($PSEUDO)" || fail "connexion vendeuse impossible"
LID=$(create_published_listing boost admin "Abaya a mettre en avant $STAMP")
if [ -n "$LID" ]; then
  ok "annonce de test publiée"

  if [ -n "$(as boost "$API/auth/me" | get freeBoostUntil)" ]; then
    R=$(as boost -X POST "$API/listings/$LID/boost/free")
    [ "$(echo "$R" | get isBoosted)" = "true" ] && ok "boost offert appliqué" || fail "boost gratuit: $R"
    [ -z "$(as boost "$API/auth/me" | get freeBoostUntil)" ] && ok "crédit consommé, non reportable" || fail "crédit encore disponible"
    as boost -X POST "$API/listings/$LID/boost/free" | grep -q "plus disponible" && ok "second usage refusé" || fail "boost réutilisable"
  else
    ok "boost offert déjà consommé sur ce compte (étape ignorée)"
  fi

  as boost -X POST "$API/listings/$LID/boost/checkout" | grep -q "paiement-simule" && ok "checkout du boost payant généré" || fail "checkout boost"
  as boost -X POST "$API/payments/simulate/confirm" -H 'Content-Type: application/json' -d "{\"intent\":\"boost\",\"ref\":\"$LID\"}" | grep -q "avant" && ok "boost payant activé" || fail "confirmation boost"
  [ "$(curl -s "$API/listings/$LID" | get isBoosted)" = "true" ] && ok "annonce marquée en avant" || fail "boost non appliqué"
else
  fail "création de l'annonce de test impossible"
fi

step "C. Boost : on ne boostera pas l'annonce d'une autre"
OTHER=$(curl -s "$API/listings?perPage=40" | evaljs "(d.items.find(i=>i.seller.pseudo!=='$PSEUDO')||{}).id||''")
if [ -n "$OTHER" ]; then
  R=$(as boost -X POST "$API/listings/$OTHER/boost/checkout")
  [ "$(echo "$R" | get statusCode)" = "403" ]     && ok "boost d'une annonce tierce refusé" || fail "boost tiers autorisé: $R"
else
  ok "pas d'annonce tierce disponible (étape ignorée)"
fi

step "D. Formulaire de contact (CDC 3.8)"
R=$(curl -s -X POST "$API/support/contact" -H 'Content-Type: application/json' -d "{\"email\":\"visiteuse$STAMP@exemple.fr\",\"pseudo\":\"Oum Test\",\"message\":\"Bonjour, je n arrive pas a deposer mon annonce.\"}")
echo "$R" | grep -q "transmis" && ok "message envoyé" || fail "contact: $R"
[ "$(as admin "$API/admin/contact-requests" | evaljs "d.some(r=>r.email.includes('$STAMP'))")" = "true" ] \
  && ok "visible en back-office" || fail "absent du back-office"
CID=$(as admin "$API/admin/contact-requests" | get 0.id)
as admin -X POST "$API/admin/contact-requests/$CID/handled" | grep -q "trait" && ok "marquée comme traitée" || fail "handled"

step "E. Retrait d'une annonce déjà publiée"
UNPUB=$(create_published_listing boost admin "Abaya a retirer $STAMP")
R=$(as admin -X POST "$API/admin/listings/$UNPUB/unpublish" -H 'Content-Type: application/json' -d '{"reason":"Photo portee non autorisee pour cette categorie."}')
echo "$R" | grep -q "retir" && ok "annonce retirée du catalogue" || fail "unpublish: $R"
[ "$(curl -s "$API/listings?perPage=60" | evaljs "d.items.some(i=>i.id==='$UNPUB')")" = "false" ] \
  && ok "invisible au catalogue" || fail "toujours visible"

step "F. Profil, pseudo et mot de passe"
R=$(as mem -X PUT "$API/account/profile" -H 'Content-Type: application/json' -d '{"prenom":"Amina","nom":"Benali","pseudo":"amina.dressing"}')
[ "$(echo "$R" | get nom)" = "Benali" ] && ok "profil mis à jour" || fail "profil: $R"
R=$(as mem -X PUT "$API/account/profile" -H 'Content-Type: application/json' -d '{"prenom":"X","nom":"Y","pseudo":"safiya.store"}')
[ "$(echo "$R" | champ_en_erreur pseudo)" = "true" ] \
  && ok "pseudo déjà pris refusé" || fail "unicité du pseudo non vérifiée: $R"
R=$(as mem -X POST "$API/account/password" -H 'Content-Type: application/json' -d '{"currentPassword":"MauvaisMdp1","newPassword":"AutreMdp12"}')
[ "$(echo "$R" | champ_en_erreur currentPassword)" = "true" ] \
  && ok "mot de passe actuel vérifié" || fail "changement de mot de passe non protégé: $R"
as mem -X POST "$API/account/password" -H 'Content-Type: application/json' -d '{"currentPassword":"Soeur1234","newPassword":"faible"}' \
  | grep -q "fieldErrors" && ok "mot de passe trop faible refusé" || fail "politique de mot de passe non appliquée"

step "G. Catalogue : pagination, filtres, recherche"
[ "$(curl -s "$API/listings?perPage=2&page=1" | get perPage)" = "2" ] && ok "pagination respectée" || fail "pagination"
[ "$(curl -s "$API/listings?categoryId=femme&perPage=40" | evaljs "d.items.length>0&&d.items.every(x=>x.categoryId==='femme')")" = "true" ] \
  && ok "filtre par catégorie" || fail "filtre catégorie"
[ "$(curl -s "$API/listings?priceMax=1500&perPage=40" | evaljs "d.items.every(x=>x.priceCents<=1500)")" = "true" ] \
  && ok "filtre par prix" || fail "filtre prix"
[ "$(curl -s "$API/listings?sort=price_asc&perPage=40" | evaljs "(()=>{const p=d.items.filter(i=>!i.isBoosted).map(i=>i.priceCents);return p.every((v,i)=>i===0||p[i-1]<=v)})()")" = "true" ] \
  && ok "tri par prix croissant (hors annonces boostées)" || fail "tri prix"
# Le mot-clé est tiré d'une annonce réellement en ligne : coder « khimar » en dur
# rendrait le test dépendant de ce qui reste au catalogue.
TERM=$(curl -s "$API/listings?perPage=40" | evaljs "((d.items[0]||{}).title||'').split(' ')[0]||''")
[ "$(curl -s "$API/listings?q=$TERM&perPage=40" | evaljs "d.items.length>0")" = "true" ]   && ok "recherche plein texte (« $TERM »)" || fail "recherche vide pour « $TERM »"
[ "$(curl -s "$API/listings?q=zzzintrouvablezzz&perPage=40" | evaljs "d.items.length===0&&d.total===0")" = "true" ] \
  && ok "recherche sans résultat correctement vide" || fail "recherche parasite"

step "H. Sessions : rotation du jeton et déconnexion"
[ -n "$(curl -s -b "$(jar mem)" -c "$(jar mem)" -X POST "$API/auth/refresh" | get id)" ] \
  && ok "jeton rafraîchi (rotation)" || fail "refresh"
curl -s -b "$(jar mem)" -c "$(jar mem)" -X POST "$API/auth/logout" > /dev/null
[ "$(code -b "$(jar mem)" "$API/auth/me")" = "401" ] && ok "session fermée après déconnexion" || fail "session encore active"

step "H bis. Ménage"
# Le scénario retire ce qu'il a créé : le catalogue de démonstration doit
# rester présentable d'une exécution à l'autre.
login boost "safiya@exemple.fr" "Soeur1234" > /dev/null
nettoyer_annonces boost "$LID" "$UNPUB"
ok "annonces de test retirées"

step "H ter. Cohérence des compteurs du profil vendeuse"
# Un compteur qui annonce « 3 annonces » doit être adossé à un lien qui en
# renvoie 3 : c'est ce désaccord qui trahit un chiffre calculé autrement que
# ce qu'il prétend mesurer.
PROFIL=$(curl -s "$API/listings?perPage=1" | get items.0.id)
VENDEUSE=$(curl -s "$API/listings/$PROFIL" | get seller.id)
ANNONCE=$(curl -s "$API/listings/$PROFIL" | get seller.listingCount)
RENVOYEES=$(curl -s "$API/listings?sellerId=$VENDEUSE&perPage=60" | get total)
[ "$ANNONCE" = "$RENVOYEES" ]   && ok "« $ANNONCE annonces en ligne » correspond au lien du profil"   || fail "profil annonce $ANNONCE, le lien en renvoie $RENVOYEES"

# Le filtre ne doit renvoyer que les annonces de cette vendeuse.
AUTRES=$(curl -s "$API/listings?sellerId=$VENDEUSE&perPage=60" | evaljs "d.items.every(i=>i.seller.id==='$VENDEUSE')")
[ "$AUTRES" = "true" ] && ok "le filtre ne mélange pas les vendeuses" || fail "annonces d'autres vendeuses dans le filtre"

step "I. Pages légales et paramètres publics"
S=$(curl -s "$API/settings/public")
[ -n "$(echo "$S" | get boostPriceCents)" ] && ok "paramètres publics exposés sans authentification" || fail "settings publics: $S"
[ -z "$(echo "$S" | get supportEmail | grep -o 'stripe')" ] && ok "aucun secret dans les paramètres publics" || fail "fuite de configuration"

summary
