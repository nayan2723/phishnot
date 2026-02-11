# PhishNot Technical Audit — Deliverables

## 1. Issues Found

| # | Category | Issue | Severity |
|---|----------|--------|----------|
| 1 | Deployment | `.gitignore` excluded `*.pkl`, `backend/phish_model.pkl`, `backend/vectorizer.pkl` — model files could not be committed, breaking Render deploy | High |
| 2 | Backend | `requirements.txt` included extra deps: `pydantic`, `requests`; user spec required only fastapi, uvicorn, scikit-learn, joblib, pandas==2.1.4, numpy==1.26.4 | Medium |
| 3 | Backend | Unused imports in `main.py`: `os`, `sys` | Low |
| 4 | Backend | Root and `/health` responses exposed `backend_directory`, `model_path`, `vectorizer_path`, `model_files_expected_at` — unnecessary path exposure | Low |
| 5 | Backend | `/predict` 503 error message included backend directory path | Low |
| 6 | Frontend | Hardcoded backend URL `http://127.0.0.1:8000` in `ResponsiveScanner.tsx` for `/health` and `/predict` — not configurable for production (Vercel → Render) | High |
| 7 | Frontend | Error messages referenced `model_files_expected_at` from health response (removed in backend) | Medium |
| 8 | Docs/Config | No `.env.example` or clear instructions for `VITE_API_URL` and Render/Vercel deploy | Medium |

**Not issues (verified):**
- Backend uses `Path(__file__).parent` for model paths — no absolute or machine-specific paths.
- POST `/predict` input `{ "email": "<string>" }` and output `{ "phishing": bool, "confidence": float }` match spec.
- Frontend sends `{ "email": "<text>" }`, parses `phishing` and `confidence`, displays "Phishing Detected" / "Looks Safe" and "Confidence %".
- Empty input: backend returns 400 "Email text cannot be empty"; frontend validation blocks empty submit.
- No mock detection logic or fake results in frontend.
- `runtime.txt` already contained `python-3.10.13`.

---

## 2. What Was Fixed

1. **.gitignore** — Removed `*.pkl`, `backend/phish_model.pkl`, and `backend/vectorizer.pkl` so model files can be committed and deployed to Render.
2. **backend/requirements.txt** — Replaced with: `fastapi`, `uvicorn`, `scikit-learn`, `joblib`, `pandas==2.1.4`, `numpy==1.26.4` (no pydantic/requests).
3. **backend/main.py** — Removed unused `os` and `sys`; removed path exposure from `/`, `/health`, and `/predict` error detail; kept model loading via `Path(__file__).parent` only.
4. **Frontend API URL** — Added `src/lib/api.ts` with `API_BASE_URL` from `VITE_API_URL` (default `http://127.0.0.1:8000`). Updated `ResponsiveScanner.tsx` to use `api.health()` and `api.predict()` and fixed error copy to not depend on `model_files_expected_at`.
5. **Env types** — Added `ImportMetaEnv` in `src/vite-env.d.ts` for `VITE_API_URL`.
6. **.env.example** — Created with `VITE_API_URL` and short instructions for local vs production.
7. **README.md** — Updated start command to include `uvicorn main:app --host 0.0.0.0 --port 10000`; added frontend env note; added **Deploying** section with Render (backend) and Vercel (frontend) steps.

---

## 3. Files Modified

| File | Changes |
|------|--------|
| `.gitignore` | Removed *.pkl and backend .pkl entries |
| `backend/requirements.txt` | Minimal deps per spec |
| `backend/main.py` | Removed os/sys; no path exposure in responses; generic 503 message |
| `src/lib/api.ts` | **New** — API_BASE_URL and api.health() / api.predict() |
| `src/vite-env.d.ts` | ImportMetaEnv for VITE_API_URL |
| `src/components/ResponsiveScanner.tsx` | Use api.health()/api.predict(); generic error messages |
| `.env.example` | **New** — VITE_API_URL and optional vars |
| `README.md` | Start command, env, Deploying (Render + Vercel) |

---

## 4. Confirmation

**Project is fully functional and backend is Render-ready.**

- Backend: FastAPI app, model load via `Path(__file__).parent` only, POST `/predict` with validation and clear errors; `requirements.txt` and `runtime.txt` set for Render.
- Frontend: Uses configurable backend URL, calls `/health` and `/predict`, shows Phishing Detected / Looks Safe and Confidence %; no mock logic.
- Render: Commit `phish_model.pkl` and `vectorizer.pkl` (no longer gitignored), set start command to `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Vercel: Set `VITE_API_URL` to the Render backend URL.

---

## 5. Final Project Directory Tree (Relevant Parts)

```
phishnot/
├── .env.example
├── .gitignore
├── AUDIT_DELIVERABLES.md
├── README.md
├── backend/
│   ├── main.py
│   ├── phish_model.pkl
│   ├── vectorizer.pkl
│   ├── requirements.txt
│   ├── runtime.txt
│   ├── train_model.py
│   ├── check_model_files.py
│   ├── check_model_accuracy.py
│   ├── test_connection.py
│   ├── README.md
│   └── TRAINING_GUIDE.md
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── components/
│   │   ├── ResponsiveScanner.tsx
│   │   ├── PhishNotApp.tsx
│   │   └── ...
│   ├── pages/
│   │   ├── Index.tsx
│   │   ├── Auth.tsx
│   │   └── NotFound.tsx
│   └── utils/
│       ├── validation.ts
│       └── database.ts
├── package.json
├── vite.config.ts
└── ...
```

---

## 6. Instructions to Run

### Locally

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
# Ensure phish_model.pkl and vectorizer.pkl exist (run python train_model.py if not)
uvicorn main:app --host 0.0.0.0 --port 10000
```
Or with reload on port 8000: `uvicorn main:app --reload --port 8000`

**Frontend**
```bash
# From repo root
npm install
npm run dev
```
If backend is on port 8000, no env needed. If on 10000, create `.env`: `VITE_API_URL=http://127.0.0.1:10000`

### On Render (Backend)

1. New Web Service → connect repo.
2. Root directory: `backend` (or repo root if backend is at `backend/` and build/start run from there).
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Ensure `phish_model.pkl` and `vectorizer.pkl` are in the deployed backend directory (committed or built).
6. Copy the service URL (e.g. `https://phishnot-api.onrender.com`).

### On Vercel (Frontend)

1. Import project → Vercel.
2. Environment variable: `VITE_API_URL` = your Render backend URL (e.g. `https://phishnot-api.onrender.com`).
3. Build: `npm run build`; output: `dist`.
4. Deploy. Frontend will call Render for `/health` and `/predict`.
