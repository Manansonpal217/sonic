# Sonic Admin Panel

A modern, world-class web-based admin panel for managing the Sonic application backend. Built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- ✅ **Complete CRUD Operations** for all 11 backend modules
- ✅ **Beautiful, Modern UI** using shadcn/ui components
- ✅ **Type-safe API Integration** with TypeScript
- ✅ **Real-time Data Management** with React Query
- ✅ **Authentication & Authorization** with route protection
- ✅ **File Upload Support** for images and audio files
- ✅ **Advanced Filtering & Search** across all modules
- ✅ **Responsive Design** for desktop and mobile
- ✅ **Toast Notifications** for user feedback
- ✅ **Loading States & Error Handling**

## Modules

1. **Users** - Manage user accounts
2. **Products** - Product catalog with parent-child relationships
3. **Orders** - Customer order management
4. **Customize Orders** - Custom order requests with image/audio uploads
5. **Cart** - Shopping cart items
6. **Banners** - Promotional banners
7. **CMS** - Content Management System pages
8. **Notifications** - User notifications
9. **Notification Types** - Notification type definitions
10. **Order Emails** - Email records
11. **Sessions** - User sessions and FCM tokens

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

1. Navigate to the admin panel directory:
```bash
cd admin-panel
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file (already created):
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_MEDIA_BASE_URL=http://localhost:8000/media
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Login

Use your Django admin credentials (email and password) to log in. The admin panel uses Django's session authentication.

## Project Structure

```
admin-panel/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication routes
│   │   └── login/
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── dashboard/           # Overview page
│   │   ├── users/               # User management
│   │   ├── products/            # Product management
│   │   ├── orders/              # Order management
│   │   └── ...                  # Other modules
│   ├── layout.tsx               # Root layout
│   ├── providers.tsx            # React Query provider
│   └── page.tsx                 # Home page (redirects to dashboard)
├── components/
│   ├── ui/                      # shadcn/ui components
│   └── layout/                  # Layout components (Sidebar, Header)
├── lib/
│   ├── api/                     # API client and endpoints
│   ├── hooks/                   # React Query hooks
│   ├── store/                   # Zustand stores
│   └── utils/                   # Utility functions
└── types/                       # TypeScript types
```

## API Integration

All API calls are centralized in `lib/api/` directory. Each module has:
- API functions for CRUD operations
- React Query hooks for data fetching and mutations
- TypeScript types matching backend serializers

### Example Usage

```typescript
// Using React Query hooks
import { useUsers, useCreateUser } from '@/lib/hooks/useUsers';

function UsersPage() {
  const { data, isLoading } = useUsers({ page: 1, page_size: 20 });
  const createUser = useCreateUser();

  const handleCreate = async (userData) => {
    await createUser.mutateAsync(userData);
  };

  // ...
}
```

## Styling

The admin panel uses:
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for accessible, customizable components
- **Brand Colors**: Primary color `#842B25` (Sonic brand red)

## Development

### Adding New Modules

1. Create API functions in `lib/api/[module].ts`
2. Create React Query hooks in `lib/hooks/use[Module].ts`
3. Add TypeScript types in `types/[module].ts`
4. Create pages in `app/(dashboard)/[module]/`
5. Add route to sidebar in `components/layout/Sidebar.tsx`

### Building for Production

```bash
npm run build
npm start
```

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL` - Backend API base URL (default: http://localhost:8000/api)
- `NEXT_PUBLIC_MEDIA_BASE_URL` - Media files base URL (default: http://localhost:8000/media)

## Notes

- The admin panel uses Django's session authentication. Ensure CORS is properly configured in the backend.
- File uploads use `multipart/form-data` for images and audio files.
- All data is paginated (20 items per page by default).
- Most modules support soft delete functionality.

## License

Private - Sonic Application
