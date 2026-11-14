#!/usr/bin/env bash
# ==============================================================================
# BorngreatAccounting (BtAccounting) — Interactive Setup & Lifecycle Manager
# ==============================================================================
set -e

BRANCH=main
CURRENT=$PWD
CLONE_TEMP_DIR=$(mktemp -d)
CPU_ARCH=$(uname -m)
DOCKER_FILE_PATH=./docker-compose.production.yml
DOCKER_ENV_EXAMPLE_PATH=$CURRENT/.env.production.example
DOCKER_ENV_PATH=$CURRENT/.env

if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

function print_logo() {
clear
cat <<"EOF"
======================================================================
  ____                                       _   
 | __ )  ___  _ __ _ __   __ _ _ __ ___  __ _| |_ 
 |  _ \ / _ \| '__| '_ \ / _` | '__/ _ \/ _` | __|
 | |_) | (_) | |  | | | | (_| | | |  __/ (_| | |_ 
 |____/ \___/|_|  |_| |_|\__, |_|  \___|\__,_|\__|
                         |___/  ACCOUNTING (BtAccounting)
======================================================================
 Your Accounting. Your Servers. Your Control.
 Developer & Publisher: Peter Borngreat-Mensah (Borngreat)
======================================================================
EOF
}

function askForAction() {
    local DEFAULT_ACTION=$1
    if [ -z "$DEFAULT_ACTION" ]; then
        echo
        echo "Select an action to perform:"
        echo "   1) Install (${CPU_ARCH})"
        echo "   2) Start"
        echo "   3) Stop"
        echo "   4) Restart"
        echo "   5) Upgrade"
        echo "   6) Backup"
        echo "   7) Logs"
        echo "   8) Exit"
        echo
        read -p "Action [2]: " ACTION
        if [ -z "$ACTION" ]; then ACTION=2; fi
    fi

    if [ "$ACTION" == "1" ] || [ "$DEFAULT_ACTION" == "install" ]; then
        ./install.sh
    elif [ "$ACTION" == "2" ] || [ "$DEFAULT_ACTION" == "start" ]; then
        $COMPOSE_CMD -f $DOCKER_FILE_PATH --env-file=$DOCKER_ENV_PATH up -d
    elif [ "$ACTION" == "3" ] || [ "$DEFAULT_ACTION" == "stop" ]; then
        $COMPOSE_CMD -f $DOCKER_FILE_PATH --env-file=$DOCKER_ENV_PATH down
    elif [ "$ACTION" == "4" ] || [ "$DEFAULT_ACTION" == "restart" ]; then
        $COMPOSE_CMD -f $DOCKER_FILE_PATH --env-file=$DOCKER_ENV_PATH restart
    elif [ "$ACTION" == "5" ] || [ "$DEFAULT_ACTION" == "upgrade" ]; then
        ./upgrade.sh
    elif [ "$ACTION" == "6" ] || [ "$DEFAULT_ACTION" == "backup" ]; then
        ./backup.sh
    elif [ "$ACTION" == "7" ] || [ "$DEFAULT_ACTION" == "logs" ]; then
        $COMPOSE_CMD -f $DOCKER_FILE_PATH --env-file=$DOCKER_ENV_PATH logs -f
    elif [ "$ACTION" == "8" ]; then
        exit 0
    fi
}

print_logo
askForAction "$@"
