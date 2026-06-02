#!/bin/bash

echo "Instalando dependencias..."
pnpm install

echo "Iniciando MineControlPanel..."
node server.js
