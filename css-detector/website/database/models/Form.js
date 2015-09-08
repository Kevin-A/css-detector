module.exports = function (sequelize, DataTypes) {
	var Form = sequelize.define('Form', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		selector: {
			type: DataTypes.STRING,
			allowNull: false
		},
		// idAttribute: {
		// 	type: DataTypes.STRING,
		// 	allowNull: true
		// },
		// nameAttribute: {
		// 	type: DataTypes.STRING,
		// 	allowNull: true
		// }
		html: {
			type: DataTypes.STRING,
			allowNull: false
		},
		src: {
			type: DataTypes.STRING,
			allowNull: false
		},
		filledIn: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		submitted: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		values: {
			type: DataTypes.STRING,
			allowNull: true
		},
		url: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		classMethods: {
			associate: function (models) {
				Form.belongsTo(models.Page);
				Form.belongsTo(models.Website);
				Form.hasMany(models.FormField);
				// Stylesheet.hasOne(Stylesheet, { as: 'parent'});
			}
		}
	});

	return Form;
};
