#!/usr/bin/env bash
# Lance tous les scénarios de bout en bout.
#
#   npm run test:e2e
#
# Prérequis : la pile doit tourner (npm run db:up && npm run dev:api).
set -uo pipefail
cd "$(dirname "$0")"

TOTAL=0
for scenario in [0-9]*.sh; do
  echo
  echo "########################################"
  echo "#  $scenario"
  echo "########################################"
  bash "$scenario" || TOTAL=$((TOTAL + 1))
done

# Les scénarios créent comptes, annonces et commandes pour rester rejouables.
# On efface ces traces : sans quoi la file de validation et les compteurs du
# back-office finissent par décrire des données de test plutôt que la vitrine.
echo
echo "########################################"
echo "#  Ménage"
echo "########################################"
npm --prefix ../backend run db:clean --silent 2>/dev/null || npm --prefix "$(dirname "$0")/../backend" run db:clean --silent

echo
if [ "$TOTAL" = "0" ]; then
  echo "Tous les scénarios sont passés."
else
  echo "$TOTAL scénario(s) en échec."
fi
exit $((TOTAL > 0 ? 1 : 0))
