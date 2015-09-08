 var ResolveURI = require('../helpers').ResolveURI;

var StyleDetector = require('../detector/styleDetector');
var FormDetector = require('../detector/formDetector');
var LinkDetector = require('../detector/linkDetector');

var _ = require('underscore');
var URL = require('../models/URL');
var Statemachine = require('../states/statemachine');
var State = require('../states/state');

exports.crawl = function crawl(website, page, sheetManager) {

	var linkDetector = new LinkDetector(website, page, pendingUrls, visitedUrls);

	visitedUrls.push(page.url.full());
	visitedPages[page.url.full()] = page;

	console.log('new page: ' + page.url.full());
	// console.log(new Date().getTime() + ' Opening at ');
	casper.open(page.url.full())
	.wait(300)
	.then(function(response) {

		// console.log(response.status + " " + response.url);
		// utils.dump(response);

		this.then(function () {
			if (!response.headers) {
				// Page is invalid (like http://www.mattg.co.uk/emailme.php)
				// Skip page.
				this.bypass(1);
				return;
			}

			if (response.headers.get('content-security-policy') && !xhrAllowed(response.headers.get('content-security-policy'))) {
				CSPPAGE = true;
				console.log('Found CSP on ' + page.url.full() + ': ' + response.headers.get('content-security-policy'));
			}
			else {
				CSPPAGE = false;
			}

			// console.log(new Date().getTime() + ' Opened at ');

			console.log(new Date().getTime() + ' Capturing screenshot and downloading HTML');
			casper.capture(dataFolder + '/' + website.id + '/pages/' + page.id + '/' + page.id + '.png');
			casper.download(casper.getCurrentUrl(), dataFolder + '/' + website.id + '/pages/' + page.id + '/' + page.id + '.html');
			console.log(new Date().getTime() + ' Captured screenshot and downloaded HTML');
		});

		this.then(function () {
			if (isRedirected(response, page)) {
				console.log('REDIRECT URL changed from ' + page.url.full() + ' to ' + casper.getCurrentUrl());

				// filter and add.
				linkDetector.addSingleLink(casper.getCurrentUrl());

			}
			else {
				page.visited();
				Logger.log(this.status().currentHTTPStatus + ' ' + page.url.full(), 'progress', true);


				console.log(new Date().getTime() + ' Starting rule detection');
				page.activeSheets = sheetManager.findSheets();
				StyleDetector.searchRules(page, sheetManager);
				console.log(new Date().getTime() + ' Finishing rule detection');

				// if (isPagination()) {}

				this.then(function () {
					console.log(new Date().getTime() + ' Finding links.');
					linkDetector.findLinks(response.contentType);
					console.log(new Date().getTime() + ' Found links');
				});

				// this.then(function () {
				// 	FormDetector.detect(website, page);
				// });

				this.then(function () {
					// console.log('statemachine step');
					// var statemachine = new Statemachine(website.url);
					// statemachine.run();
				});

				this.then(function () {
					// Update status
					var res = casper.POST('/websites/' + website.id + '/status', {
						pagesCrawled: visitedUrls.length,
						pagesPending: pendingUrls.length,
						pageLimit: pageLimit
					});
				});
			}
		});

		this.then(function () {

			// Out of urls, starting the form crawling
			// See if there are forms left to submit
			// getSubmittedForms(website);

			// If there are URLs to be processed
			if (pendingUrls.length > 0 && visitedUrls.length < pageLimit) {
				var nextUrl = pendingUrls.shift();
				var nextPage = pendingPages[nextUrl];
				delete pendingPages[nextUrl];
				crawl(website, nextPage, sheetManager);
			}
		});
	});
};

function getSubmittedForms(website) {

	var unsubmittedForms = casper.GET('/websites/' + website.id + '/forms?submitted=false');
	console.log('Found ' + unsubmittedForms.length + ' unsubmitted form(s)');
	var unfilled = 0;

	casper.each(unsubmittedForms, function (self, form) {

		console.log('Doing ' + form.selector);

		// are any of the unsubmitted forms filled in?
		if (form.filledIn === true) {
			// apparently so.
			// submit form
			console.log('Opening ' + form.url);
			casper.open(form.url).wait(250).then(function () {

				console.log('Opened ' + form.url);
				casper.fill(form.selector, JSON.parse(form.values), true);
				casper.wait(250);
				casper.then(function () {
					casper.POST('/forms/' + form.id, {});

					console.log('pushing to pendingUrls: ' + pendingUrls);
					pendingPages[casper.getCurrentUrl()] = new Page(website, new URL(casper.getCurrentUrl()));
					pendingUrls.push(casper.getCurrentUrl());
				});
			});
		}
		else {
			unfilled++;
		}
	});

	casper.then(function () {
		console.log('Found ' + unfilled + ' unfilled form(s)');
		// If there are still unfilled forms and no new pages have been added this loop
		// start looping until forms have been filled.
		if (pendingUrls.length > 0) {
			console.log('And ' + pendingUrls.length + ' uncrawled urls, do those first');
			// crawl otherwise
			var nextUrl = pendingUrls.shift();
			var nextPage = pendingPages[nextUrl];
			delete pendingPages[nextUrl];
			exports.crawl(website, nextPage);
		}

		else if (unfilled > 0) {
			console.log('Found unfilled forms and no uncrawled pages. Waiting on forms');
			casper.wait(2000, function () {
				getSubmittedForms(website);
			});
		}
	});
}



function isPagination() {
	if (casper.exists('link[rel="next"]') || casper.exists('link[rel="prev"]')) {
		return true;
	}

	return false;
}

function parseCSPHeader (header) {
	var pairs = {};
	header.split(';').forEach(function (pair) {
		var spl = pair.trim().split(' ');
		pairs[spl[0]] = spl.slice(1);
	});
	return pairs;
}

function xhrAllowed (header) {
	var parsedHeader = parseCSPHeader(header);
	utils.dump(parsedHeader);

	if (parsedHeader['connect-src'] &&
		parsedHeader['connect-src'].indexOf("*") > -1) {
		console.log('allowed');
		return true;
	}

	if (parsedHeader['default-src'] &&
		parsedHeader['default-src'].indexOf("*") > -1) {
		console.log('allowed');
		return true;
	}

	console.log('xhr not allowed');
	return false;
}

function isRedirected (response, page) {
	return response.status === 302 || response.redirectUrl || page.url.full() !== casper.getCurrentUrl();
}
