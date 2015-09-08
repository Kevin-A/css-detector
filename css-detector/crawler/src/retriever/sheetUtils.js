'use strict';

var externalSheets = require('./externalSheets');
var ResolveURI = require('../helpers').ResolveURI;
var fs = require('fs');
var CSSOM = require('../models/CSSOM');
var Stylesheet = require('../models/Stylesheet');

/**
 * A wrapper around fs. If calling this through casperjs
 * fs is different from when calling this though iojs
 * @param  {[type]}  path [description]
 * @return {Boolean}      [description]
 */
function isFile(path) {
	// CasperJS version
	if (fs.isFile) {
		return fs.isFile(path);
	}
	// io.js version
	else {
		try {
			fs.accessSync(path, fs.F_OK | fs.R_OK);
			return true;
		}
		catch (err) {
			Logger.log(err, 'error');
			return false;
		}
	}
}
function readFile(path) {
	// CasperJS
	if (fs.workingDirectory) {
		return fs.read(path);
	}
	// io.js
	else {
		return fs.readFileSync(path, {
			encoding: 'utf-8'
		});
	}
}

/**
 * Loads a specific stylesheet and stores its content in rawContent
 * @param  {[type]} sheet [description]
 * @return {[type]}       [description]
 */
exports.loadSheet = function loadSheet(sheet) {
	if (isFile(sheet.path)) {
		sheet.setRawContent(readFile(sheet.path) || '');
	}
	else {
		Logger.log('Oh dear it seems as if the following path is not a file: ' + sheet.path, 'error', true);
	}

	return sheet;
};


exports.parseSheet = function parseSheet(sheet) {
	try {
		sheet.setCSSOM(new CSSOM(sheet.rawContent));
	}
	catch (err) {
		Logger.log(err, 'error', true);
		sheet.setCSSOM(new CSSOM(''));
	}

	return sheet;
};


exports.downloadImports = function downloadImports(sheetManager, detectedSheets) {
	/*
		For each CSSOM in stylesheets loop through the rules and
		gather all the @import statements. Once a non-@import has been
		found, stop with this CSSOM.
	 */

	function handleImport (currentSheet, rule) {

		/**
		 * Strip all "", '', url(""), url('')
		 * @param  {[type]} rule [description]
		 * @return {[type]}      [description]
		 */
		function parseImportRule(rule) {
			var href = rule.params.split(' ')[0];
			return href.replace(/"|'|url|\(|\)/gi, '');
		}

		var importUrl = parseImportRule(rule);
		var source = new URL(ResolveURI(sheetManager.baseUrl.full(), importUrl));

		console.log('source for imported sheet: ' + source.full());

		var newSheet = new Stylesheet(
			baseUrl,
			source,
			'external',
			true
		);

		// Skip if we already downloaded this one.
		if (sheetManager.hasSheet(newSheet.signature)) {
			return;
		}
		console.log('Start downloading of imported sheet');
		newSheet = externalSheets.download(baseUrl, newSheet);
		newSheet.setParent(currentSheet.signature);
		console.log('Start loading imported sheet');
		newSheet = exports.loadSheet(newSheet);
		console.log('Start parsing imported sheet');
		newSheet = exports.parseSheet(newSheet);

		// Push to the list and mark as processed
		// detectedSheets.push(newSheet);
		sheetManager.stylesheets[newSheet.signature] = newSheet;
	}

	detectedSheets.forEach(function (currentSheet) {
		currentSheet.cssom.eachAtRule('import', function (importRule) {
			console.log('Found import rule in ' + currentSheet.signature);
			handleImport(currentSheet, importRule);
		});
	});

	return detectedSheets;
};


exports.deleteAll = function deleteAll(baseUrl) {
	var directory = dataFolder + '/' + baseUrl.hostname();

	Logger.log('deleting: ' + directory, 'progress', true);

	fs.removeTree(directory);
};

exports.extractRules = function extractRules(stylesheet) {
	stylesheet.selectors = stylesheet.cssom.getSelectors();

	console.log(stylesheet.signature + ' has ' + Object.keys(stylesheet.selectors).length + ' selectors');

	return stylesheet;
};
