module.exports = function (sequelize, DataTypes) {
	var Website = sequelize.define('Website', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		url: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		classMethods: {
			associate: function (models) {
				Website.hasMany(models.Page);
				Website.hasMany(models.Stylesheet);
			}
		}
	});

	return Website;
};
