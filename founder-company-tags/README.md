# Founder Files: company icons and filter

This is a drop-in add-on for the **Founder Files** dropdown on contextjamming.com. It does two things:

- It puts an SVG company icon after the names of founders who work at Anthropic, OpenAI, xAI (Grok), Google DeepMind, Safe Superintelligence (SSI) or Blitzy.
- It adds a **Company** filter bar at the top of the dropdown with the chips All, Anthropic, OpenAI, xAI / Grok, DeepMind, SSI and Blitzy. Each chip shows how many founders it matches.

It has no dependencies and no build step. It works whether the menu is plain HTML or rendered by React/Next.js.

```
founder-company-tags/
├── founder-company-tags.js    # enhancer + founder→company list (edit here)
├── founder-company-tags.css   # icon + filter-bar styles
├── icons/                     # anthropic, openai, xai, deepmind, ssi, blitzy (.svg)
└── demo.html                  # open locally to preview
```

## Install in "gemclaw fresh" (external drive S9-GPT)

1. Copy this folder into the site's public/static folder. On a Mac the drive mounts under `/Volumes`:

   ```bash
   cp -R founder-company-tags "/Volumes/S9-GPT/gemclaw fresh/public/"
   ```

   If the project serves static files from somewhere other than `public/`, copy it there instead.

2. Load it on every page.

   **Plain HTML / WordPress** (before `</body>`):

   ```html
   <link rel="stylesheet" href="/founder-company-tags/founder-company-tags.css">
   <script src="/founder-company-tags/founder-company-tags.js" defer></script>
   ```

   **Next.js** (in `app/layout.tsx`):

   ```tsx
   import Script from "next/script";
   // inside <head>:
   <link rel="stylesheet" href="/founder-company-tags/founder-company-tags.css" />
   // just before </body>:
   <Script src="/founder-company-tags/founder-company-tags.js" strategy="afterInteractive" />
   ```

3. Commit and push from the drive:

   ```bash
   cd "/Volumes/S9-GPT/gemclaw fresh"
   git checkout -b founder-company-filter
   git add public/founder-company-tags app/layout.tsx   # whichever files you touched
   git commit -m "Founder Files: company icons + company filter"
   git push -u origin founder-company-filter
   ```

## Configuration

The script finds the dropdown on its own by looking for the element that contains both the "A – D" and "S – Z" headings. If you want to point it at the panel yourself, or the icons live somewhere else, set this before the script tag:

```html
<script>
  window.FOUNDER_COMPANY_TAGS = {
    menu: '#founder-files-menu',            // or add data-founder-menu to the panel
    iconBase: '/founder-company-tags/icons'
  };
</script>
```

## Changing who works where

Edit the `FOUNDERS` object at the top of `founder-company-tags.js`. Names are matched loosely, so case, accents, "Dr.", "Sir", ", PhD" and punctuation don't matter. A company chip appears only if at least one founder in the menu matches it. You can also override a list without editing the file:

```js
window.FOUNDER_COMPANY_TAGS = { founders: { xai: ['Ethan He', 'Someone Else'] } };
```

## Icons

The six SVGs are simple, stylized marks, each a 20×20 rounded tile in its company's colour. They are not the official logos. To use official artwork, replace the file in `icons/` and keep the same filename.
