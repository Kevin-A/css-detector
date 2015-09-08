'use strict';
var sha1 = require('../helpers').sha1;
var CSSOM = require('./CSSOM');

var validTypes = ['internal', 'external'];

function isBoolean(value) {
	return value === true || value === false || typeof value === 'boolean';
}

function Stylesheet (websiteUrl, sourceUrl, type, isImport, rawContent) {

	this.setSourceUrl(sourceUrl);
	this.setType(type);
	this.setImport(isImport);
	this.setRawContent(rawContent || '');
	this.setPath('');
	this.setWebsiteUrl(websiteUrl);
	this.cssom = new CSSOM('');
	this.selectors = {};
	this.rules = [];

	if (type === 'internal') {
		this.signature = sha1(rawContent);
	}
	else {
		this.signature = sha1(sourceUrl.full());
	}
}

Stylesheet.prototype.setSelectors = function (selectors) {
	this.selectors = selectors;
};
Stylesheet.prototype.setRules = function (rules) {
	this.rules = rules;
};
Stylesheet.prototype.setParent = function (parent) {
	this.parent = parent;
};

Stylesheet.prototype.setCSSOM = function (cssom) {
	this.cssom = cssom;
};

Stylesheet.prototype.setWebsiteUrl = function (value) {
	this.websiteUrl = value;
};

Stylesheet.prototype.setPath = function (value) {
	this.path = value;
};

Stylesheet.prototype.setSourceUrl = function (sourceUrl) {
	this.sourceUrl = sourceUrl;
};

Stylesheet.prototype.setType = function (type) {
	if (validTypes.indexOf(type) === -1) {
		throw new Error('"type" is not one of ' + validTypes);
	}
	this.type = type;
};

Stylesheet.prototype.setRawContent = function (value) {
	this.rawContent = value;
};

Stylesheet.prototype.setImport = function (value) {
	if (!isBoolean(value)) {
		throw new Error('"import" is not a boolean');
	}
	this.isImport = value;
};

Stylesheet.prototype.toObject = function () {
	return {
		sourceUrl: this.sourceUrl.full(),
		type: this.type,
		path: this.path,
		selectors: JSON.stringify(Object.keys(this.selectors))
	};
};

module.exports = Stylesheet;
