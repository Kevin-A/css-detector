var Database = require('../database/database');
var Website = Database.Website;
var Joi = require('joi');
var Boom = require('boom');

exports.create = {
	validate: {
		payload: {
			url: Joi.string().required()
		}
	},
	handler: function (request, reply) {
		var url = request.payload.url;

		Website
			.create({ url: url })
			.then(function (website) {
				console.log('added: ', website.url);
				return reply(website);
			})
			.catch(function (err) {
				console.log('error: ', err.message);
				return reply(Boom.badRequest(err.message));
			});
	}
}
