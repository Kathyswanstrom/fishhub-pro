# FishHub.pro / F.I.S.H.
## Fishing Intelligence Storage Hub
### Marine Intelligence Command Platform

This is a full first-build Next.js + Supabase app package designed around the **map-first Command Center** vision.

## Included Features

- FishHub.pro branding with the latest logo in `/public/fishhub-logo.png`
- Map-first Marine Command Center
- Halibut catch tracking
- Salmon catch tracking
- Dungeness crab pot tracking
- GPS capture from device
- Shareable GPS links
- NOAA tide station lookup by GPS
- NOAA high/low tide predictions
- Open-Meteo weather and marine condition snapshot
- Bait dropdowns
- Depth tracking
- Photos through Supabase Storage
- Smart Spots / Hot Spots concept
- Confidence scoring placeholders
- Instructional video placeholder section
- Processing/freezer inventory placeholder
- Supabase SQL schema
- Demo mode if Supabase is not connected yet

## Folder Structure

```text
app/
  globals.css
  layout.tsx
  page.tsx
lib/
  calculations.ts
  noaa.ts
  supabase.ts
  types.ts
  weather.ts
public/
  fishhub-logo.png
supabase/
  schema.sql
.env.example
package.json
```

## Step 1: Unzip the Project

Unzip this folder somewhere easy, such as your Desktop.

## Step 2: Open in VS Code

Open the folder in VS Code.

## Step 3: Install Dependencies

In the terminal:

```bash
npm install
```

## Step 4: Run Locally in Demo Mode

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

The app will show sample demo data until Supabase is connected.

## Step 5: Create Supabase Project

1. Go to Supabase.
2. Create a new project.
3. Open **SQL Editor**.
4. Copy everything from:

```text
supabase/schema.sql
```

5. Paste it into SQL Editor.
6. Click **Run**.

This creates:

- trips
- catches
- crab_pots
- smart_spots
- instruction_videos
- processing_inventory
- fishhub-photos storage bucket

## Step 6: Get Supabase Keys

In Supabase:

1. Go to **Project Settings**.
2. Go to **API**.
3. Copy:
   - Project URL
   - anon public key

## Step 7: Create `.env.local`

Create a file named:

```bash
.env.local
```

Add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Restart local server:

```bash
npm run dev
```

## Step 8: Push to GitHub

Create a new GitHub repository, then run these commands from the project folder:

```bash
git init
git add .
git commit -m "Initial FishHub.pro build"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPO_URL` with your GitHub repo URL.

## Step 9: Deploy to Vercel

1. Go to Vercel.
2. Click **Add New Project**.
3. Import the GitHub repo.
4. Add environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

5. Deploy.

## Step 10: Connect Domain

In Vercel:

1. Open your project.
2. Go to **Settings**.
3. Go to **Domains**.
4. Add:

```text
fishhub.pro
```

Follow Vercel’s DNS instructions from your domain registrar.

## Important Notes

### Development Security
The included Supabase policies are open for easier early testing. Before real users, add authentication and user-specific Row Level Security.

### NOAA Tides
The app uses GPS to find the closest NOAA tide prediction station and then pulls high/low tides for the selected date.

### Weather and Marine Conditions
The app uses Open-Meteo for weather and marine data. Check licensing before commercial launch.

### Map Layer
This first package includes a styled map-command placeholder. The next build should add real marine map layers using Mapbox/NOAA raster charts/OpenSeaMap depending on the direction you choose.

## Recommended Next Design Build

Before adding commercial features, refine:

1. Real map layer
2. Trip start/end workflow
3. Drift tracking
4. Crab pot map pins
5. Secret spot vault/privacy system
6. AI trip summaries
7. Bite window predictor
8. Mobile boat-friendly quick-add mode
