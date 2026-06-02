#!/bin/bash

echo "Comprobando dependencias..."

if [ ! -d "node_modules" ]; then
    echo "node_modules no encontrado. Instalando dependencias..."
    npm install

    if [ $? -ne 0 ]; then
        echo "Error instalando dependencias."
        exit 1
    fi
fi

echo "Iniciando MineControlPanel..."
node server.js