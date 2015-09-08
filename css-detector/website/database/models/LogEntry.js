module.exports = function (sequelize, DataTypes) {
	var LogEntry = sequelize.define('LogEntry', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		entryText: {
			type: DataTypes.STRING,
			allowNull: false
		},
		entryType: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		classMethods: {
			associate: function (models) {
				LogEntry.belongsTo(models.Log);
			}
		}
	});

	return LogEntry;
};
