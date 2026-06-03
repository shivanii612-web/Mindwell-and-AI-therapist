# MindWell - Mental Wellness & AI Therapy Platform

A premium, modern mental wellness platform with AI-powered therapy, licensed therapist consultations, mood tracking, journaling, and community support.

## Features

- **AI Therapist** - 24/7 supportive AI chat with crisis detection
- **Mood Tracking** - Visualize emotional patterns with beautiful charts
- **Journal Management** - Private space for thoughts and reflection
- **Appointment Booking** - Schedule video sessions with licensed therapists
- **Community Forum** - Anonymous support from like-minded individuals
- **Payment System** - Subscription plans with Stripe integration
- **Premium UI** - Glassmorphism, animations, dark/light themes

## Tech Stack

### Frontend
- React 18 + TypeScript
- Redux Toolkit + RTK Query
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide React Icons

### Backend
- Supabase (PostgreSQL + Auth + Realtime)
- Supabase Edge Functions (Deno)
- Row Level Security (RLS)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd mindwell
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Start the development server
```bash
npm run dev
```

5. Open http://localhost:5173

## Project Structure

```
src/
├── components/
│   ├── layout/          # Navbar, Sidebar
│   └── ui/              # GlassCard, Button, Input components
├── hooks/               # Custom React hooks
├── layouts/             # Dashboard, Auth layouts
├── lib/                 # Supabase client
├── pages/
│   ├── auth/            # Login, Signup, ForgotPassword
│   ├── Chat/            # AI Therapist chat
│   ├── Community/       # Forum
│   ├── Dashboard/       # Main dashboard
│   ├── Journal/         # Journal management
│   ├── Mood/            # Mood tracking
│   ├── Appointments/    # Therapist booking
│   └── Payments/        # Subscription plans
├── redux/
│   ├── api/             # RTK Query API slice
│   └── slices/          # Auth, UI, Chat, Notification slices
├── routes.tsx           # React Router configuration
└── utils/               # Utility functions
```

## Database Schema

### Tables
- `profiles` - Extended user profiles
- `therapists` - Therapist information
- `appointments` - Session bookings
- `journals` - Private journal entries
- `moods` - Daily mood logs
- `community_posts` - Forum discussions
- `community_comments` - Post comments
- `chat_messages` - AI chat history
- `notifications` - User notifications
- `payments` - Transaction records
- `subscriptions` - User subscriptions

## Authentication

MindWell uses Supabase Auth with:
- Email/password authentication
- JWT token management
- Persistent sessions
- Protected routes
- Role-based access (user, therapist, admin)

## API Endpoints

All data is managed through Supabase REST API with RLS policies:

- `GET /rest/v1/moods` - Fetch user moods
- `POST /rest/v1/moods` - Create mood entry
- `GET /rest/v1/journals` - Fetch journals
- `POST /rest/v1/journals` - Create journal
- `GET /rest/v1/therapists` - List therapists
- `POST /rest/v1/appointments` - Book appointment
- `GET /rest/v1/community_posts` - Fetch posts

## Deployment

### Frontend
The app is configured for deployment on any static hosting:
```bash
npm run build
```

### Database
Supabase handles database, authentication, and edge functions automatically.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use for personal or commercial projects.

## Support

For issues or questions, please open a GitHub issue.

---

Built with care for mental wellness. Remember: It's okay to ask for help.
