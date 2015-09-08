var exec = require('child_process').exec;
var Joi = require('joi');
var URL = require('url-parse');
var Validator = require('validator');
var CrawlTask = require('./crawlTask');
var Boom = require('boom');
var async = require('async');

var Database = require('../database/database');
var Website = Database.Website;
var Log = Database.Log;
var Form = Database.Form;
var LogEntry = Database.LogEntry;

var tasks = {};

function addTask(task) {
	tasks[task.url.hostname] = task;
	tasks[task.url.hostname].crawl();
}

exports.crawl = {
	validate: {
		payload: {
			url: Joi.string().required(),
			pageLimit: Joi.number().integer().required()
		}
	},
	handler: function (request, reply) {
		var url = request.payload.url;
		var pageLimit = request.payload.pageLimit;

		if (!Validator.isURL(url)) {
			return reply(Boom.badRequest("Bad URL"));
		}
		if (pageLimit < 0) {
			return reply(Boom.badRequest("pageLimit must be >= 0"));
		}

		url = new URL(url);

		Website
			.create({ url: url.href })
			.then(function (website) {
				console.log('added: ', website.url);

				var task = new CrawlTask(url, website.id, pageLimit);
				addTask(task);

				return reply.redirect('/status/' + website.id);
			})
			.catch(function (err) {

				console.log('error: ', err.message);
				return reply(Boom.badRequest(err.message));
			});
	}
}

exports.status = {
	validate: {
		params: {
			websiteId: Joi.string().required()
		}
	},
	handler: function (request, reply) {
		var websiteId = request.params.websiteId;
		var logEntries = [];

		async.parallel({
			log: function (callback) {
				getLog(websiteId, callback);
			},

			forms: function (callback) {
				getForms(websiteId, callback);
			}
		},

		function (err, results) {
			if (err) {
				console.log('err in callback');
				console.log(err);
			}

			return reply.view('status', {
				url: websiteId,
				title: 'Crawl status of ' + websiteId,
				log: results.log || [],
				forms: results.forms || []
			});
		});
	}
}

function getLog(websiteId, callback) {
	Log
	.find({
		where: {
			WebsiteId: websiteId
		}
	})
	.then(function (log) {
		if (!log) {
			console.log('no log');
			return [];
		}

		return log.getEntries({
			options: {
				raw: true
			}
		});
	})
	.then(function (entries) {

		entries = entries.map(function (entry) {
			return entry.entryText;
		})

		return callback(null, entries);
	})
	.catch(function (err) {
		return callback(err);
	});
}

function getForms(websiteId, callback) {
	Form.findAll({
		where: {
			WebsiteId: websiteId,
			filledIn: false
		},
		options: {
			raw: true
		}
	}
	)
	.then(function (forms) {
		return callback(null, forms);
	})
	.catch(function (err) {
		console.log(err);
		return callback(err);
	});
}
