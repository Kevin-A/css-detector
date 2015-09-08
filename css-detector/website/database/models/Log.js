module.exports = function (sequelize, DataTypes) {
	var Log = sequelize.define('Log', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		}
	}, {
		classMethods: {
			associate: function (models) {
				Log.belongsTo(models.Website);
				Log.hasMany(models.LogEntry, { as: 'Entries' });
			}
		}
	});

	return Log;
};
