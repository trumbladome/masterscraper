# STEPTWO V2 – Universal Gallery Scraper & Bulk Downloader

STEPTWO V2 fuses the industrial-grade download engine of **DownThemAll!** with the smartest scraping techniques from leading gallery extensions (Agenty, Instant Data Scraper, Imageye, Gallery Scraper Pro, …).  It runs entirely in-browser (Manifest V3) – no servers, no tracking.

## Key Features

• **One-click Smart Guess** – detects the dominant gallery/grid on any page and starts scraping automatically.  
• **Site Profiles** – built-in recipes for Getty Images, Shutterstock, Pinterest, Flickr, Imago-Images, Mirrorpix (add your own in `profiles.json`).  
• **Manual Picker** – CssPath overlay lets power-users craft precision selectors.  
• **Infinite-scroll & Pagination** – auto scrolls / clicks “next” until the end.  
• **DownThemAll! Queue** – pause/resume, global concurrency, per-host limit, exponential back-off retries, conflict-safe filenames.  
• **Filename Mask Editor** – live preview with tokens `*name*`, `*num*`, `*ext*`, `*date*`, `*host*`, `*subdirs*`.  
• **CSV / XLSX Export** – download scrape data instantly.  
• **Dark Mode** & trim-to-500 live log for smooth UI.

## Installation (Unpacked)
1. Clone or download this repo.
2. Visit `chrome://extensions` (or Edge/Opera equivalent) → Enable *Developer mode*.
3. Click **Load unpacked** → select the `steptwo-v2/` folder.
4. Pin the extension icon for quick access.

## Quick Start
1. **Auto**: Navigate to Getty/Shutterstock/Pinterest/Flickr/Imago/Mirrorpix → icon → watch auto profile scrape.
2. **Smart Guess**: On any gallery page → icon → *Smart Guess* → sits back.
3. **Manual**: Icon → *Start Picker* → click example image → scraping begins.
4. Observe live progress; Pause/Resume as needed.  
5. Export results via *Export CSV* / *Export XLSX*.

## Settings
*Options →*  
• Concurrency, Host limit, Retry limit.  
• Toggle auto profiles; inspect bundled profile list.  
• Build Recipes, edit Filename Mask, enable Dark Mode.

## Duplicate-Image Filter

Enable **Skip duplicate images** in *Options → Filters*. The scraper computes a fast content hash (inside your browser, no upload) for each photo and ignores any image whose hash has already appeared in the current session. The progress log and popup counter show how many duplicates were skipped.

## Add a New Site Profile
Edit `steptwo-v2/profiles.json`:
```json
"unsplash.com": { "selector": "figure img" }
```
Reload extension – done.

## Roadmap
* Native-messaging helper for >2 GB files  
* Virtual-scroll progress list & toast notifications  
* Internationalisation & full theming  
* Automated Jest/Puppeteer test suite + CI

---
© 2025 STEPTWO Team – MIT License