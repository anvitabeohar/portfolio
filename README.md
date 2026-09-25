# portfolio

Anvita Beohar's design portfolio, rebuilt from [anvitabeohar.framer.website](https://anvitabeohar.framer.website/)
as a plain HTML/CSS/JS site for GitHub Pages. No build step.

## Pages

| File | Page |
|---|---|
| `index.html` | Home: pixel-art hero with walking character, "Character unlocked" cards |
| `projects.html` | Project cards |
| `projects/custodians-of-memory.html` | Case study |
| `contact.html` | Contact details and "Book a call" |
| `faq.html` | FAQ accordion |
| `stack.html` | Tools grid (hover a tile for its description) |
| `resume.html` | Experience, education, and draggable falling skill chips |

`css/style.css` holds all styles; `js/main.js` holds the menu, hover tooltips, FAQ, slideshow and skills physics.
`js/vendor/matter.min.js` is [Matter.js](https://brm.io/matter-js/) 0.20.0 (MIT), used for the falling skills.

## Editing

- **Text:** edit the HTML file for that page.
- **New project card:** copy an `<article class="pcard">` block in `projects.html`. Change it to `<a class="pcard" href="...">` to link it to a case study.
- **New case study:** copy `projects/custodians-of-memory.html`. Add more `<img>` tags inside `.carousel` to get a slideshow.
- **Images:** see `assets/README.md` for what's still missing.

## Preview locally

```
python3 -m http.server 8000
```

then open http://localhost:8000.

## Publish with GitHub Pages

Repo **Settings → Pages → Build and deployment → Deploy from a branch**, pick `main` and `/ (root)`.
The site will be live at `https://anvitabeohar.github.io/portfolio/`.
