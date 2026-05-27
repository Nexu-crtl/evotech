@echo off
setlocal
cd /d "%~dp0server"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js/npm nao encontrado. Instale Node.js LTS em https://nodejs.org e abra este arquivo de novo.
  pause
  exit /b 1
)
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Arquivo .env criado. Edite server\.env e configure ADMIN_PASSWORD e Mercado Pago.
)
if not exist "node_modules" (
  echo Instalando dependencias...
  npm install
)
echo.
echo Nexora vai abrir em:
echo Loja:  http://localhost:3000
echo Admin: http://localhost:3000/admin
echo.
npm start
