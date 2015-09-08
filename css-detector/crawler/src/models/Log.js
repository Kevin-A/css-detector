var fs = require('fs');
var _websiteUrl, _websiteId, _id, _entries = [], initialized = false, silentMode = false;

function Log () {}

Log.prototype.initSilent = function (dataFolder) {
	initialized = true;
	silentMode = true;
	if (dataFolder) {
		this.file = fs.open(dataFolder + '/' + website.id + '/log.txt', 'w');
	}
};

Log.prototype.init = function (website) {
	if (initialized === false) {
		if (!website.url) {
			throw new Error('website.url cannot be null');
		}
		if (!website.id) {
			throw new Error('website.id cannot be null');
		}

		this.file = fs.open(dataFolder + '/' + website.id + '/log.txt', 'w');

		var response = casper.POST('/logs', { websiteId: website.id });

		if (!response.hasOwnProperty('id')) {
			throw new Error('Logger is not properly created: ', response);
		}

		_websiteUrl = website.url.full();
		_websiteId = website.id;
		_id = response.id;
		_entries = [];

		initialized = true;
	}
};

Log.prototype.log = function (entryText, entryType, toConsole) {
	if (initialized === false) {
		throw new Error('Logger has not been initialized yet.');
	}
	if (silentMode === true) {
		return;
	}

	entryType = entryType || "status";

	var entry = {
		entryText: entryText,
		entryType: entryType
	};
	_entries.push(entry);

	if (toConsole === true) {
		console.log('[' + entryType + '] ' + entryText);
	}
	this.file.writeLine('[' + entryType + '] ' + entryText);

	var response = casper.POST('/logs/' + _id + '/entries', entry);
	// console.log('response', response);
	// casper.thenOpen('http://localhost:8000/logs/' + _id + '/entries', {
	// 	method: 'post',
	// 	data: entry
	// });

	// casper.then(function () {
	// 	console.log(casper.getPageContent());
		if (!response || !response.hasOwnProperty('id')) {
			throw new Error('LogEntry is not properly created: ' + response);
		}
	// 	casper.back();
	// })

};

Log.prototype.close = function () {
	if (this.file) {
		this.file.flush();
		this.file.close();
	}
};

module.exports = Log;
