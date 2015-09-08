var Validator = require('validator');
var ResolveURI = require('../helpers').ResolveURI;
var URL = require('../models/URL');
var URI = require('URIjs');
var _ = require('underscore');

function LinkDetector(website, page, pendingUrls, visitedUrls, options) {
	this.website = website;
	this.page = page;
	this.pendingUrls = pendingUrls;
	this.visitedUrls = visitedUrls;
	this.ignoreExtensions = /(png|jpg|jpeg|gif|ico|css|js|csv|doc|docx|pdf)$/i;
	this.elementsWithLinks = elementsWithLinks;
	this.xmlElements = xmlElements;

	if (options) {
		this.stripWWW = options.stripWWW || true;
		this.ignoreSubdomains = options.ignoreSubdomains || true;
	}
}

LinkDetector.prototype.findLinks = function findLinks(contentType) {

	var self = this;

	// Gathering links on the page
	var links = [];
	if (contentType && (contentType.indexOf('text/xml') > -1 || contentType.indexOf('application/rss+xml') > -1)) {
		links = getLinksXML(this.xmlElements, casper.getHTML());
	}
	else {
		links = casper.evaluate(getLinks, this.elementsWithLinks);
	}

	links = this.filterLinks(this.website.url, links);

	var newUrls = [];

	links.forEach(function (link) {

		if (self.isNewLink(link)) {
			self.pendingUrls.push(link);
			newUrls.push(link);
		}
	});

	this.uploadNewLinks(newUrls);
	this.uploadLinks(links);
};

LinkDetector.prototype.uploadNewLinks = function (links) {
	var data = {
		url: JSON.stringify(links)
	};

	var newPages = casper.POST('/websites/' + this.website.id + '/pages', data);
	newPages.forEach(function (newPage) {
		newPage = new Page(this.website, new URL(newPage.url), newPage.id);
		this.pendingPages[newPage.url.full()] = newPage;
	});
};

LinkDetector.prototype.uploadLinks = function (links) {
	casper.POST('/links', {
		from: this.page.url.full(),
		to: JSON.stringify(links)
	});
};

LinkDetector.prototype.isNewLink = function (link) {
	return this.pendingUrls.indexOf(link) === -1 && this.visitedUrls.indexOf(link) === -1;
};

LinkDetector.prototype.addSingleLink = function (link) {
	var newLink = this.filterLinks(this.website.url, [link]);

	// valid link, continue
	if (newLink.length) {
		newLink = newLink[0];
		if (this.isNewLink(newLink)) {
			this.pendingUrls.push(newLink);
			this.uploadNewLinks([newLink]);
			this.uploadLinks([newLink]);
		}
	}
}

LinkDetector.prototype.isDefined = function (variable) {
	return (typeof variable !== 'undefined');
};

LinkDetector.prototype.filterLinks = function (baseUrl, links) {
	var self = this;

	links = _.uniq(links);
	return links
		.filter(function (url) { return Validator.isURL(url); })
		.map(function (link) {

			var url = ResolveURI(baseUrl.full(), link);
			url = url.split('#')[0];
			url = url.split('?')[0];

			if (this.stripWWW) {
				url = url.replace(/www\./i, '');
			}
			return new URL(url);
		})
		.filter(function (url) {
			// Ignore mailto's and certain extensions
			return  !url.isMail() &&
			        !url.hasExtension(self.ignoreExtensions);
		})
		.filter(function (url) {
			if (self.ignoreSubdomains) {
				// Entire host must match
				return url.host() === baseUrl.host();
			}
			else {
				// Must be on the same domain
				return url.domain() === baseUrl.domain();
			}
		})
		.map(function (url) {
			return url.full();
		});

};

// http://stackoverflow.com/questions/2725156/complete-list-of-html-tag-attributes-which-have-a-url-value
// The values may not be simple URLs, so may need to do a text find.
var elementsWithLinks = {
	a: ['href'],
	applet: ['codebase'],
	area: ['href'],
	base: ['href'],
	blockquote: ['cite'],
	del: ['cite'],
	frame: ['longdesc', 'src'],
	head: ['profile'],
	iframe: ['longdesc', 'src'],
	img: ['longdesc', 'src', 'usemap'],
	input: ['src', 'usemap', 'formaction'],
	ins: ['cite'],
	link: ['href'],
	object: ['classid', 'codebase', 'usemap', 'data'],
	q: ['cite'],
	script: ['src'],

	// HTML5
	audio: ['src'],
	button: ['formaction'],
	command: ['icon'],
	embed: ['src'],
	html: ['manifest'],
	source: ['src'],
	video: ['poster', 'src']
};

function getLinks(elementsWithLinks) {

	var selectors = document.querySelectorAll(Object.keys(elementsWithLinks).join(','));
		selectors = [].slice.call(selectors);
	var links = [];

	selectors
		.forEach(function (link) {
			for (var i = 0, len = elementsWithLinks[link.tagName.toLowerCase()].length; i < len; i++) {
				// return link.href || link.onclick || link.src || link.textContent;
				links.push(link[elementsWithLinks[link.tagName.toLowerCase()][i]]);
			}
		});

	return links
		.filter(function (href) {
			return !!href;
		});
}

var xmlElements = ['link', 'comments', 'loc'];

function getLinksXML(xmlElements, content) {
	var parser = new DOMParser();
	var xmlDoc = parser.parseFromString(content,'text/xml');

	var elements = xmlDoc.querySelectorAll(xmlElements.join(', '));
		elements = [].slice.call(elements);

	return elements
		.map(function (element) {
			return element.textContent;
		})
		.filter(function (element) {
			return !!element;
		});
}

module.exports = LinkDetector;
