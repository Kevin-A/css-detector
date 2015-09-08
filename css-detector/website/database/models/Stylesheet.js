module.exports = function (sequelize, DataTypes) {
	var Stylesheet = sequelize.define('Stylesheet', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		sourceUrl: {
			type: DataTypes.STRING,
			allowNull: false
		},
		type: {
			type: DataTypes.ENUM,
			values: ['internal', 'external'],
			allowNull: false
		},
		import: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		path: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		classMethods: {
			associate: function (models) {
				Stylesheet.belongsTo(models.Website);
				Stylesheet.hasMany(models.Rule);
				Stylesheet.hasOne(Stylesheet, { as: 'parent'});
			}
		}
	});

	return Stylesheet;
};
