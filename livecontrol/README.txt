LiveControl website. Plain HTML, CSS and JS with no build step.

Open index.html in a browser, or upload this folder to any static host.

Files
  index.html   page content
  style.css    all styling
  demo.js      the interactive demo in the hero
  script.js    release lookup, setup tabs and checklist, copy buttons, nav
  assets/      icons and the self-hosted Archivo font (SIL Open Font License)

Downloads
  Links point at https://github.com/35socks/LiveControl/releases (V2.1.3).
  On load, script.js asks the GitHub API for the latest release and updates the
  version, size and download links. If that fails, the built-in V2.1.3 link is used.
  To change the repo, edit REPO at the top of script.js and the hrefs in index.html.
