# Three.js starter template
Three.js (with Cannon.js) starter template.

Start:
		npm install

Run in development mode:

		npm start

Create a build:
- npm run build:front

ESLint:
- npm run lint

There are two root files:
- Three.js only version
- Three.js with Cannon.js (physics) version

Change the /src/index.js file's require target to either one:
- './js/root.js' -> Three.js only
- './js/root-with-cannon.js' -> Three.js with Cannon.js
