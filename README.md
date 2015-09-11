# CSS detector

This project contains two parts: a crawler and a website acting as GUI. For a more thorough explanation please read my thesis and run the code yourself.

## Immediate TODOs

I have been unable to finish this as I would like. Some of the things I'd like to have done:

1. Fix the State Machine, which crawlers a web page by intercepting and firing events.
2. Add a JS styler and fix some style issues.
3. Find a solution for the Content-Security-Policy
4. Probably remove CasperJS
5. Multiple crawlers
6. Use Google to retrieve a first set of seed URLs to increase coverage
7. Add more vendor prefixes
8. Use robots.txt to find more seed URLs
9. Detect sitemaps to detect more URLs
10. Crawl up URL trees (`/activities/1/` to `/activities/`)
11. Major code cleanup

## Notes

The project is built with large amount of time pressure and (in the beginning) lack of knowledge on CasperJS and PhantomJS.

## Running the project

CSS detector is built using CasperJS and PhantomJS. The website uses Node and a handful of libraries.

### Install dependencies

1. Install PhantomJS 2.0 (http://phantomjs.org/)
2. Install CasperJS (grab the latest master branch)
3. Install io.js 3.x.x (https://iojs.org/)
4. Go to `/css-detector/crawler` and `npm install`
5. Go to `/css-detector/website` and `npm install`
    1. You might need to install the sqlite3 module manually (https://github.com/nodejs/node-gyp#installation)
    2. The sqlite3 version on NPM is not yet compatible with io.js 3.x.x. As soon as it is, change `dependencies.sqlite3` in `/css-detector/website/package.json` to `"sqlite3": "^3.0.x"`


### Running it

__Run using the GUI:__

1. `node index.js` in `/css-detector/website`
2. Open `http://localhost:8000`

__Run using the terminal:__

1. `casperjs index.js --url=<url here>` __Note: the website must be running, it is used for storage__

