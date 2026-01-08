# ARSANA-KLATEN Project Structure

## Backend Structure

```
backend/
├── jest.config.js
├── jest.config.old.js
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── logs/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│       ├── migration_lock.toml
│       ├── 20250911103052_arsana2/
│       │   └── migration.sql
│       ├── 20250915081639_new2/
│       │   └── migration.sql
│       └── 20251013120336_update_schema/
│           └── migration.sql
├── src/
│   ├── app.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── calendar.controller.ts
│   │   ├── disposition.controller.ts
│   │   ├── file.controller.ts
│   │   ├── incomingLetter.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── outgoingLetter.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── notFoundHandler.ts
│   │   └── requestLogger.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── calendar.routes.ts
│   │   ├── disposition.routes.ts
│   │   ├── file.routes.ts
│   │   ├── incomingLetter.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── outgoingLetter.routes.ts
│   │   └── user.routes.ts
│   ├── services/
│   │   └── cronService.ts
│   └── utils/
│       ├── auth.ts
│       ├── helpers.ts
│       └── logger.ts
├── tests/
│   ├── setup.ts
│   ├── controllers/
│   │   ├── auth.controller.test.ts
│   │   └── calendar.controller.test.ts
│   ├── integration/
│   │   └── api.test.ts
│   ├── middleware/
│   │   ├── errorHandler.test.ts
│   │   └── notFoundHandler.test.ts
│   ├── services/
│   │   └── cronService.test.ts
│   └── utils/
│       ├── auth.test.ts
│       ├── helpers.test.ts
│       └── logger.test.ts
└── uploads/
    └── letters/
        └── incoming/

## Frontend Structure

```
frontend/
├── jest.config.js
├── jest.setup.js
├── next-env.d.ts
├── next.config.js
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── public/
├── src/
│   ├── __tests__/
│   │   ├── hooks/
│   │   │   ├── useApi.test.tsx
│   │   │   └── useAuth.test.tsx
│   │   └── lib/
│   │       ├── api.test.ts
│   │       └── utils.test.ts
│   ├── components/
│   │   ├── DispositionManager.tsx
│   │   ├── FileDownload.tsx
│   │   └── Layout/
│   │       └── Layout.tsx
│   ├── hooks/
│   │   ├── useApi.ts
│   │   └── useAuth.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   ├── index.tsx
│   │   ├── notifications.tsx
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── calendar/
│   │   │   └── index.tsx
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   └── letters/
│   │       ├── incoming/
│   │       │   ├── create.tsx
│   │       │   ├── index.tsx
│   │       │   └── [id]/
│   │       └── outgoing/
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── index.ts
```