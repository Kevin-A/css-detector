var Stylesheet = require('../models/Stylesheet');

exports.search = function search(baseUrl) {
	var res = casper.evaluate(function () {
		var sheets =  Array.prototype.slice.call(document.querySelectorAll('style'));
		return sheets.map(
			function (e) {
				return e.textContent;
			}
		);
	});

	return res.map(function (rawContent) {
		return new Stylesheet(
			baseUrl,
			new URL(casper.getCurrentUrl()),
			'internal',
			false,
			rawContent
		);
	});
};

exports.store = function store(baseUrl, currentSheet) {
	var directory = dataFolder + '/' + baseUrl.hostname() + '/internal/';

	// store the contents
	var path = directory + currentSheet.signature + '.css';
	fs.write(path, currentSheet.rawContent, 'w');
	currentSheet.setPath(path);

	return currentSheet;
};
