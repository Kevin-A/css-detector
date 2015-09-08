var Database = require('../database/database');
var Website = Database.Website;
var Log = Database.Log;
var LogEntry = Database.LogEntry;
var Joi = require('joi');
var Boom = require('boom');
var Mediator = require('../casper/mediator');

exports.create = {
	validate: {
		payload: {
			websiteId: Joi.number().integer().required()
		}
	},
	handler: function (request, reply) {
		var websiteId = request.payload.websiteId;

		Website.find({
			where: { id: websiteId }
		}).then(function (website) {

			if (!website) {
				return reply(Boom.notFound('There is no record of a website with an id of "' + websiteId + '".'));
			}

			Log.create({ WebsiteId: websiteId }).then(function (log) {
				return reply(log).code(201).header('Location', '/logs/' + log.id);
			}).catch(function (err) {
				return reply(err);
			});
		});
	}
}

exports.createEntry = {
	validate: {
		params: {
			logId: Joi.number().integer().positive().required()
		},
		payload: {
			entryText: Joi.string().required(),
			entryType: Joi.string().required()
		}
	},
	handler: function (request, reply) {
		var logId = request.params.logId;
		var entryText = request.payload.entryText;
		var entryType = request.payload.entryType;

		Log.find({
			where: { id: logId }
		}).then(function (log) {

			if (!log) {
				return reply(Boom.notFound('There is no record of a log with an id of "' + logId + '".'));
			}

			LogEntry.create({
				entryText: entryText,
				entryType: entryType,
				LogId: logId
			}).then(function (logEntry) {
				Mediator.emit('log', log.WebsiteId, entryType, entryText);
				return reply(logEntry).code(201).header('Location', '/logs/' + log.id + '/entries/' + logEntry.id);
			}).catch(function (err) {
				return reply(err);
			});
		});
	}
}
