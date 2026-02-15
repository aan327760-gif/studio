# Unbound OS - Sovereign Communication System

This is the official repository for **Unbound**, a completely independent and sovereign digital space.

## Deployment to Vercel

1. **GitHub Sync**: Use the internal Admin Dashboard to sync the source code to your GitHub repository.
2. **Vercel Connection**: Link your GitHub repository to Vercel.
3. **Environment Variables**: Crucially, you must add the following variables to your Vercel project settings:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `CLOUDINARY_URL` (From your Cloudinary dashboard)
   - Any other variables present in your local `.env` file.

## Tech Stack
- **Next.js 15 (App Router)**
- **Firebase** (Auth & Firestore)
- **Tailwind CSS & ShadCN UI**
- **Genkit** (AI Operations)
- **Cloudinary** (Media Management)

Developed with sovereignty by the Unbound community.