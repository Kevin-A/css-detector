'use strict';
var ResolveURI = require('../helpers').ResolveURI;
var URL = require('../models/URL');
var Stylesheet = require('../models/Stylesheet');

exports.searchLinks = function searchLinks() {

	// Obtain all the href attributes of the link
	// within the opened page
	var links = casper.evaluate(function () {
		var sheets =  Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'));
		return sheets.map(
			function (e) {
				if (e.getAttribute('data-href')) {
					return e.getAttribute('data-href');
				}
				return e.getAttribute('href');
			}
		);
	});

	var stylesheets = links.map(function (url) {
		return new Stylesheet(
			baseUrl,
			new URL(ResolveURI(casper.getCurrentUrl(), url)),
			'external',
			false
		);
	});

	stylesheets.forEach(function (e) {
		Logger.log(e.sourceUrl.full(), 'progress', true);
	});

	return stylesheets;
};

exports.download = function download(baseUrl, currentSheet) {

	var directory = dataFolder + '/' + baseUrl.hostname() + '/external/';

	var filename = currentSheet.signature;
	if (!filename.endsWith('.css')) {
		filename += '.css';
	}

	currentSheet.setPath(directory + filename);

	console.log('Downloading ' + currentSheet.sourceUrl.full() + ' to ' + currentSheet.path);
	casper.download(currentSheet.sourceUrl.full(), currentSheet.path);

	return currentSheet;
};
