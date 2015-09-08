'use strict';

var sha1 = require('sha1');

function Transition (machine, fromState, toState, action) {
	this.machine = machine;
	this.fromState = fromState;
	this.toState = toState;
	this.action = action;

	this.id = sha1(fromState.id + toState.id + action.id);
}

module.exports = Transition;
