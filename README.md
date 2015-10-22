# CSS detector

This project can be used to dynamically crawl a website and detect used CSS selectors (or unused, though some things have to be improved first, see "Immediate TODOs" if you want to contribute). The results are neatly shown in the GUI for easy referral.

It is split into two parts: a crawler and a website acting as GUI. For a more thorough explanation please read my thesis and/or run the code yourself.

I also created a test suite which one an run through the GUI.

## Immediate TODOs

I have been unable to finish this as I would like. Some of the things I'd like to have done:

1. Fix the State Machine, which crawlers a web page by intercepting and firing events.
2. Add a JS styler and fix some style issues.
3. Find a solution for the Content-Security-Policy
4. Probably remove CasperJS in favor of pure PhantomJS
5. Multiple crawlers
6. Use Google to retrieve a first set of seed URLs to increase coverage
7. Add more vendor prefixes
8. Use robots.txt to find more seed URLs
9. Detect sitemaps to detect more URLs
10. Crawl up URL trees (`/activities/1/` to `/activities/`)
11. Major code cleanup
12. Direct feedback test suite (instead of having to mash F5)
13. Offer ability to download the cleaned CSS files

## Notes

The project is built with large amount of time pressure and (in the beginning) lack of knowledge of CasperJS and PhantomJS.

## Running the project

CSS detector is built using CasperJS and PhantomJS. The website uses Node and a handful of libraries.

### Install dependencies

1. Install PhantomJS 2.0 (http://phantomjs.org/)
2. Install CasperJS (grab the latest master branch)
3. Install io.js 3.x.x (https://iojs.org/)
4. Go to `/css-detector/crawler` and `npm install`
5. Go to `/css-detector/website` and `npm install`
    1. You might need to install the sqlite3 module manually from the master branch: `npm install https://github.com/mapbox/node-sqlite3/tarball/master`
    2. The sqlite3 version on NPM is not yet compatible with io.js 3.x.x. As soon as it is, set `dependencies.sqlite3` in `/css-detector/website/package.json` to `"sqlite3": "^3.0.x"`


### Running it

__Run using the GUI:__

1. `node index.js` in `/css-detector/website`
2. Open `http://localhost:8000`

__Run using the terminal:__

1. `casperjs index.js --url=<url here>` __Note: the website must be running, it is used for storage__

## Images

### Website / Crawler

![Main page](/documentation/images/prototype/1_main_page.png)
![Crawl screen](/documentation/images/prototype/2_crawl_screen.png)
![Partial Results](/documentation/images/prototype/3_partial_results.png)
![Crawling done](/documentation/images/prototype/4_crawl_done.png)
![Results 1](/documentation/images/prototype/5_final_results_1.png)
![Results 2](/documentation/images/prototype/5_final_results_2.png)
![Per sheet view](/documentation/images/prototype/6_per_sheet_view.png)
![Per selector view](/documentation/images/prototype/7_per_rule_view.png)

### Test suite

![Initial screen](/documentation/images/testsuite/1_initial_screen.png)
![Testsuite started](/documentation/images/testsuite/2_started.png)
![Results page](/documentation/images/testsuite/3_results_overview.png)
![Failed test](/documentation/images/testsuite/4_failed_test.png)
![Succeeded test](/documentation/images/testsuite/5_succeeded_test.png)
