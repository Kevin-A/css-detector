'use strict';

function retrieveIds () {
	var allElements = document.body.getElementsByTagName('*');
	var ids = [];

	for (var i = 0, len = allElements.length; i < len; i++) {

		if (allElements[i].tagName.toLowerCase() !== 'script') {
			ids.push(getDOMPath(allElements[i]));
		}
	}
	return ids;
}

function getDOMPath(element) {
	var parents = [],
		entry;

	while (element) {
		entry = element.tagName.toLowerCase();

		if (entry === 'html') {
			break;
		}

		var sibIndex = 0;
		var sibCount = element.parentElement.children.length;
		for (var i = 0; i < sibCount; i++) {
			var sibling = element.parentElement.children[i];
			if (sibling === element) {
				sibIndex = i;
			}
		}

		if (element.hasAttribute('id') && element.id !== '') {
			entry = entry + '#' + element.id;
		}
		else if (sibCount > 1) {
			entry = entry + ':nth-child(' + (sibIndex + 1) + ')';
		}
		parents.push(entry);
		element = element.parentNode;
	}
	parents.reverse();
	return parents.join(" > ");
}

function stringifyDOM (element) {
	var output = '<body>';

	for (var i = 0; i < element.children.length; i++) {
		output += stringifyElement(element.children[i]);
	}

	output += '</body>';

	return output;
}

function stringifyElement (element) {
	var output = '<' + element.tagName.toLowerCase();

	var attributes = [];
	for (var i = 0; i < element.attributes.length; i++) {
		var attr = element.attributes[i];
		attributes.push(attr.name + '="' + attr.value + '"');
	}
	output += (attributes.length > 0 ? ' ' : '') + attributes.join(' ');
	output += '>';

	for (var i = 0; i < element.children.length; i++) {
		output += stringifyElement(element.children[i]);
	}

	output += '</' + element.tagName.toLowerCase() + '>';

	return output;
}
