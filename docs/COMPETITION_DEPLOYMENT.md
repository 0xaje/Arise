# ARISE Competition Cloud Deployment Reference

## 🌐 Live System Status

- **Frontend Target**: Vercel (`https://your-app.vercel.app`)
- **Backend Target**: Render (`https://arise-backend.onrender.com/api/v1`)
- **Database**: Supabase Cloud PostgreSQL (`aws-1-eu-west-1.pooler.supabase.com`)
- **Coasty Machine**: `ember-orbit` (`c0380719-b0cf-4e99-ac83-4bbf55ff3932`)

---

## ⚡ Deployment Environment Variables

### Render Backend Environment Setup
```env
DATABASE_URL=postgresql://postgres.gzfprjzmsxtlkobqihjy:Rr3hhbpQhHehdSGQ@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.gzfprjzmsxtlkobqihjy:Rr3hhbpQhHehdSGQ@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
COASTY_API_KEY=sk-coasty-live-430175fc620f86502d1118fb7bcbc2cb83b79df6978ad162
COASTY_BASE_URL=https://coasty.ai/v1
COASTY_MACHINE_ID=c0380719-b0cf-4e99-ac83-4bbf55ff3932
CORS_ORIGIN=*
PORT=8000
```

### Vercel Frontend Environment Setup
```env
VITE_ARISE_API_URL=https://arise-backend.onrender.com/api/v1
```

---

## 🛡️ Verification & Test Integrity

- **Backend Integration Tests**: 27/27 PASS
- **TypeScript & Vite Builds**: 0 Errors
- **SPA Routing**: Handled via `vercel.json`
