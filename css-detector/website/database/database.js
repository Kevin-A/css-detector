var Sequelize = require('sequelize');
var Config = require('../config');

var sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',

	pool: {
		max: 5,
		min: 0,
		idle: 10000
	},

	storage: Config.dataFolder + '/data.sqlite',
	logging: false
});

module.exports = require('./models/index')(sequelize);
