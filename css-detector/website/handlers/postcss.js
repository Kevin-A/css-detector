var postcss = require('postcss');
var Joi = require('joi');

/**
 * Offloaded the parsing of css to the web server due to incompatibility with Phantom.
 * This parser was of high importance due to its graceful error handling. It doesn't just
 * stop the parsing process. It is also very up to date, the others weren't.
 */

exports.parse = {
	validate: {
		payload: {
			rawContent: Joi.string().required()
		}
	},
	handler: function (request, reply) {

		parseCSS(request.payload.rawContent, function (err, tree) {
			if (err) {
				reply(JSON.stringify(postcss.parse(''))).header('Content-type', 'application/json');
			}
			else {
				reply(JSON.stringify(tree)).header('Content-type', 'application/json');
			}
		});
	}
}

var parseCSS = function parseCSS(rawContent, callback) {
	try {
		var tree = postcss.parse(rawContent, { safe: true });

		tree.eachInside(function (node) {
			node.selectorList = node.selectors;
			delete node.parent;
			delete node.source;
		});

		delete tree.source;

		callback(null, tree);
		tree = null;
	}
	catch (err) {
		// todo note as failed
		console.log(err);
		callback(err);
	}
}
exports.parseCSS = parseCSS;
