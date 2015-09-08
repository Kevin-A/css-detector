var Joi = require('joi');
var Boom = require('boom');
var Mediator = require('../casper/mediator');

exports.update = {
	validate: {
		params: {
			websiteId: Joi.number().integer().positive().required()
		},
		payload: {
			pagesCrawled: Joi.number().integer().required(),
			pagesPending: Joi.number().integer().required(),
			pageLimit: Joi.number().integer().allow('Infinity', Infinity).required()
		}
	},
	handler: function (request, reply) {
		var websiteId = request.params.websiteId;

		Mediator.emit('status', websiteId, request.payload);

		return reply();
	}
}
