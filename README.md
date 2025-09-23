# Smart Client Manager

A comprehensive SaaS web application for managing clients, packages, and operations in gyms, hostels, coaching centers, and similar organizations. Built with Next.js, Supabase, and Tailwind CSS as a Progressive Web App (PWA).

## Features

### MVP Features ✅
- **Workspace Management**: Create organizations and invite team members
- **Client Management**: Add, edit, delete, and search clients
- **Package Management**: Define packages with duration and pricing
- **Package Assignment**: Assign packages to clients with automatic status tracking
- **Dashboard**: Real-time insights with key metrics and statistics
- **Reminders**: Automated notifications for expiring packages
- **Data Export**: Export data to Excel, CSV, and PDF formats
- **PWA Support**: Installable web app with offline capabilities

### Technical Features
- **Authentication**: Secure user authentication with Supabase Auth
- **Database**: PostgreSQL with Supabase for data storage
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Export Capabilities**: Multiple export formats for reporting
- **Service Worker**: Offline functionality and caching

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel
- **PWA**: Service Worker, Web App Manifest
- **Libraries**:
  - xlsx (Excel export)
  - jspdf (PDF generation)
  - Supabase JS client

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd crm_react
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Set up the database:
- Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:
- `organizations` - Workspace/organization data
- `profiles` - User profiles with organization association
- `clients` - Client information
- `packages` - Package definitions
- `client_packages` - Package assignments to clients
- `attendance_logs` - Check-in/check-out records
- `notes` - Client notes and tasks

## Deployment to Vercel

### Automatic Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically detect Next.js and deploy

### Manual Deployment
```bash
npm install -g vercel
vercel
```

### Environment Variables on Vercel
Set the following environment variables in your Vercel project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## PWA Installation

The app can be installed as a PWA on supported devices:
1. Open the app in a supported browser (Chrome, Edge, Safari)
2. Look for the "Install" button in the address bar or use the app menu
3. Follow the installation prompts

## Usage

1. **Sign Up**: Create an account and set up your workspace
2. **Add Clients**: Use the Clients tab to manage your client database
3. **Create Packages**: Define packages with pricing and duration
4. **Assign Packages**: Link clients to packages with start/end dates
5. **Monitor Dashboard**: View real-time statistics and reminders
6. **Export Data**: Use the Exports tab for data portability

## API Reference

### Authentication
- POST `/auth/signup` - User registration
- POST `/auth/signin` - User login
- POST `/auth/signout` - User logout

### Organizations
- GET `/organizations` - List organizations
- POST `/organizations` - Create organization

### Clients
- GET `/clients` - List clients
- POST `/clients` - Create client
- PUT `/clients/:id` - Update client
- DELETE `/clients/:id` - Delete client

### Packages
- GET `/packages` - List packages
- POST `/packages` - Create package
- PUT `/packages/:id` - Update package
- DELETE `/packages/:id` - Delete package

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
