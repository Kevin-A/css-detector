var exec = require('child_process').exec;
var fs = require('fs');
var Path = require('path');
var Server = require('node-http-server');
var Promise = require('bluebird');
var postcss = require('postcss');

var sheetUtils = require('../../crawler/src/retriever/sheetUtils');
var crawler = require('../../crawler/src/crawler/index');
var Stylesheet = require('../../crawler/src/models/Stylesheet');

var testsPath = '../css-detector/tests/';
var tests = [];


exports.runTests = function runTests (tests, callback) {
	// Create tests
	Promise
	.map(tests, runTest, { concurrency: 1 })
	.then(function (result) {
		console.log('result', result);
		return callback(null, result);
	})
	.catch(function (err) {
		console.log('err', err);
		return callback(err);
	})
};

function runTest(test) {
	return new Promise(function (resolve, reject) {

		console.log('  [+] Running: ' + test.path);
		console.log('    [*] Booting server...');

		bootServer(test, function (err, result) {
			if (err) {
				console.log('err', err);
				reject(err);
			}
			else {
				console.log('res', result);
				resolve(result);
			}
		});
	});
}

function bootServer(test, callback) {
	var server = Server.deploy(
		{
			port: 8010,
			root: Path.resolve(test.path),
			domain: 'localhost'
		},
		function () {
			console.log('    [*] Booting crawler...');
			crawl(test, server, callback);
		}
	);
}

function crawl(test, server, callback) {
	var crawler = exec('cd ../crawler/ && casperjs index.js --disk-cache=no --web-security=no --url=http://localhost:8010/',
		function (error, stdout, stderr) {
			if (error) {
				console.log('    [!] There was an error, this test will be skipped. See:', error);
				return runTest();
			}
			console.log(stdout);

			console.log('    [*] Crawling done, killing server');

			server.close(function () {
				console.log('    [*] Server killed')
				finishTest(test, crawler, callback);
			});
		}
	);
}

function finishTest(test, crawler, callback) {
	var data = readDataFile(test.path);

	test.success = true;

	if (!data) {
		console.log('    [!] No data.json file found, which means the test failed.');
		test.success = false;
		return callback('[!] No data.json file found, which means the test failed.');
	}

	if (test.hasUsed) {
		var usedRules = loadAndParse(test.path, 'used.css');
		var statsUsed = filterRules(usedRules, data);

		var percentage = statsUsed.percentageUsed.toFixed(1);
		console.log('    ' + (percentage === '100.0' ? '[\u221A] ' : '[\u00D7] ') + percentage + '% of expected used rules were used.');

		if (statsUsed.percentageUsed < 100.0) {
			console.log('      [u] ' + statsUsed.unusedRules.join('\n      [u] '));
			statsUsed.percentageUsed = percentage;
			test.success = false;
		}

		test.used = {
			expectedUsedRules: usedRules,
			actualUnusedRules: statsUsed.unusedRules,
			actualUsedRules: statsUsed.usedRules,
			percentageUsed: statsUsed.percentageUsed,
			percentageUnused: statsUsed.percentageUnused
		};
	}

	if (test.hasUnused) {
		var unusedRules = loadAndParse(test.path, 'unused.css');
		var statsUnused = filterRules(unusedRules, data);

		var percentage = statsUnused.percentageUnused.toFixed(1);
		console.log('    ' + (percentage === '100.0' ? '[\u221A] ' : '[\u00D7] ') + percentage + '% of expected unused rules were unused.');

		if (statsUnused.percentageUnused < 100.0) {
			console.log('      [u] ' + statsUnused.usedRules.join('\n      [u] '));
			statsUnused.percentageUnused = percentage;
			test.success = false;
		}

		test.unused = {
			expectedUnusedRules: unusedRules,
			actualUnusedRules: statsUnused.unusedRules,
			actualUsedRules: statsUnused.usedRules,
			percentageUsed: statsUnused.percentageUsed,
			percentageUnused: statsUnused.percentageUnused
		};

	}

	callback(null, test);
};


/**
 * Cannot use the functions in sheetUtils, due to the their dependency
 * on CasperJS's `fs` module.
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
function loadAndParse(path, file) {
	return extractRules(parseSheet(loadSheet(path, file)));
}

function loadSheet(path, file) {
	path = Path.resolve(path, file);

	try {
		fs.accessSync(path, fs.F_OK | fs.R_OK);
		return fs.readFileSync(path);
	}
	catch (err) {
		console.log(err);
		return '';
	}

}

function parseSheet (rawContent) {
	return postcss.parse(rawContent, { safe: true });
}

function extractRules (tree) {
	var selectors = {};

	tree.eachInside(function (node) {
		if (node.type === 'rule') {
			node.selectors.forEach(function (selector) {
				selectors[selector] = [];
			});
		}
	});

	return selectors;
}

/**
 * A rule is tagged as correct if it is expected to be used
 * and it is actually used. Same vice versa.
 * @param  {[type]} sheet [description]
 * @param  {[type]} data  [description]
 * @return {[type]}       [description]
 */

function filterRules(rules, data) {
	var	usedRules = [];
	var unusedRules = [];

	for (rule in rules) {
		if (data.rules[rule].length === 0) {
			unusedRules.push(rule);
		}
		else {
			usedRules.push(rule);
		}
	}

	return {
		percentageUsed: Object.keys(usedRules).length / Object.keys(rules).length * 100,
		percentageUnused: Object.keys(unusedRules).length / Object.keys(rules).length * 100,
		usedRules: usedRules,
		unusedRules: unusedRules
	}
}

function readDataFile(path) {
	try {
		var dataFile = '../data/localhost/data.json';
		fs.accessSync(dataFile, fs.F_OK | fs.R_OK);
		return JSON.parse(fs.readFileSync(dataFile));
	}
	catch (err) {
		console.log(err);
		return;
	}
}
