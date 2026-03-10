#!/bin/bash
# Activar Edge Functions y Cron - MAYA
set -e

echo "=== 1. Desplegando Edge Functions ==="
npx supabase functions deploy recordatorio-semanal --project-ref mqwcrmajddyyydaytqwi
npx supabase functions deploy cierre-semanal --project-ref mqwcrmajddyyydaytqwi

echo ""
echo "=== ✓ Edge Functions desplegadas ==="
echo ""
echo "Siguiente: Configura los Secrets en el Dashboard de Supabase:"
echo "  Project Settings > Edge Functions > Secrets"
echo "  - RESEND_API_KEY"
echo "  - ADMIN_EMAIL"
echo "  - RESEND_FROM (opcional)"
echo ""
echo "Luego ejecuta el SQL de supabase/cron-semanal.sql en el SQL Editor."
echo "Antes, crea los secretos en Vault (ver docs/EDGE-FUNCTIONS-SETUP.md)."
