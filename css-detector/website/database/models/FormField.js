module.exports = function (sequelize, DataTypes) {
	var FormField = sequelize.define('FormField', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false
		},
		selector: {
			type: DataTypes.STRING,
			allowNull: false
		},
		idAttribute: {
			type: DataTypes.STRING,
			allowNull: true
		},
		nameAttribute: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		classMethods: {
			associate: function (models) {
				FormField.belongsTo(models.Form);
				FormField.hasOne(models.FormFieldContent);
			}
		}
	});

	return FormField;
};
