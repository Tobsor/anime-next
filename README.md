# Anime Next - Group Anime Decision App

A Next.js + React web app that lets groups of people collaboratively decide what anime to watch next, with voting, user profiles, and anime search powered by AniList.

## Features

✨ **User Selection & Persistence**
- Each group prompts users to identify themselves on first visit
- User selection is saved in localStorage for recognition on return visits

📺 **Anime Management**
- Two lists per group: "Plan to watch" and "Completed"
- Search anime titles using AniList's GraphQL API
- Add anime cards display cover art, genres, episode count, release date, and aggregate votes

🗳️ **Voting System**
- Each user gets 5 upvotes and 3 downvotes per group
- Upvote/downvote buttons change color when active
- Vote counts are tracked and persisted
- Undo any vote at any time
- List automatically sorts by votes (upvotes descend, downvotes ascend, no-vote items last)

✅ **Mark Completed**
- Move anime from "Plan to watch" to "Completed" with a single click
- Both lists visible side-by-side

⚙️ **Admin Dashboard**
- Password-protected admin interface
- Manage groups, users, and view raw store data
- Add/edit/delete groups and users

💾 **Data Persistence**
- Prisma-backed PostgreSQL store via `DATABASE_URL`
- API routes handle all read/write operations
- Votes and list state persist across sessions

## Getting Started

### Prerequisites
- Node.js 16+ and npm installed
- (Optional) Set `ADMIN_PASSWORD` environment variable for admin access (default: 'admin')

### Installation

```bash
# Install dependencies
npm install

# Apply database migrations (DATABASE_URL must point to PostgreSQL)
npx prisma migrate deploy
npx prisma generate

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

Anime IDs are unique within each group. The same AniList title can appear in
multiple groups with independent votes and completion status. When updating an
existing installation, stop the server, apply migrations, regenerate the Prisma
client, and restart the server (or rebuild for production).

### Access the App

1. **Group Page**: Navigate to `http://localhost:3000/example-group`
   - You'll be prompted to select a user (Alice or Bob)
   - Once selected, view and manage the "Plan to watch" and "Completed" lists

2. **Admin Panel**: Navigate to `http://localhost:3000/admin`
   - Default password: `admin`
   - Manage groups, users, and raw Prisma-backed data
   - Add new groups or users as needed

## Usage Guide

### As a User

1. **First Visit to a Group**
   - Open `http://localhost:3000/[group-id]` (e.g., `/example-group`)
   - A modal appears asking you to select your user
   - Your selection is saved in localStorage

2. **Add Anime to Plan**
   - Click the "Add" button above the "Plan to watch" list
   - Type an anime title in the search box
   - Click "Search" or press Enter
   - Click "Add" on the anime card you want to add

3. **Vote on Anime**
   - Click the "Up" button to upvote (green when active)
   - Click the "Down" button to downvote (red when active)
   - Click "Undo" to remove your vote
   - The list automatically re-sorts based on votes

4. **Mark Anime as Completed**
   - Click "Mark Completed" on an anime in the "Plan to watch" list
   - It moves to the "Completed" list

### As an Admin

1. **Log In**
   - Navigate to `/admin`
   - Enter the admin password (default: `admin`)

2. **Manage Groups**
   - Click "Add Group" to create a new group
   - Edit group name, add/remove users, or delete groups
   - Changes are saved with the "Save All Changes" button

3. **View Raw Data**
   - Review the current seeded data and edit the store through the admin UI
   - Save changes to persist them to the Prisma-backed database

## Project Structure

```
anime-next/
├── app/
│   ├── [group]/page.tsx            # Dynamic group page
│   ├── admin/page.tsx             # Admin dashboard
│   └── api/
│       ├── anilist/route.ts        # Proxy for AniList GraphQL queries
│       ├── admin/store/route.ts    # Store read/write API with password auth
│       └── group/[group]/route.ts  # Group-specific actions (add, vote, complete, undo)
├── components/
│   ├── UserSelectModal.tsx         # User selection modal
│   ├── AddAnimeModal.tsx           # Anime search and add modal
│   └── AnimeCard.tsx               # Anime card display with vote buttons
├── lib/
│   ├── dataStore.ts                # Prisma-backed persistence layer
│   ├── models.ts                   # Shared domain model definitions
│   └── prisma.ts                   # Prisma client singleton
├── prisma/
│   ├── schema.prisma               # PostgreSQL schema
│   └── migrations/                 # Prisma migration history
├── package.json
├── tsconfig.json
├── next.config.js
└── .gitignore
```

