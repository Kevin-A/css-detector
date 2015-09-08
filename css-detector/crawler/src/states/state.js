'use strict';

var sha1 = require('sha1');

function State(statemachine, selector, path) {
	this.machine = statemachine;
	this.selector = selector;
	var state = this;

	this.dom = getDOM();
	this.content = casper.getPageContent();
	this.url = casper.getCurrentUrl();
	this.events = getEvents();
	this.id = sha1(this.dom);

	this.path = [];
	if (this.selector === 'start') {
		this.path = path.concat(this.selector);
	}

	casper.capture(this.id + '.png');

	this.print();
}

State.prototype.getPath = function() {
	return this.path;
};

State.prototype.setPath = function(path) {
	this.path = path;
};

/**
 * Returns a list of all outgoing transitions
 * @return {[Transition]} List of Transition objects
 */
State.prototype.outgoing = function () {
	if (!this.machine.outgoing.hasOwnProperty(this.id)) {
        return [];
    }
    var transitions = this.machine.outgoing[this.id];
    var outgoing = [];
    for (var to in transitions) {
        outgoing.push(transitions[to]);
    }
    return outgoing;
}

/**
 * Returns a list of all incoming transitions
 * @return {[Transition]} List of Transition objects
 */
State.prototype.incoming = function () {
    if (!this.machine.incoming.hasOwnProperty(this.id)) {
        return [];
    }
    var transitions = this.machine.incoming[this.id];
    var incoming = [];
    for (var from in transitions) {
        incoming.push(transitions[from]);
    }
    return incoming;
};

State.prototype.getSelectorEventPairs = function () {
	var pairs = [];
	for (var key in this.events) {
		for (var signature in this.events[key]) {
			for (var i = 0, len = this.events[key][signature].length; i < len; i++) {
				pairs.push({
					eventType: key,
					selector: this.events[key][signature][i]
				});
			}
		}
	}
	return pairs;
}

function getDOM() {
	return casper.evaluate(function () {
		return stringifyDOM(document.body);
	});
}

function getEvents() {
	return casper.evaluate(function () {
		return window.eventContainer !== undefined ?
			window.eventContainer.getEvents(document) : {};
	});
}

State.prototype.print = function () {
	console.log('--------- State ---------');
		console.log('id: ' + this.id);
		console.log('selector: ' + this.selector);
		console.log('path: ' + JSON.stringify(this.path));
		console.log('events: ', JSON.stringify(this.events, null, 4));
		console.log('-------------------------')
}

module.exports = State;
