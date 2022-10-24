const webpack = require('webpack');
const path = require("path");

module.exports = {
	mode: "development",
	devtool: "eval-cheap-module-source-map",
	context: path.resolve(__dirname,'src'),
	experiments: { topLevelAwait: true },
	entry: {
		app: './app.js'
	},
	output: {
		filename: './rysk.bundle.js',
		path: path.resolve(__dirname,"public_html/build")
	},
	module: {
		rules:[
		{
			test:/\.css$/,
			use:['style-loader', "css-loader"]
		},
		{
			test: /\.(png|jpg)$/,
			type: 'asset/inline'
		},
		{
			test: /\.wasm$/,
			type: 'asset/resource'
		}]
	},
	resolve: {
		modules: ['src','node_modules'],
		fallback: { 
			fs: false,
			path: false
		}
	},
	optimization: {
		moduleIds: "named",
		chunkIds: "named",
		splitChunks: 
		{
			cacheGroups: 
			{
				mantis:
				{
					test: /[\\/]node_modules[\\/]@mantisvision[\\/](.+)[\\/]/,
					name: 'mantis',
					filename: "mantis.rysk.bundle.js",
					chunks: "all"
				},
				commons: 
				{
					test: /[\\/]node_modules[\\/](?!@mantisvision[\\/].+[\\/])/,
					name: 'vendors',
					filename: "vendors.rysk.bundle.js",
					chunks: 'all'
				}
			}
		}
	}
};