## API Reference

### GET /api/admin/store
Fetch the entire store (groups, users, votes)
```bash
curl http://localhost:3000/api/admin/store
```

### POST /api/admin/store
Update the entire store (requires `x-admin-password` header)
```bash
curl -X POST http://localhost:3000/api/admin/store \
  -H "Content-Type: application/json" \
  -H "x-admin-password: admin" \
  -d '{"groups": [...]}'
```

### GET /api/group/[group]
Fetch a specific group's state
```bash
curl http://localhost:3000/api/group/example-group
```

### POST /api/group/[group]
Perform actions on a group:
- `add`: Add anime to plan list
- `complete`: Move anime from plan to completed
- `vote`: Cast or switch a vote
- `undo`: Remove a vote

Example (add anime):
```bash
curl -X POST http://localhost:3000/api/group/example-group \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add",
    "payload": {
      "anime": {
        "id": 1,
        "title": "Attack on Titan",
        "coverImage": "...",
        "genres": ["Action", "Drama"],
        "episodes": 25,
        "startDate": { "year": 2013 }
      }
    }
  }'
```

### POST /api/anilist
Proxy for AniList GraphQL API
```bash
curl -X POST http://localhost:3000/api/anilist \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query ($search: String) { Page(perPage: 10) { media(search: $search, type: ANIME) { id title { english romaji } } } }",
    "variables": { "search": "Attack on Titan" }
  }'
```

## Data Format

### Group Object
```typescript
{
  id: string;              // Unique group identifier
  name: string;            // Display name
  users: User[];           // List of users in this group
  plan: AnimeEntry[];      // Anime in "Plan to watch"
  completed: AnimeEntry[]; // Anime marked as completed
  votes?: {                // Per-user voting data
    [userId: string]: {
      [animeId: string]: 'up' | 'down'
    }
  };
}
```

### User Object
```typescript
{
  id: string;   // Unique user identifier
  name: string; // Display name
}
```

### AnimeEntry Object
```typescript
{
  id: number | string;
  title: string;
  coverImage?: string;
  genres?: string[];
  episodes?: number | null;
  startDate?: { year?: number; month?: number; day?: number };
  votes?: { up: number; down: number };
}
```

## Voting Mechanics

- **User Limits**: Each user has 5 upvotes and 3 downvotes per group
- **Vote Switching**: Users can switch from up to down (or vice versa) without using extra votes
- **Sorting**: Items sorted by `(upvotes - downvotes)` descending, then by raw upvotes descending, then by downvotes ascending. Items with zero votes appear at the end.
- **Persistence**: All votes are stored in the JSON file and persist across sessions

## Environment Variables

- `ADMIN_PASSWORD` (optional): Set the admin password for the admin panel. Defaults to `'admin'`.

## Production Deployment

This app is designed for rapid prototyping on local/dev environments. For production deployment to Vercel or other serverless hosts:

1. **Ephemeral Filesystem**: The JSON file persistence will not survive past a deployment/redeploy. For production, consider:
   - Vercel KV Redis: Store voting data and group state
   - Database (PostgreSQL, MongoDB, etc.)
   - Upstash Redis

2. **Authentication**: The current admin password mechanism is basic. For production, implement proper OAuth or session-based auth.

3. **Rate Limiting**: Add rate limiting on the Anilist proxy API to avoid hitting API limits.

## Known Limitations

- Voting state is ephemeral on serverless platforms (Vercel) — choose a managed store for production
- Admin authentication uses plain-text password headers (HTTPS-safe but not production-secure)
- No rate limiting on Anilist API queries
- No user authentication (relies on localStorage — anyone can impersonate)

## Development

### Build for Production
```bash
npm run build
npm start
```

### Project Tech Stack
- **Framework**: Next.js 13 with TypeScript
- **UI**: Chakra UI + Emotion
- **Data**: JSON files + API routes
- **External APIs**: AniList GraphQL

## License

MIT

## Support

For issues or feature requests, open an issue in the GitHub repository.
