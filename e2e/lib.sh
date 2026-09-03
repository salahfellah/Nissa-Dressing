#!/usr/bin/env bash
# Fonctions communes aux scénarios de bout en bout.
#
# Les tests attaquent l'API par HTTP, comme le ferait le navigateur : ils ne
# connaissent ni Prisma ni les services internes. Ils vérifient donc le contrat
# réellement exposé, y compris les codes d'erreur et les règles d'accès.

API="${API_URL:-http://localhost:4000/api}"
MAILPIT="${MAILPIT_URL:-http://localhost:8025}"
JARS="$(dirname "${BASH_SOURCE[0]}")/.jars"
mkdir -p "$JARS"

# Le compte administratrice est celui que `db:seed` a créé, donc celui du .env
# de l'API. Le figer ici condamnerait la suite dès qu'une installation choisit
# d'autres identifiants — ce qui est le cas de tout poste réel.
ENV_API="$(dirname "${BASH_SOURCE[0]}")/../backend/.env"
lire_env() {
  [ -f "$ENV_API" ] || return 0
  sed -n "s/^$1=//p" "$ENV_API" | head -1 | sed 's/^"//; s/"$//'
}
ADMIN_EMAIL="${ADMIN_EMAIL:-$(lire_env ADMIN_EMAIL)}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@nissa-dressing.fr}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(lire_env ADMIN_PASSWORD)}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin1234}"

FAILED=0
PASSED=0

ok()   { PASSED=$((PASSED + 1)); echo "  OK   $*"; }
fail() { FAILED=$((FAILED + 1)); echo "  FAIL $*"; }
step() { echo; echo "== $* =="; }

# Extrait une valeur d'une réponse JSON : get "a.b.0.c"
get() {
  node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const o=JSON.parse(s);const v=process.argv[1].split('.').reduce((a,k)=>a==null?a:a[/^[0-9]+\$/.test(k)?+k:k],o);console.log(v===undefined||v===null?'':v)}catch(e){console.log('')}})" "$1"
}

# Évalue une expression JavaScript sur la réponse JSON, liée à `d`.
evaljs() { node -e "let s='';process.stdin.on('data',x=>s+=x).on('end',()=>{try{const d=JSON.parse(s);console.log(eval(process.argv[1]))}catch(e){console.log('erreur')}})" "$1"; }

# Vrai si la réponse porte une erreur sur ce champ. On teste le nom du champ,
# pas la phrase : la formulation des messages évolue (ton du site), la structure
# du contrat non.
champ_en_erreur() { evaljs "!!(d.fieldErrors && d.fieldErrors['$1'])"; }

jar()   { echo "$JARS/$1.jar"; }
login() { curl -s -c "$(jar "$1")" -X POST "$API/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$2\",\"password\":\"$3\"}"; }
as()    { local who="$1"; shift; curl -s -b "$(jar "$who")" "$@"; }
code()  { curl -s -o /dev/null -w '%{http_code}' "$@"; }

# Attend que l'API réponde avant de lancer un scénario.
require_api() {
  if ! curl -s -o /dev/null --max-time 5 "$API/settings/public"; then
    echo "L'API ne répond pas sur $API."
    echo "Démarre la pile : npm run db:up && npm run dev:api"
    exit 2
  fi
}

# Résout l'adresse e-mail de démonstration correspondant à un pseudo vendeur.
email_for_pseudo() {
  case "$1" in
    amina.dressing) echo "amina@exemple.fr" ;;
    oum.khadija)    echo "khadija@exemple.fr" ;;
    safiya.store)   echo "safiya@exemple.fr" ;;
    *)              echo "" ;;
  esac
}

summary() {
  echo
  echo "----------------------------------------"
  if [ "$FAILED" = "0" ]; then
    echo "  $PASSED vérifications, aucune erreur"
  else
    echo "  $PASSED réussies, $FAILED échec(s)"
  fi
  echo "----------------------------------------"
  exit $((FAILED > 0 ? 1 : 0))
}

# Crée une annonce publiée et renvoie son identifiant.
#
# Les scénarios qui consomment des annonces (vente, retrait du catalogue) doivent
# créer les leurs : s'appuyer sur le jeu de démonstration l'épuise au fil des
# exécutions et rend la suite non rejouable.
#   create_published_listing <jar_vendeuse> <jar_admin> <titre>
create_published_listing() {
  local seller_jar="$1" admin_jar="$2" title="$3"

  node "$(dirname "${BASH_SOURCE[0]}")/fixtures/make-png.mjs" "$JARS/fixture.png" >/dev/null 2>&1
  local photo
  photo=$(curl -s -b "$(jar "$seller_jar")" -X POST "$API/uploads/photos" \
    -F "files=@$JARS/fixture.png;type=image/png" | get 0.path)
  [ -n "$photo" ] || { echo ""; return 1; }

  local id
  id=$(curl -s -b "$(jar "$seller_jar")" -X POST "$API/listings" \
    -H 'Content-Type: application/json' -d "{
      \"title\":\"$title\",\"categoryId\":\"femme\",\"subcategoryId\":\"femme-abaya\",
      \"size\":\"M (40)\",\"material\":\"Nidha\",\"color\":\"Noir\",\"condition\":\"NEUF\",\"brand\":null,
      \"priceCents\":3300,\"photos\":[\"$photo\"],\"packageFormat\":\"MOYEN\",
      \"description\":\"Annonce creee par la suite de tests de bout en bout.\"}" | get id)
  [ -n "$id" ] || { echo ""; return 1; }

  curl -s -b "$(jar "$admin_jar")" -X POST "$API/admin/listings/$id/review" \
    -H 'Content-Type: application/json' -d '{"accepted":true}' >/dev/null

  echo "$id"
}

# Supprime les annonces créées par un scénario.
#
# Sans ce ménage, chaque exécution laisse une « Abaya de test » dans le
# catalogue : au bout de quelques passages, le jeu de démonstration est noyé et
# la page d'accueil devient impossible à montrer à la cliente.
#   nettoyer_annonces <jar_vendeuse> <id> [id...]
nettoyer_annonces() {
  local jar_vendeuse="$1"
  shift
  for id in "$@"; do
    [ -n "$id" ] && curl -s -b "$(jar "$jar_vendeuse")" -X DELETE "$API/listings/$id" >/dev/null
  done
}
