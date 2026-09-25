# portfolio

Design portfolio of Anvita Beohar — a static HTML/CSS/JS replica of
[anvitabeohar.framer.website](https://anvitabeohar.framer.website/), hosted on GitHub Pages.

## Structure

```
index.html            Home: hero, selected work, about, contact
projects/             One case-study page per project
css/style.css         All styles (light + dark mode, responsive)
js/main.js            Mobile menu, scroll fade-in, footer year
assets/               Images, icons and resume — see assets/README.md
```

## Editing
- Text: edit `index.html` and `projects/project-N.html` directly.
- Add a project: copy a `.card` block in `index.html` and a `projects/project-N.html` file.
- Images: upload to `assets/` using the names in `assets/README.md`.

## Preview locally
```
python3 -m http.server 8000
```
then open http://localhost:8000.

## Publish with GitHub Pages
Repo **Settings → Pages → Build and deployment → Deploy from a branch**, pick `main` and `/ (root)`.
The site will be live at `https://anvitabeohar.github.io/portfolio/`.
