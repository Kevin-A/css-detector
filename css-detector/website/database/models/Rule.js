module.exports = function (sequelize, DataTypes) {
	var Rule = sequelize.define('Rule', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		selector: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		classMethods: {
			associate: function (models) {
				Rule.belongsTo(models.Stylesheet);

				Rule.belongsToMany(models.Page, { through: models.RuleUsage/*, as: 'Rule'*/, foreignKey: 'RuleId' });
			}
		}
	});

	return Rule;
};
