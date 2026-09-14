Browser demo of the diagram outside Obsidian. Build with

    npx esbuild packages/diagram/demo/main.ts --bundle --format=esm --outfile=<dir>/main.js

copy `index.html` next to the output and serve the directory over HTTP (module scripts do not load from file://).
