# Three.js starter template
Three.js (with Cannon.js) starter template.

*Install locally:*

`npm install`

*Run in development mode locally:*

`npm start`

*..or install and run in Docker container (requires docker & docker-compose):*

`docker-compose up`

*Create a build:*

`npm run build:front`

*ESLint:*

`npm run lint`

There are two root files:
- Three.js only version
- Three.js with Cannon.js (physics) version

Change the /src/index.js file's require target to either one:
- './js/root.js' -> Three.js only
- './js/root-with-cannon.js' -> Three.js with Cannon.js (default)
