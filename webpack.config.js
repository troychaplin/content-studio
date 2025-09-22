const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
	...defaultConfig,
	entry: {
		...defaultConfig.entry,
		admin: [path.resolve(__dirname, 'src/admin.js')],
	},
	output: {
		...defaultConfig.output,
		path: path.resolve(__dirname, 'build'),
		filename: '[name].js',
	},
};
