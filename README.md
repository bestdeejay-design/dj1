# DJ1.RU — Music Player & Gallery

**Creative memory gallery** — a collection of AI-generated tracks with a custom web player.

All tracks are created with [Riffusion](https://riffusion.com).

## Features

- Album & track gallery with infinite scroll
- Audio player with progress bar, shuffle, repeat modes
- Playlist panel per album
- Top tracks view (sortable by plays / date)
- Media Session API support (keyboard & lock screen controls)
- Dark & light theme
- Service Worker for offline caching
- Responsive design (mobile-friendly)
- Track details modal (sound prompt & lyrics)

## Tech Stack

- **Vanilla JavaScript** (no frameworks)
- **GSAP** — animations
- **Custom API** — private REST backend (music data)
- **Service Worker** — offline caching (static, API, tracks)

## Project Structure

```
├── index.html       # Entry point
├── style.css        # Main styles (themes, layout, player)
├── rays.css         # Background ray animation styles
├── script.js        # Player logic, gallery, theme, API
├── rays.js          # Ray animation engine
├── sw.js            # Service Worker
├── favicon.svg      # Favicon
├── CNAME            # Custom domain (dj1.ru)
└── DATABASE_OPTIMIZATION.sql
```

## Domain

The site is live at **[dj1.ru](https://dj1.ru)**.

## License

All rights reserved.
