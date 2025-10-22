# EROS Admin Dashboard

A comprehensive admin dashboard for the EROS dating application, built with React, Vite, TypeScript, and Supabase.

## Features

- **User Management**: View, ban, unban, and manage user accounts
- **Photo Moderation**: Review and approve/reject user photos with AI moderation flags
- **Subscription Management**: Manage subscription plans and user subscriptions
- **Compliance Tools**: Handle age verification, GDPR requests, and content flags
- **Analytics & Reports**: View user growth, revenue, and moderation statistics
- **Role-Based Access Control**: 4-tier system (Super Admin, Admin, Moderator, Support)

## Prerequisites

- Node.js 18+ and npm
- Supabase account with project set up
- Admin schema applied to Supabase database (see `/supabase/admin_schema.sql` in the main app)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Get these values from your Supabase project settings:
- Go to https://supabase.com/dashboard
- Select your project
- Navigate to Settings > API
- Copy the Project URL and anon/public key

### 3. Apply Database Schema

The admin schema must be applied to your Supabase database. The schema file is located at:
`../eros-app/supabase/admin_schema.sql`

Apply it via Supabase SQL Editor:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Paste the contents of `admin_schema.sql`
4. Run the query

### 4. Create Your First Admin User

Run this SQL in Supabase SQL Editor (replace with your email):

```sql
-- First, create an auth user via Supabase Dashboard > Authentication > Users
-- Then link it to admin_users table:

INSERT INTO admin_users (id, email, role, is_active)
VALUES (
  'your-auth-user-id-from-dashboard',
  'admin@yourdomain.com',
  'super_admin',
  TRUE
);
```

## Development

Start the development server:

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Deployment

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Option 2: Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build and deploy:
```bash
npm run build
netlify deploy --prod --dir=dist
```

3. Add environment variables in Netlify dashboard

### Option 3: Docker

A `Dockerfile` is included. To build and run:

```bash
docker build -t eros-admin .
docker run -p 8080:80 -e VITE_SUPABASE_URL=your-url -e VITE_SUPABASE_ANON_KEY=your-key eros-admin
```

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Row Level Security**: The admin schema includes RLS policies to restrict access
3. **Authentication**: All routes are protected and require admin authentication
4. **Role Permissions**: Different admin roles have different access levels
5. **Audit Logging**: All moderation actions are logged in `moderation_actions` table

## Admin Roles

- **Super Admin**: Full access to all features including user management
- **Admin**: Can manage users, moderate content, handle compliance
- **Moderator**: Can moderate photos and content flags
- **Support**: Read-only access to help users with issues

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **Styling**: TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Charts**: Recharts
- **Notifications**: React Hot Toast

## Project Structure

```
src/
├── components/        # Reusable components
│   └── Layout.tsx    # Main layout with sidebar
├── contexts/         # React contexts
│   └── AuthContext.tsx
├── lib/              # Utilities and configs
│   └── supabase.ts
├── pages/            # Route pages
│   ├── DashboardPage.tsx
│   ├── UsersPage.tsx
│   ├── PhotoModerationPage.tsx
│   ├── SubscriptionsPage.tsx
│   ├── CompliancePage.tsx
│   ├── AnalyticsPage.tsx
│   └── LoginPage.tsx
├── types/            # TypeScript types
│   └── database.ts
├── App.tsx           # Root component with routing
└── main.tsx          # Entry point
```

## Troubleshooting

### Authentication Issues

If you can't log in:
1. Verify your email is in the `admin_users` table
2. Check that `is_active` is set to `TRUE`
3. Ensure the Supabase auth user ID matches the `admin_users.id`

### Database Errors

If you get database errors:
1. Verify the admin schema was applied correctly
2. Check RLS policies are enabled
3. Ensure your Supabase project is on a paid plan for RLS

### Build Errors

If the build fails:
1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Check that all environment variables are set

## Support

For issues or questions, please contact the development team.

## License

Proprietary - All rights reserved
