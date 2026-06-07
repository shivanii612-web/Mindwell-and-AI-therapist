# MindWell AI Therapy Platform

A full-stack mental wellness platform featuring an AI therapist, real-time consultation, appointment booking, mood tracking, journaling, community support, and role-based dashboards for users, therapists, and admins.

---

## Features

| Feature | Description |
|---------|-------------|
| 🤖 AI Therapist | Gemini-powered conversational therapy with crisis detection and Tanglish support |
| 👤 User Dashboard | Mood summary, journal entries, appointment history, analytics |
| 🩺 Therapist Portal | Accept appointments, start sessions, session notes, consultation room |
| 🛡️ Admin Panel | User management, therapist application approval, platform analytics |
| 📅 Appointment Booking | Users book sessions; therapists accept (atomic, race-condition safe) |
| 💬 Real-time Chat | Socket.io consultation chat saved to MongoDB |
| 🎥 Audio/Video Consultation | Local demo mode (getUserMedia) + Daily.co integration for production |
| 📊 Mood Tracker | Daily mood logging with charts and weekly insights |
| 📓 Journal System | Private journaling with mood tags and full CRUD |
| 💳 Razorpay Integration | Test-mode subscription payments (Premium / Pro Wellness) |
| ⚡ Redis + BullMQ | Optional caching and email/notification job queues |
| 🐳 Docker Setup | Multi-service Docker Compose (frontend, backend, worker, Redis) |
| 🔐 JWT Authentication | Access + refresh token flow, role-based redirects |
| 👥 Role-based Access | User / Therapist / Admin with separate dashboards and permissions |
| 🩺 Therapist Application | Public application form with admin approval workflow |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React.js | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| Redux Toolkit + RTK Query | State management and API calls |
| Tailwind CSS | Utility-first styling |
| Socket.io Client | Real-time consultation chat |
| Framer Motion | Animations |
| Recharts | Mood/analytics charts |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime |
| Express.js | HTTP server and routing |
| MongoDB Atlas | Primary database (cloud) |
| Mongoose | ODM for MongoDB |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| Socket.io | Real-time bidirectional events |
| Redis (ioredis) | Optional caching layer |
| BullMQ | Job queues (email, notifications) |

### Integrations
| Integration | Purpose |
|------------|---------|
| Google Gemini AI | AI therapist chat and crisis detection |
| Razorpay | Test-mode payment processing |
| Daily.co | Production video/audio consultations (optional) |
| Nodemailer | Transactional emails |

### DevOps
| Tool | Purpose |
|-----|---------|
| Docker | Container runtime |
| Docker Compose | Multi-service orchestration |
| NGINX | Serve frontend and proxy API in production |

---

## Project Structure

```
mindwell-main/
├── src/                        # Frontend (React/TypeScript/Vite)
│   ├── components/             # Reusable UI components
│   ├── hooks/                  # Custom React hooks
│   ├── layouts/                # Page layout wrappers
│   ├── lib/                    # Socket client, Supabase shim
│   ├── pages/                  # All page components by feature
│   ├── redux/                  # Store, slices, RTK Query API
│   └── utils/                  # Helpers (apiUtils, cn, etc.)
├── server/                     # Backend (Node/Express)
│   ├── config/                 # Redis connection
│   ├── controllers/            # Route handlers
│   ├── middleware/             # Auth, security
│   ├── models/                 # Mongoose schemas
│   ├── queue/                  # BullMQ queues
│   ├── routes/                 # Express routers
│   ├── services/               # Email, notifications
│   ├── socket/                 # Socket.io handlers
│   ├── utils/                  # Logger, Redis client, cache
│   ├── workers/                # BullMQ workers
│   └── index.js                # Server entry point
├── Dockerfile                  # Frontend build (NGINX)
├── docker-compose.yml          # Full stack orchestration
├── nginx.conf                  # NGINX reverse proxy config
└── index.html                  # Vite entry point
```

---

## Getting Started

### Prerequisites
- Node.js v20+
- npm v9+
- MongoDB Atlas account (or local MongoDB)
- Redis (optional — app works without it)
- Docker + Docker Compose (optional)

---

### Local Development

#### 1. Clone the repository
```bash
git clone https://github.com/your-username/mindwell-main.git
cd mindwell-main
```

#### 2. Configure environment variables

**Frontend** — create `.env` in the project root:
```env
VITE_RAZORPAY_KEY_ID=your_razorpay_test_key
VITE_ENABLE_DAILY=false
```

