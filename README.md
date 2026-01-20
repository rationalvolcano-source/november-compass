# Current Affairs Compiler

A web application to compile and organize current affairs news for competitive exam preparation (UPSC, SSC, Banking, State PSCs).

## Features

- Fetch news by month and year across multiple categories
- Parallel bulk fetching for faster data retrieval
- Select and organize news items
- Export to PDF for study material
- Edit and verify news items

## Technologies

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Zustand (state management)
- Supabase Edge Functions

## Getting Started

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Deployment

Build the project and deploy the `dist` folder to your preferred hosting platform (Vercel, Netlify, etc.).
