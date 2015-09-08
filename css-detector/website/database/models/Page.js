module.exports = function (sequelize, DataTypes) {
	var Page = sequelize.define('Page', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		url: {
			type: DataTypes.STRING,
			allowNull: false
		},
		visited: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	}, {
		// indexes: [
		// 	{
		// 		name: 'url_website_unique',
		// 		unique: true,
		// 		primary: false,
		// 		fields: ['url', 'WebsiteId']
		// 	}
		// ],
		classMethods: {
			associate: function (models) {
				Page.belongsTo(models.Website);

				Page.belongsToMany(models.Page, { through: 'Links', as: 'IncomingLinks', foreignKey: 'to' });
				Page.belongsToMany(models.Page, { through: 'Links', as: 'Links', foreignKey: 'from' });

				Page.belongsToMany(models.Rule, { through: models.RuleUsage/*, as: 'Rules'*/, foreignKey: 'PageId'})
			}
		}
	});

	return Page;
};
