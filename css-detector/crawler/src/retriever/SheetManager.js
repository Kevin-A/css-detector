'use strict';
var externalSheets = require('./externalSheets');
var internalSheets = require('./internalSheets');
var sheetUtils     = require('./sheetUtils');
var fs = require('fs');

var StyleRule = require('../models/StyleRule');

function SheetManager(baseUrl, website) {
	this.baseUrl = baseUrl;
	this.website = website;
	this.stylesheets = {};
}

SheetManager.prototype.findSheets = function () {
	var currentManager = this;

	Logger.log('Finding internal and external stylesheets', 'progress', true);
	var detectedSheets = externalSheets.searchLinks()
		.concat(internalSheets.search(currentManager.website.url));

	var signatures = detectedSheets.map(function (sheet) {
		return sheet.signature;
	});

	console.log('Found ' + detectedSheets.length + ' style sheets');

	detectedSheets = this.filterDuplicateSheets(detectedSheets);
	detectedSheets = this.storeSheets(detectedSheets);
	detectedSheets = this.parseSheets(detectedSheets);
	detectedSheets = this.processImports(detectedSheets);
	detectedSheets = this.process(detectedSheets);
	// Add sheets to the collection
	detectedSheets.forEach(function (sheet) {
		currentManager.stylesheets[sheet.signature] = sheet;
	});

	return signatures;
};

SheetManager.prototype.hasSheet = function (signature) {
	return this.stylesheets.hasOwnProperty(signature);
};

SheetManager.prototype.filterDuplicateSheets = function (detectedSheets) {
	var currentManager = this;

	function isNew (stylesheet) {
		console.log('Found stylesheet: ' + stylesheet.sourceUrl.full());
		return !currentManager.hasSheet(stylesheet.signature);
	}

	return detectedSheets.filter(isNew);
};


SheetManager.prototype.storeSheets = function (detectedSheets) {
	var currentManager = this;

	return detectedSheets.map(function (currentSheet) {
		if (currentSheet.type === 'internal') {
			currentSheet = internalSheets.store(currentManager.website.url, currentSheet);
		}
		else if (currentSheet.type === 'external') {
			currentSheet = externalSheets.download(baseUrl, currentSheet);
			currentSheet = sheetUtils.loadSheet(currentSheet);
		}
		return currentSheet;
	});
};


SheetManager.prototype.parseSheets = function (detectedSheets) {
	Logger.log('Parsing stylesheets', 'progress', true);

	return detectedSheets.map(sheetUtils.parseSheet);
};
SheetManager.prototype.processImports = function (detectedSheets) {
	Logger.log('Downloading imports', 'progress', true);
	detectedSheets = sheetUtils.downloadImports(this, detectedSheets);
	return detectedSheets;
};

SheetManager.prototype.process = function (stylesheets) {

	var currentManager = this;

	return stylesheets.map(function (stylesheet) {
		Logger.log('Extracting rules', 'progress', true);

		stylesheet = sheetUtils.extractRules(stylesheet);

		Logger.log('Storing stylesheet in DB', 'progress', true);
		Logger.log('Creating StyleRule objects', 'debug', true);

		var res = casper.POST('/websites/' + currentManager.website.id + '/stylesheets', stylesheet.toObject());

		if (res.hasOwnProperty('rules')) {
			res.rules = res.rules.map(function (rule) {
				return new StyleRule(rule.selector, rule.id);
			});
			stylesheet.setRules(res.rules);
		}
		else {
			console.log(JSON.stringify(res));
			Logger.log('Rules were not part of the response object', 'error', true);
		}

		return stylesheet;
	});
};

SheetManager.prototype.getUnusedRules = function () {
	Logger.log('Gathering the amount of obsolete rules', 'progress', true);

	var unused = 0;
	var unusedRules = [];
	var total = 0;
	for (var key in this.stylesheets) {
		var sheet = this.stylesheets[key];
		for (var i in sheet.rules) {
			total += 1;
			if (sheet.rules[i].pages.length === 0) {
				// console.log('[rule] [unused] ' + rule);
				unusedRules.push(sheet.rules[i].selector);
				unused += 1;
			}
		}
	}
	var used = total - unused;
	return {
		total: total,
		obsolete: unused,
		unusedRules: unusedRules,
		used: used,
		percentage: ((used / total) * 100)
	};
};

SheetManager.prototype.storeRuleUsage = function () {
	// Create array containing rule-page pairs
	var fromTo = [];

	for (var key in this.stylesheets) {
		var sheet = this.stylesheets[key];

		for (var i in sheet.rules) {
			for (var j in sheet.rules[i].pages) {
				fromTo.push({
					RuleId: sheet.rules[i].id,
					PageId: sheet.rules[i].pages[j].id
				});
			}
		}
	}

	var res = casper.POST('/websites/' + website.id + '/ruleusages', { connections: fromTo });
};

SheetManager.prototype.storeResults = function (visitedUrls, stats) {

	Logger.log('Storing results', 'progress', true);

	var result = {};
	result.rules = {};

	for (var sig in this.stylesheets) {
		var sheet = this.stylesheets[sig];

		for (var key in sheet.rules) {
			result.rules[sheet.rules[key].selector] = sheet.rules[key].pages;
		}
	}

	result.urls = visitedUrls;
	result.stats = stats;
	result.website = this.website.url;

	var dest = dataFolder + '/' + website.id + '/data.json';
	fs.write(dest, JSON.stringify(result, null, '\t'), 'w');

	dest = dataFolder + '/' + website.url.hostname() + '/data.json';
	fs.write(dest, JSON.stringify(result, null, '\t'), 'w');

	Logger.log('Results stored.', 'progress', true);
};

module.exports = SheetManager;
