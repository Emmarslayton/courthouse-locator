# Courthouse Locator

A web application that helps users find nearby courthouses in Los Angeles County. Users can search by address or ZIP code, view nearby active courthouse locations on an interactive map, and access directions and courthouse website links when available.

The application also includes a protected administration area for managing courthouse records.

## Features

### Public courthouse search
- Search by address or ZIP code.
- Restrict searches to Los Angeles County.
- Find nearby active courthouse locations.
- View courthouse locations on an interactive Google Map.
- Display nearby results ordered by calculated straight-line distance.
- View courthouse images and website links when available.
- Open directions to a courthouse using Google Maps.
- Copy courthouse addresses.
- Display a fallback when a courthouse image is unavailable or fails to load.

### Administration
- Protected admin dashboard.
- View courthouse records and dashboard statistics.
- Add courthouse locations.
- Edit courthouse information.
- Geocode courthouse addresses using Google Maps services.
- Activate or deactivate courthouse records.
- Manage optional courthouse image and website URLs.

### Data and deployment
- Supabase database and authentication.
- Server-side authorization for administrative actions.
- Google Maps integration.
- Vercel deployment.

## Technology Stack

- **Framework:** Next.js 16 with the App Router
- **Language:** TypeScript
- **UI:** React
- **Database and authentication:** Supabase
- **Maps and geocoding:** Google Maps Platform
- **Hosting and deployment:** Vercel
- **Styling:** CSS Modules

## Project Structure

```text
courthouse-locator/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── actions.ts
│   │   │   ├── page.tsx
│   │   │   └── Admin.module.css
│   │   ├── api/
│   │   │   └── courthouses/
│   │   │       └── search/
│   │   │           └── route.ts
│   │   ├── page.tsx
│   │   └── CourthouseLocator.module.css
│   ├── components/
│   │   ├── CourthouseSearch.tsx
│   │   └── CourthouseMap.tsx
│   └── lib/
│       └── google/
│           └── geocode.ts
├── public/
├── .env.local
├── package.json
└── README.md
```

*This is a high-level overview of the main application files. Other configuration and library files may also exist in the repository.*

## Getting Started

### Prerequisites

- Node.js compatible with the project's Next.js version.
- npm.
- A Supabase project.
- A Google Cloud project with the required Google Maps Platform APIs enabled.
- Access to the courthouse database and the appropriate administrative account for testing admin functionality.

### 1. Clone the repository

```bash
git clone https://github.com/emmarslayton/courthouse-locator.git
cd courthouse-locator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_API_KEY=
```

Set each variable to the appropriate value from your Supabase or Google Cloud project.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key used by the application |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps key used by browser-side map functionality |
| `GOOGLE_MAPS_API_KEY` | Google Maps key used by server-side geocoding, where configured |

**Security notes:**
- Never commit `.env.local` or other files containing secrets.
- Do not expose Supabase service-role or secret keys through `NEXT_PUBLIC_` variables.
- Restrict browser-side Google Maps API keys by website referrer and API.
- Restrict server-side Google Maps keys to the APIs they require and appropriate server-side usage.
- Keep production environment variables configured in Vercel.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run a production build locally

```bash
npm run build
```

To run the production build locally:

```bash
npm run start
```

## Database

The application uses Supabase to store courthouse records and support authentication.

The `public.courthouse_locations` table includes fields for courthouse identity, address, coordinates, active status, geocoding metadata, timestamps, Google Place ID, image URL, and website URL.

Important fields include:

| Field | Purpose |
|---|---|
| `id` | Courthouse record identifier |
| `name` | Courthouse name |
| `address` | Courthouse address |
| `latitude` | Geographic latitude |
| `longitude` | Geographic longitude |
| `active` | Whether the courthouse appears in public search |
| `google_place_id` | Associated Google Place ID, when available |
| `geocoded_at` | Timestamp for geocoding |
| `image_url` | Optional courthouse image URL |
| `website_url` | Optional courthouse website URL |
| `created_at` | Record creation timestamp |
| `updated_at` | Record update timestamp |

The application also uses a `user_roles` table to determine administrative authorization.

Database tables, authentication settings, and row-level security policies must be configured in Supabase. Public search should only return active courthouse records, and administrative access must be restricted to authorized users.

## Search Behavior

The public search API is located at:

```text
/api/courthouses/search
```

The search flow validates the requested location against the application's Los Angeles County restriction, queries active courthouse records, calculates straight-line distances, and returns nearby results.

Distances are calculated using courthouse coordinates and are not driving distances or estimated travel times.

## Administration

The admin dashboard is available at:

```text
/admin
```

Administrative functionality includes creating, editing, activating, and deactivating courthouse records.

Administrative access depends on Supabase authentication and the application's role-based authorization checks. Server-side actions must independently enforce authorization rather than relying on the visibility of the admin interface.

## Deployment

The application is deployed through Vercel and connected to the Git repository.

A typical deployment workflow is:

1. Make and test changes locally.
2. Run `npm run build`.
3. Commit changes to Git.
4. Push to the configured repository branch.
5. Review the deployment and build logs in Vercel.

Configure all required environment variables in the Vercel project's environment settings. Environment variable changes may require a new deployment to take effect.

## Available Scripts

Run `npm run` to see the scripts defined in `package.json`.

The project's standard scripts include:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build and perform the associated checks |
| `npm run start` | Start the production server |
| `npm run lint` | Run the configured linting command |

## Security and Accessibility

Security and accessibility should be verified as part of ongoing development.

Key areas to review include:

- Supabase row-level security policies.
- Server-side authorization for admin pages and mutations.
- Input validation and URL validation.
- Environment variable and API key handling.
- Keyboard navigation and visible focus states.
- Accessible form labels and validation messages.
- Screen-reader announcements for search results and errors.
- Dialog keyboard behavior, including Escape-to-close and focus management.
- Map alternatives so users can access courthouse information without relying exclusively on an interactive map.
- Text contrast, responsive layouts, and zoom support.