// Wrapper for URLS
var URI = require('URIjs');

function URL(url) {
	this.url = new URI(url);}

URL.prototype.full = function full() {
	return this.url.href();
};

URL.prototype.hostname = function hostname() {
	return this.url.hostname();
};

URL.prototype.suffix = function suffix() {
	return this.url.suffix();
};

URL.prototype.pathname = function pathname() {
	return this.url.pathname();
};

URL.prototype.isMail = function isMail() {
	return this.url.href().indexOf('mailto:') > -1;
};

URL.prototype.host = function host() {
	return this.url.host();
};

URL.prototype.domain = function domain() {
	return this.url.domain();
};

URL.prototype.hasExtension = function hasExtension(extensions) {
	if (extensions instanceof RegExp) {
		return extensions.test(this.suffix());
	}
	else if (extensions instanceof Array) {
		return extensions.indexOf(this.suffix()) > -1;
	}
	else if (typeof extensions === "string") {
		return this.suffix() === extensions;
	}
	else {
		throw new Error('Extensions must be a regexp, array of strings, or string');
	}
};

module.exports = URL;
