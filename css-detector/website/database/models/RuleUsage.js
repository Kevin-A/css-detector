module.exports = function (sequelize, DataTypes) {
	var RuleUsage = sequelize.define('RuleUsage', {

	}, {
		classMethods: {
			associate: function (models) {
			}
		}
	});

	return RuleUsage;
};
