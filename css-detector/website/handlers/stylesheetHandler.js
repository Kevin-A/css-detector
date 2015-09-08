var Database = require('../database/database');
var Website = Database.Website;
var Page = Database.Page;
var Stylesheet = Database.Stylesheet;
var Rule = Database.Rule;
var RuleUsage = Database.RuleUsage;

var Joi = require('joi');
var Boom = require('boom');
var _ = require('underscore');

exports.create = {
	validate: {
		params: {
			websiteId: Joi.number().integer()
		},
		payload: {
			sourceUrl: Joi.string().required(),
			type: Joi.string().required(),
			path: Joi.string().required(),
			import: Joi.boolean().default(false),
			selectors: Joi.array().items(Joi.string())
			// parent: Joi.number().integer().positive().optional()
		}
	},
	handler: function (request, reply) {
		var websiteId = request.params.websiteId;
		var sourceUrl = request.payload.sourceUrl;
		var type = request.payload.type;
		var path = request.payload.path;
		var _import = request.payload.import;
		var selectors = request.payload.selectors || [];
		// var parent = request.payload.parent;

		Website.find({
			where: { id: websiteId }
		}).then(function (website) {

			if (!website) {
				return reply(Boom.notFound('There is no record of a website with an id of "' + websiteId + '".'));
			}

			Stylesheet.create({
				sourceUrl: sourceUrl,
				type: type,
				import: _import,
				path: path
			}).then(function (stylesheet) {

				stylesheet.setWebsite(website).then(function () {

					selectors = selectors.map(function (selector) { return { selector: selector, StylesheetId: stylesheet.id }; });

					// Create and then retrieve all rules
					// Cannot do this in a single call, due to limitations of Sequelize
					createRules(selectors, 0, function (err, result) {

						if (err) {
							// console.log(err);
							return reply(err);
						}

						Rule.findAll({ where: { StylesheetId: stylesheet.id }}).then(function (rules) {

							// grab id and selector
							stylesheet.dataValues.rules = rules.map(function (rule) {
								return {
									id: rule.id,
									selector: rule.selector
								};
							});

							return reply(stylesheet).code(201).header('Location', '/stylesheets/' + stylesheet.id);
						});
					})

				}).catch(function (err) {
					console.log(err);
					return reply(err);
				});

			}).catch(function (err) {
				delete err.errors;
				console.log('[ERR] stylesheet.create: ', err);
				return reply(Boom.badRequest(err.message));
			});
		});
	}
}

function createRules(data, offset, next) {

	var length = data.length;
	var chunkSize = 500;

	var arrayChunk = data.slice(offset, Math.min(length, offset + chunkSize));

	Rule.bulkCreate(arrayChunk).then(function (result) {
		offset = offset + chunkSize;

		if (offset < length) {
			return createRules(data, offset, next);
		}
		else {
			return next(null, result);
		}
	}).catch (function (err) {
		return next(err);
	});
}

exports.ruleUsage = {
	validate: {
		params: {
			websiteId: Joi.number().integer()
		},
		payload: {
			connections: Joi.array().items(
				Joi.object().keys({
					PageId: Joi.number().integer(),
					RuleId: Joi.number().integer()
				})
			)
		}
	},
	handler: function (request, reply) {

		// console.log(request.payload.connections);

		createRuleUsages(request.payload.connections, 0, function (err, result) {
			if (err) {
				return reply(err);
			}

			return reply();
		});
	}
}

function createRuleUsages(data, offset, next) {

	var length = data.length;
	var chunkSize = 500;

	var arrayChunk = data.slice(offset, Math.min(length, offset + chunkSize));

	RuleUsage.bulkCreate(arrayChunk, { ignoreDuplicates: true }).then(function (result) {
		offset = offset + chunkSize;

		if (offset < length) {
			return createRuleUsages(data, offset, next);
		}
		else {
			return next(null, result);
		}
	}).catch (function (err) {
		return next(err);
	});
}
