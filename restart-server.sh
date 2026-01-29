#!/bin/bash
# Trouver et tuer le process node sur le port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null
echo "✅ Serveur arrêté"
# Redémarrer
npm run dev