**Backend** — create `server/.env`:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
GEMINI_API_KEY=your_gemini_api_key
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
ADMIN_EMAIL=your_admin_email
RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
REDIS_ENABLED=false
REDIS_URL=redis://localhost:6379
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=yoursubdomain.daily.co
```

#### 3. Install and run the frontend
```bash
npm install
npm run dev
# Frontend: http://localhost:5173
```

#### 4. Install and run the backend
```bash
cd server
npm install
npm run dev
# Backend: http://localhost:5000
```

---

### Docker Setup (Production)

#### 1. Set environment variables in root `.env`

Copy `.env.docker.example` to `.env` and fill in all values:
```bash
cp .env.docker.example .env
```

#### 2. Build and start all containers
```bash
docker compose up --build
```

#### 3. Stop containers
```bash
docker compose down
```

#### 4. Stop and remove volumes
```bash
docker compose down -v
```

**Running services after `docker compose up`:**

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |
| Redis | localhost:6379 |

---

## Default Ports

| Service | Port |
|---------|------|
| Frontend (dev) | 5173 |
| Frontend (Docker/NGINX) | 80 |
| Backend | 5000 |
| Redis | 6379 |

---

## Environment Variables Reference

### Backend (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Backend port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | JWT access token secret |
| `JWT_REFRESH_SECRET` | Yes | JWT refresh token secret |
| `GEMINI_API_KEY` | Yes | Google Gemini AI key |
| `EMAIL_USER` | Yes | Gmail address for transactional emails |
| `EMAIL_PASS` | Yes | Gmail app password |
| `ADMIN_EMAIL` | Yes | Admin notification email |
| `RAZORPAY_KEY_ID` | Yes | Razorpay test key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay test key secret |
| `REDIS_ENABLED` | No | `true` to enable Redis (default: `false`) |
| `REDIS_URL` | No | Redis connection URL |
| `DAILY_API_KEY` | No | Daily.co API key for production video |
| `DAILY_DOMAIN` | No | Daily.co subdomain |

### Frontend (root `.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_RAZORPAY_KEY_ID` | Yes | Razorpay publishable key (test mode) |
| `VITE_ENABLE_DAILY` | No | `true` to use Daily.co (default: `false`) |

> ⚠️ Never commit `.env` files. Add them to `.gitignore`.

---

## Test Accounts (seed)

Run the seed script once after setting up the backend:
```bash
cd server
node seed-accounts.js
```

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mindwell.ai | Admin@123 |
| Therapist | therapist@mindwell.ai | Therapist@123 |
| User | Sign up via `/signup` | — |

---

## Razorpay Test Payment

1. Open `/pricing` and click **Upgrade to Premium**
2. Use test card:
   - Card: `4111 1111 1111 1111`
   - Expiry: any future date
   - CVV: any 3 digits
   - OTP: `1234`

> No real money is charged in test mode.

---

## Redis (Optional)

Redis is disabled by default (`REDIS_ENABLED=false`). The app works fully without it.

To enable Redis locally:
```bash
# macOS
brew install redis && brew services start redis

# Docker
docker run -p 6379:6379 redis:alpine

# Windows (WSL)
sudo apt install redis-server && sudo service redis-server start
```

Then set in `server/.env`:
```env
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
```

---

## API Endpoints (Summary)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | Public | User signup |
| POST | `/api/auth/login` | Public | Login (all roles) |
| GET | `/api/auth/me` | JWT | Get current user |
| POST | `/api/chat` | JWT | AI therapist chat |
| GET | `/api/moods` | JWT | Get mood logs |
| POST | `/api/moods` | JWT | Log mood |
| GET | `/api/appointments` | JWT | User appointments |
| POST | `/api/appointments` | JWT | Book appointment |
| PUT | `/api/appointments/:id/accept` | Therapist | Accept appointment |
| POST | `/api/appointments/:id/start-session` | Therapist | Start live session |
| GET | `/api/consultations/:id/messages` | JWT | Chat history |
| POST | `/api/therapist-applications/apply` | Public | Therapist application |
| GET | `/api/therapist-applications` | Admin | All applications |
| POST | `/api/therapist-applications/:id/approve` | Admin | Approve therapist |
| POST | `/api/payments/create-order` | JWT | Create Razorpay order |
| POST | `/api/payments/verify` | JWT | Verify payment |
| GET | `/api/health` | Public | Server health check |

---

## Future Improvements

- [ ] Production WebRTC / WebRTC signalling server
- [ ] Push notification support (FCM)
- [ ] Email notification delivery (currently queued, not sent)
- [ ] Mobile app (React Native)
- [ ] Advanced mood analytics with ML insights
- [ ] Group therapy sessions
- [ ] Subscription management (cancel / upgrade / downgrade)
- [ ] Multi-language support
- [ ] HIPAA compliance features for production

---

## License

MIT License — see `LICENSE` for details.

---

## Author

Built with ❤️ for the MindWell AI Therapy Platform internship project.
