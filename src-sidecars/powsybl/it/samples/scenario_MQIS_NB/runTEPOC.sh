#! /bin/bash
MACHINE=$(uname -n)
DATA_DIR="$(realpath $(dirname $0))"
CONFIG=config.toml

# Configuration dépendant de la machine d'exécution du script
if [ "$MACHINE" == "gm0winl721.bureau.si.interne" ]; then
    ARGUS_REP=/home/brettevilleoli/Projects/Projets/argus
    TE_REP=/home/brettevilleoli/Projects/Projets/TwinEU/TwinEU-core
    MENV_DYNA_PATH=/home/brettevilleoli/Projets/Dynawo/dynawo-rte/myEnvDynawoRTE.sh
else
    echo "Editer le script pour prendre en compte cette machine \"$(uname -n)\""
    exit 1
fi

cd "$(realpath $(dirname $0))"
sed -i -e "s%^myEnvDynawo_path.*%myEnvDynawo_path = \"$MENV_DYNA_PATH\"%" $CONFIG

usage()
{
    echo "Usage: $0. Le répertoire courant doit contenir les données de la simulation et en particulier un fichier $CONFIG"
    exit 1
}

check_process()
{
    # $1 -> nom de l'exécutable
    # $2 -> nom parlant
    pidof $1 >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "Le processus \"$2\" ($1) est déjà lancé, abandon."
        exit 2
    fi
}

if [ ! -r $CONFIG ]; then
    usage
fi

if [ ! -r $TE_REP/venv ]; then
    echo "Environnement virtuel python non trouvé dans $TE_REP/venv"
    exit 3
fi

# Activation de l'environnement Python
. $TE_REP/venv/bin/activate

# Vérification de l'absence de processus d'une exécution précédente
check_process orchestrator_exec orchestrateur
check_process powsybl "sidecar powsybl"

# Lancement du serveur NATS
docker inspect nats-server >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Lancement du serveur NATS"
    docker run -d --rm --name nats-server -p 4222:4222 -p 8222:8222 -p 6222:6222 nats
    sleep 5
fi

# Lancement des différents processus
gnome-terminal --geometry 150x24+0-0 --window --title Orchestrator -e "sh -c \"read dummy; orchestrator_exec $CONFIG 2>&1 | tee orchestrator.log\"" \
    --tab --title "Game master RV" --command "sh -c \"cd $ARGUS_REP; pnpm tauri dev >argus.log 2>&1\"" \
    --tab --title SCADA -e "sh -c \"python3 $TE_REP/src/features/orchestrator/hmi/hmi_nats.py $CONFIG hmi 2>&1 | tee scada.log\"" \
    --tab --title "Game master" -e "sh -c \"python3 $TE_REP/src/features/orchestrator/hmi/hmi_nats.py $CONFIG game_master 2>&1 | tee game_master.log\"" \
    --tab -e "sh -c \"echo 'Pressez une touche ...'; read\"" 2>/dev/null
