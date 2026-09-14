# AboxApp — guía para Claude Code

App de gestión para estudios jurídicos de Argentina (React + Express + PostgreSQL,
TypeScript de punta a punta). Toda la interfaz y los documentos están en español
rioplatense. `replit.md` describe la arquitectura en detalle: leelo antes de tocar
algo estructural.

## Restricciones del proyecto (no negociables)

**1. Todo tiene que seguir siendo gratis.** El proyecto corre íntegramente sobre
planes gratuitos. No agregues dependencias, servicios ni infraestructura que
tengan costo, ni siquiera "barato". Si una mejora sólo se puede hacer pagando,
decilo y proponé la alternativa gratuita en lugar de avanzar.

**2. El hosting no tiene LibreOffice ni binarios de sistema.** No hay `soffice`,
`libreoffice`, `pandoc`, `wkhtmltopdf` ni nada que haya que instalar a nivel
sistema operativo. La generación de documentos es 100% JavaScript:
- `server/docGenerator.ts` → rellena plantillas `.docx` del usuario con `docx-templates`
- `server/docBuilder.ts` → arma `.docx` desde cero con la librería `docx`

Si hace falta exportar a PDF u otro formato, tiene que resolverse con una
librería JS pura o en el cliente. Nunca con `child_process` llamando a un binario.

**3. Render (plan gratuito) bloquea los puertos SMTP** (25, 465, 587). Los mails
salen por la API HTTP de Brevo sobre el 443 — ver el comentario en
`server/mailer.ts`. No reintroduzcas nodemailer/SMTP: no va a andar en producción
aunque funcione local.

**4. A Gemini no se le mandan datos de clientes.** `server/ai.ts` redacta
borradores jurídicos, y su prompt de sistema tiene la regla central: el modelo
**no** escribe nombres, DNI, domicilios, teléfonos, emails ni números de
expediente. Inserta variables `{{...}}` (catálogo en `shared/docVariables.ts`) que
el sistema reemplaza después, del lado del servidor, con los datos reales de la
base. Al tocar el prompt o el flujo de IA, mantené esa separación: al modelo va
sólo lo sustantivo del caso, nunca las partes.

También el modelo se elige del free tier con fallback en cadena
(`DEFAULT_MODELS` en `server/ai.ts`, override por `GEMINI_MODEL`): la cuota es por
modelo, así que cuando uno se satura se pasa al siguiente. No lo reduzcas a un
solo modelo.

## Pruebas

Hay **130 casos** de lógica pura sobre `shared/tools/` (fechas, montos, texto,
valuación). No usan framework: cada archivo imprime una línea por caso y termina
en `TODO OK`.

```
npx tsx test/tools-fechas.test.ts
npx tsx test/tools-montos.test.ts
npx tsx test/tools-texto.test.ts
npx tsx test/tools-valuacion.test.ts
```

Corrélas siempre que toques una fórmula, el cómputo de días hábiles o los
feriados. Si agregás un caso, agregalo al archivo que corresponda con el helper
`chequear(...)` (o `cerca(...)` para comparaciones con tolerancia).

Chequeo de tipos: `npm run check` (`tsc`). Corrélo antes de dar por terminado
cualquier cambio.

## Comandos

| Qué | Cómo |
|---|---|
| Dev (server + Vite HMR, puerto 5000) | `npm run dev` |
| Sólo cliente | `npm run dev:client` |
| Build de producción → `dist/index.cjs` | `npm run build` |
| Arrancar el build | `npm start` |
| Chequeo de tipos | `npm run check` |
| Sincronizar schema a la base | `npm run db:push` |

## Estructura

- `client/` — SPA React 18 + Wouter + TanStack Query + shadcn/ui (Tailwind v4).
  Alias `@/` → `client/src/`. Estado central en `client/src/lib/api.tsx` (`useStore()`),
  auth en `client/src/lib/auth.tsx`.
- `server/` — Express 5. `routes.ts` concentra la API bajo `/api/*`; `storage.ts`
  el acceso a datos; `fileStorage.ts` sube archivos a Supabase Storage.
- `shared/` — `schema.ts` (Drizzle + drizzle-zod, fuente de verdad de tipos),
  `tools/` (cálculos jurídicos puros), `docVariables.ts`.
- `test/` — las 130 pruebas.

## Reglas al escribir código

- **Multi-tenancy**: toda consulta se scopea por `accountId` de la sesión. Nunca
  agregues un método de storage que no lo reciba — es lo que evita que un estudio
  vea datos de otro.
- Los tipos salen de `shared/schema.ts`; no dupliques interfaces a mano.
- Fechas en base como `YYYY-MM-DD` (string), se muestran `DD/MM/YYYY`.
- Mobile-first: el diseño se piensa primero para teléfono (bottom nav de 5 tabs).
- Comentarios y nombres de cara al usuario, en español.

## Variables de entorno

`DATABASE_URL`, `SESSION_SECRET`, `PORT`, `NODE_ENV`,
`GEMINI_API_KEY`, `GEMINI_MODEL` (opcional),
`BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `REPORTS_NOTIFY_EMAIL`,
`SUPABASE_URL`, `SUPABASE_ANON_KEY`.
