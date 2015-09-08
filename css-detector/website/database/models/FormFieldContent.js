module.exports = function (sequelize, DataTypes) {
	var FormFieldContent = sequelize.define('FormFieldContent', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		value: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		classMethods: {
			associate: function (models) {
				FormFieldContent.belongsTo(models.FormField);
			}
		}
	});

	return FormFieldContent;
};
