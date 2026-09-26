# portfolio

Anvita Beohar's design portfolio, rebuilt from [anvitabeohar.framer.website](https://anvitabeohar.framer.website/)
as a plain HTML/CSS/JS site for GitHub Pages. No build step.

## Pages

| File | Page |
|---|---|
| `index.html` | Home: hero, selected work, playground, "Character unlocked" cards |
| `projects.html` | Work: all case studies and the playground |
| `projects/custodians-of-memory.html` | Case study (the template for new ones) |
| `projects/vow.html` | Case study: Vow wedding planner app |
| `about.html` | Bio, numbers, how I work, experience, education, skills, toolkit, FAQ |
| `speedrun.html` | The 60-second version for hiring managers |
| `contact.html` | Contact details and "Book a call" |

`css/style.css` starts with the design tokens (colours, type scale, spacing, shadows, motion).
`js/main.js` holds the menu, scroll reveals, hover light, keyboard shortcuts (press `?`), count-ups,
case-study progress bar and contents, FAQ, slideshow and skills physics.
`js/vendor/matter.min.js` is [Matter.js](https://brm.io/matter-js/) 0.20.0 (MIT), used for the falling skills.

## Accessibility

- Text colours meet WCAG AA contrast. Bright orange (`--orange`) is for fills only; use `--orange-text` for orange text.
- Skip link, visible focus rings, labelled navigation, and alt text on content images.
- Everything respects the "reduce motion" setting.

## Editing

- **Text:** edit the HTML file for that page.
- **New project card:** case studies use `wcard` blocks, playground items use `pcard` blocks. Copy one in `projects.html` (and `index.html` if it should be on the home page).
- **New case study:** copy `projects/custodians-of-memory.html` and keep its structure: TL;DR, context, role, key decisions, impact, reflection. Add more `<img>` tags inside `.carousel` to get a slideshow. Then change its card in `index.html` and `projects.html` from `<article>` to `<a href="...">`.
- **Images:** see `assets/README.md` for what's still missing.

## Preview locally

```
python3 -m http.server 8000
```

then open http://localhost:8000.

## Publish with GitHub Pages

Repo **Settings → Pages → Build and deployment → Deploy from a branch**, pick `main` and `/ (root)`.
The site will be live at `https://anvitabeohar.github.io/portfolio/`.
