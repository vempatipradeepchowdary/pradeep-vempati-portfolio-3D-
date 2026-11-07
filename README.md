# Pradeep Vempati: 3D Portfolio

AETHER: a scroll-driven flight through a celestial world. A golden ring above an endless sea of clouds, floating marble temples, a colonnade into space and a staircase to a celestial gateway. Built with React, Vite, Three.js and Lenis.

The earlier NEXUS theme is kept in `styles-archive/nexus`.

The projector model and studio lighting in `public/models` come from Poly Haven (polyhaven.com) under the CC0 licence.

## Run it

    npm install
    npm run dev       # local dev server
    npm run build     # production build in dist/
    npm run preview   # serve the production build

## Update the content

All text and links live in `src/data/profile.js`. Empty values stay hidden, so
filling one in makes its button appear:

- `resumeUrl`: put `resume.pdf` in `public/`, then set `resumeUrl: 'resume.pdf'`
- `social`: GitHub, LinkedIn, Instagram and X links
- `phone`
- Each project's `github` and `live` links

## Files

- The world and its camera path (`KEYS`): `src/three/aether.js`
- Sections and content: `src/App.jsx`
- Layout and type: `src/styles.css`
- Earlier styles: `styles-archive/`

## Deploy

Every push to `main` builds the site and publishes it to the `gh-pages` branch
(see `.github/workflows/deploy.yml`). Live at:
https://vempatipradeepchowdary.github.io/pradeep-vempati-portfolio-3D-/
