# tools/build_pages.py

Optional. The three HTML pages share a header, footer, icon sprite, avatar and illustration
components. This script generates `index.html`, `roadmap.html` and `404.html` from those
shared pieces so a change to the header or an illustration lands on every page.

```sh
python3 tools/build_pages.py .
```

It only writes the HTML files. `css/styles.css`, `js/*.js` and `assets/` are hand-edited and
are never touched by the script. Editing the HTML files directly is also fine; just do not
run the script afterwards or it will overwrite those edits.
