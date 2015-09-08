/*********************
 * Casper instance   *
 *********************/

var casper = require('casper').create({
	pageSettings: {
		webSecurityEnabled: false,
		loadImages: false,
		localToRemoteUrlAccessEnabled: true,
		userAgent: 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.2 Safari/537.36'
	},
	viewportSize: {
		width: 1024,
		height: 768
	},
	clientScripts: [
		'./src/states/identification.js'
	],
	onPageInitialized: function (page) {
		page.injectJs('./src/sha1.js');
		// page.injectJs('./src/states/eventInterceptor.js');
		// page.injectJs('./src/states/eventLauncher.js');
	},
	verbose: false,
	logLevel: "debug",
	waitTimeout: 1000
});
/*********************
 * modules           *
 *********************/

var fs = require('fs'),
	child_process = require('child_process'),
	utils = require('utils'),
	_ = require('underscore');

/*********************
 * Custom modules    *
 *********************/
var SheetManager   = require('./src/retriever/sheetmanager');
var sheetUtils     = require('./src/retriever/sheetUtils');
var crawler        = require('./src/crawler/index');
// var Config         = require('./Config');

/*********************
 * Models            *
 *********************/
var Logger = new (require('./src/models/Log'))();
var StyleRule = require('./src/models/StyleRule');
var Website = require('./src/models/Website');
var Page = require('./src/models/Page');
var URL = require('./src/models/URL');

/*********************
 * Polyfills         *
 *********************/

if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(searchString, position) {
		var subjectString = this.toString();
		if (position === undefined || position > subjectString.length) {
			position = subjectString.length;
		}
		position -= searchString.length;
		var lastIndex = subjectString.indexOf(searchString, position);
		return lastIndex !== -1 && lastIndex === position;
	};
}

Number.isInteger = Number.isInteger || function(value) {
    return typeof value === "number" &&
           isFinite(value) &&
           Math.floor(value) === value;
};

/*********************
 * Declare variables *
 *********************/
casper.on('remote.message', function(msg) {
	console.log('[remote] ' + msg);
});
casper.on('page.error', function(msg) {
	console.log('[error] [remote] ' + msg);
});
casper.on('step.error', function (err) {
	Logger.close();
	casper.die('die message: ' + err);
});

// var dataFolder = config.dataFolder;
var dataFolder = fs.workingDirectory + '/../data/';
console.log('data: ' + dataFolder);

var visitedUrls = [],
	pendingUrls = [],
	visitedPages = {},
	pendingPages = {};


if (!casper.cli.options.url) {
	console.error('[error] The url argument is not given.');
	console.error('[error] Usage: casperjs --url=<url> [--websiteId=<id>]');
	casper.exit();
}

casper.cli.options.url = casper.cli.options.url.replace('www.', '');
var baseUrl = new URL(casper.cli.options.url);
var websiteId = casper.cli.options.id;
var website;
var pageLimit = Infinity;
var CSPPAGE = false;
var sheetManager;

if (casper.cli.has("pageLimit") && Number.isInteger(casper.cli.options.pageLimit)) {
	pageLimit = casper.cli.options.pageLimit;
}

/*********************
 * Detection process *
 *********************/
casper.start(baseUrl.full(), function(response) {
	console.log('Crawling ' + baseUrl.full() + ' (' + (pageLimit < Infinity ? (pageLimit + ' page limit') : 'no page limit') + ')');

	website = new Website(baseUrl, websiteId);

	sheetManager = new SheetManager(baseUrl, website)

	Logger.init(website);
	Logger.log('Created website', 'debug');
	Logger.log('Created log', 'debug');
	Logger.log('Deleting stored stylesheets', 'progress', true);
	sheetUtils.deleteAll(baseUrl);

	sheetManager.findSheets();
});

casper.then(function() {
	Logger.log('Crawling website', 'progress', true);
	var page = new Page(website, website.url);

	crawler.crawl(website, page, sheetManager);
});

casper.run(function () {
	Logger.log(visitedUrls.length + ' pages found on ' + website.url.full(), 'progress', true);

	var stats = sheetManager.getUnusedRules();
	sheetManager.storeResults(visitedUrls, stats);
	// sheetManager.storeRuleUsage();

	Logger.close();
	casper.exit();
});

casper.POST = function POST (route, data) {
	return casper.sendAJAX(route, 'POST', data);
}

casper.PUT = function PUT (route, data) {
	return casper.sendAJAX(route, 'PUT', data);
}

casper.GET = function GET (route) {
	return casper.sendAJAX(route, 'GET');
}

casper.sendAJAX = function sendAJAX(route, method, data) {
	var url = 'http://localhost:8000' + route;

	data = JSON.stringify(data, function replacer (key, value) {
		if (value == Infinity) {
			return 'Infinity';
		}
		return value;
	});

	if (!CSPPAGE) {
		var res = casper.evaluate(function (url, method, data) {
			var xhr = new XMLHttpRequest();

			method = method && method.toUpperCase() || "GET";

			xhr.open(method, url, false);

			if (method === "POST") {
				data = data;
				xhr.setRequestHeader("Content-Type", "application/json");
			}

			xhr.send(method === "POST" ? data : null);

			if (xhr.getResponseHeader('Content-Type') &&
				xhr.getResponseHeader('Content-Type').toLowerCase().indexOf('application/json') > -1) {
				return JSON.parse(xhr.responseText);
			}

			return xhr.responseText;
		}, {
			url: url,
			method: method,
			data: data
		});

		// console.log('Request: ' + url);
		// console.log(JSON.stringify(res).substring(0, 100));

		return res;
	}
	else {

	}
};
