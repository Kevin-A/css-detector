var fs = require('fs');
var Path = require('path');
var Joi = require('joi');

var Tester = require('./tester');

var location = '../tests/';
var tests = [];
var running = false;
findTests(location)

function findTests(testsPath) {
	var contents = fs.readdirSync(testsPath);

	// Some tests can only be manual, like stylesheetOrder, so skip those.
	if (contents.indexOf('manualtest') > -1) {
		return;
	}

	if (contents.indexOf('index.html') > -1) {
		// This directory contains a test
		tests.push({
			name: testsPath.replace(/\\/g, '/').replace(location, ''),
			path: testsPath,
			hasUnused: contents.indexOf('unused.css') > -1,
			hasUsed: contents.indexOf('used.css') > -1
		});
	}

	// Perhaps it is nested, recurse
	contents.map(function (e) {
		var path = Path.join(testsPath, e);
		var stats = fs.statSync(path);

		if (stats.isDirectory()) {
			findTests(path);
		}
	});
}


exports.overview = {
	handler: function (request, reply) {
		return reply.view('testsuite', { tests: tests, title: 'Test suite', running: running });
	}
};

exports.run = {
	handler: function (request, reply) {
		Tester.runTests(tests, function (err, results) {
			if (results) {
				tests = results;
				running = false;
			}
		});
		running = true;

		return reply.redirect('/tests');
	}
};

exports.test = {
	validate: {
		params: {
			testName: Joi.string()
		}
	},
	handler: function (request, reply) {
		var testName = request.params.testName;

		var test = null;
		tests.forEach(function (currentTest) {
			if (currentTest.name === testName) {
				test = currentTest;
				return;
			}
		});

		if (!test) {
			// DOES NOT EXIST DAMN IT.

		}

		return reply.view('testinfo', {
			test: test,
			title: 'Tests - ' + test.name
		});
	}
};
