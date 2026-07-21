# TechFlow — Simulador de tráfico

Genera tráfico **sintético** sobre la demo TechFlow para poblar GA4 con un
embudo realista (conversiones y abandonos), sin depender de visitas manuales.

## Cómo funciona

`traffic-sim.mjs` abre Chromium con Playwright y recorre el journey real
publicado en GitHub Pages: **home → precios → registro → gracias**. Acepta el
banner de Consent Mode v2, así que los hits pasan por el pipeline real
**GTM → Consent → GA4**, igual que un visitante humano. No se usa Measurement
Protocol: los eventos son indistinguibles del tráfico orgánico salvo por el origen.

Cada ejecución simula 1–3 sesiones (sesgado a 1–2). Cada sesión:

- usa un contexto de navegador nuevo → un usuario/cliente GA4 distinto;
- elige un plan con pesos (Pro 50% · Starter 30% · Business 20%);
- ~15% rechaza el consentimiento (escenario "denied", sin datos en GA4);
- abandona el funnel en un punto aleatorio → embudo con caídas naturales.

## Ejecución

**En la nube (recomendado):** el workflow `.github/workflows/traffic-sim.yml`
lo corre con un cron diario. También puedes lanzarlo a mano desde la pestaña
**Actions → Traffic Simulator → Run workflow**.

**Local:**

```bash
cd bot
npm install
npx playwright install chromium
node traffic-sim.mjs
```

## Nota

Es tráfico sintético sobre un sitio de portafolio propio y simulado, y está
documentado como tal. No representa engagement orgánico real; su función es
demostrar que el pipeline de medición captura correctamente un funnel completo.
