# Dependencias — sistema-gestion-sd-front (panel)

Toda dependencia directa de npm tiene que estar en esta tabla con versión exacta y aprobación. Si no está acá, no se instala.

## Reglas
- Versión **exacta** en `package.json` (sin `^`, `~` ni rangos).
- `package-lock.json` commiteado: fija también las transitivas. Instalar con `npm ci`.
- Agregar, quitar o actualizar un paquete = commit que modifica esta tabla.
- Candidatas: última versión estable con al menos 2 semanas de publicada.
- Chequeo de vulnerabilidades: `npm audit`.

## Estado
- **Aprobada**: confirmada por el responsable del proyecto.
- **Existente — revisar**: ya estaba en el proyecto antes de esta política, falta confirmarla.

## Runtime (llegan al navegador)

| Paquete | Versión | Licencia | Para qué | Alternativa descartada | Estado |
|---|---|---|---|---|---|
| axios | 1.20.0 | MIT | Llamadas a la API (componentes y páginas) | `fetch` nativo (implica tocar todas las llamadas) | **Actualizada** 2026-10-25 (1.13.2 → 1.20.0, vulnerabilidades altas) |
| lucide-react | 0.554.0 | ISC | Íconos | — | Existente — revisar |
| react | 19.2.0 | MIT | UI | — | Existente — revisar |
| react-dom | 19.2.0 | MIT | UI | — | Existente — revisar |
| react-router-dom | 7.18.4 | MIT | Rutas del panel | — | **Actualizada** 2026-10-25 (7.9.6 → 7.18.4, vulnerabilidades altas) |

## Desarrollo / build (no llegan al navegador)

| Paquete | Versión | Licencia | Para qué | Estado |
|---|---|---|---|---|
| vite | 7.3.7 | MIT | Dev server y build | **Actualizada** 2026-10-25 (7.2.4 → 7.3.7, vulnerabilidades altas; arrastra rollup 4.65.0 y postcss 8.5.31) |
| @vitejs/plugin-react | 5.1.1 | MIT | JSX / Fast Refresh en Vite | Existente — revisar |
| eslint | 9.39.1 | MIT | Lint | Existente — revisar |
| @eslint/js | 9.39.1 | MIT | Reglas base de eslint | Existente — revisar |
| eslint-plugin-react-hooks | 7.0.1 | MIT | Reglas de hooks | Existente — revisar |
| eslint-plugin-react-refresh | 0.4.24 | MIT | Reglas de Fast Refresh | Existente — revisar |
| globals | 16.5.0 | MIT | Globals del navegador para eslint | Existente — revisar |
| @types/react | 19.2.7 | MIT | Tipos (editor) | Existente — revisar |
| @types/react-dom | 19.2.3 | MIT | Tipos (editor) | Existente — revisar |

## Historial

- **2026-10-25** — `npm audit fix` (sin saltos de versión mayor) + versiones exactas en `package.json`. Antes: 21 vulnerabilidades (16 altas); después: 0. Transitivas nuevas: `https-proxy-agent` 5.0.1 y `agent-base` (de axios, solo se usan en Node, no en el navegador), `@humanfs/types` (eslint) y binarios opcionales de rollup para otras plataformas (no se instalan en Windows).
