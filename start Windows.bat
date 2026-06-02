@echo off

echo Comprobando dependencias...

if not exist node_modules (
    echo node_modules no encontrado. Instalando dependencias...
    call npm install

    if errorlevel 1 (
        echo Error instalando dependencias.
        pause
        exit /b 1
    )
)

echo Iniciando MineControlPanel...
node server.js

pause