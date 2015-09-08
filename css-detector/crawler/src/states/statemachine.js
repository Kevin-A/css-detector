'use strict';

var State = require('./State');
var Transition = require('./Transition');

function StateMachine (baseUrl) {
	var currentMachine = this;
	this.baseUrl = baseUrl;

	this.states = {};
	this.outgoing = {};
	this.incoming = {};

	var state = this.createState('begin', []);
	this.pendingStates = [state.id];
}

StateMachine.prototype.run = function () {
	var currentState, pendingEvents, pairs;

	while (this.pendingStates.length) {
		currentState = this.states[this.pendingStates.shift()];
		casper.page.setContent(currentState.content, currentState.url);

		pairs = currentState.getSelectorEventPairs();
		this.createNewStates(currentState, pairs);

		this.printStates();
	}
};

StateMachine.prototype.createNewStates = function (currentState, selectorEventPairs) {
	var self = this;
	selectorEventPairs.forEach(function (pair) {
		var selector = pair.selector;
		var eventType = pair.eventType;

		// For each event, fire, see if it is new, reset
		if (fireEvent(selector, eventType)) {
			var newState = currentState.machine.createState(selector, currentState.path);

			if (hasDOMChanged(currentState, newState)) {
				// reset DOM
				casper.page.setContent(currentState.content, currentState.url);
			}
		}
	});
}

function hasDOMChanged(currentState, newState) {
	return currentState.id === newState.id;
}

function fireEvent(selector, eventType) {
	casper.evaluate(function (selector, eventType) {
		if (window.eventLauncher) {
			window.eventLauncher.fire(selector, eventType)
		}
	}, selector, eventType);
}

/**
 *
 * @param  {String} selector The selector that was clicked to reach the state
 * @param  {[String]} path   The selectors to reach the previous state
 * @return {[type]}          [description]
 */
StateMachine.prototype.createState = function (selector, path) {
	var state = new State(this, selector, path);
	if (!this.states.hasOwnProperty(state.id)) {
		console.log('Added state: ' + state.id);
		this.states[state.id] = state;
	}
	return this.states[state.id];
}

/**
 * Transition management
 */

StateMachine.prototype.createTransition = function (from, to, action) {
	var transition = new Transition(this, from, to, action);
    if (!this.outgoing.hasOwnProperty(from.id)) {
        this.outgoing[from.id] = {};
    }
    this.outgoing[from.id][to.id] = transition;

    if (!this.incoming.hasOwnProperty(to.id)) {
        this.incoming[to.id] = {};
    }
    this.incoming[to.id][from.id] = transition;
}

StateMachine.prototype.printStates = function () {
	for (var state in this.states) {
		var state = this.states[state];
		state.print();
	}
}

module.exports = StateMachine;
