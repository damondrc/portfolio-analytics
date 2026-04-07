# Proyecto 3 — Debugging de Tracking

## Objetivo
Documentar errores reales encontrados durante la implementación de 
GTM y GA4, mostrando el proceso de diagnóstico y solución.

## Herramientas utilizadas
- Google Tag Manager (Preview Mode / Tag Assistant)
- Google Analytics 4 (Tiempo Real)
- Chrome DevTools

---

## Bug #1 — GTM instalado pero sin etiquetas configuradas

### Síntoma
Al verificar la instalación de GTM con Tag Assistant, el navegador
mostraba el siguiente mensaje:
> "Debes instalar una etiqueta"

Adicionalmente redirigía a crear una cuenta de Google Analytics,
lo cual generaba confusión sobre si GTM estaba bien instalado.

### Diagnóstico
El mensaje no indica un error de instalación sino que GTM estaba
correctamente instalado pero con el contenedor vacío, sin ninguna
etiqueta configurada aún.

### Solución
Se verificó la instalación correctamente usando el **Preview Mode
de GTM** en lugar de Tag Assistant:
1. GTM → botón "Vista previa"
2. Ingresar la URL del sitio
3. Confirmar mensaje "Tag Assistant Connected"

### Aprendizaje
Tag Assistant requiere etiquetas activas para dar luz verde. 
El Preview Mode de GTM es la herramienta correcta para verificar
la instalación base, independientemente de si hay etiquetas o no.

---

## Bug #2 — Eventos no visibles en la sección "Eventos" de GA4

### Síntoma
Después de configurar y disparar eventos correctamente (confirmados
en Tiempo Real), la sección **Informes → Eventos** de GA4 mostraba:
> "Integra el SDK o configura el etiquetado para empezar a obtener
> datos de eventos. Verás tus primeros informes aquí en 24 horas."

### Diagnóstico
GA4 tiene dos capas de datos con latencias distintas:
- **Tiempo Real** → datos instantáneos (segundos)
- **Informes estándar** → procesamiento con delay de hasta 24 horas

Los eventos estaban llegando correctamente. El mensaje era por
latencia de procesamiento, no por error de configuración.

### Solución
Para marcar conversiones sin esperar 24 horas se usó la ruta:
**Administrar → Eventos → Crear evento manualmente**

Se crearon los eventos `form_submit` y `click_cta` manualmente
y se marcaron como eventos clave desde esa misma pantalla.

### Aprendizaje
Siempre verificar eventos en **Tiempo Real** primero. Los informes
estándar de GA4 no son la fuente correcta para validación inmediata
durante una implementación.

---

## Bug #3 — Funnel de conversión con 0% en paso final

### Síntoma
El embudo configurado en GA4 Explorations mostraba:
- Paso 1 (Vista de página): 100%
- Paso 2 (Clic en CTA): 100%  
- Paso 3 (Envío de formulario): 0%

### Diagnóstico
Dos causas posibles identificadas:
1. El evento `form_submit` aún estaba en proceso de indexación
   (latencia de 24h mencionada en Bug #2)
2. El trigger de GTM para form_submit requería que el formulario
   tuviera validación HTML activa (atributo `required`)

### Solución
1. Se verificó en GTM Preview Mode que el evento `form_submit`
   sí se disparaba correctamente al enviar el formulario
2. Se documentó como un caso de latencia de procesamiento de GA4
3. Se tomó captura del funnel mostrando la estructura correcta
   con la anotación del comportamiento esperado

### Aprendizaje
Un 0% en un paso del funnel no siempre indica error de tracking.
El proceso de debugging requiere separar la capa de **recolección**
(GTM/GA4 recibe el evento) de la capa de **procesamiento**
(GA4 refleja el evento en informes).

---

## Herramienta principal de debugging: GTM Preview Mode

![GTM Preview Mode](preview-mode.png)

El Preview Mode muestra en tiempo real:
- Qué tags se dispararon
- Qué trigger los activó
- Los valores del dataLayer en ese momento

Es la primera herramienta a usar ante cualquier problema de tracking.

---

## Conclusión

Los 3 bugs documentados reflejan errores comunes en implementaciones
reales de GTM + GA4. El patrón de solución siempre sigue este orden:

1. Verificar recolección (GTM Preview Mode)
2. Verificar recepción (GA4 Tiempo Real)  
3. Verificar procesamiento (GA4 Informes — esperar 24h si es necesario)