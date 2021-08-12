const webpack = require('webpack');
const path = require("path");

module.exports = 
	{
		mode: "development",
		devtool: "eval-cheap-module-source-map",
		context: __dirname,

		entry: {
			app: './src/main.js'
		},
		output: {
			filename: 'ryskurl_sample.bundle.js',
			path: path.resolve(__dirname,"./public_html/")
		},
		resolve: {
			modules: ['src','node_modules','.yarn'],
			fallback: { 
				fs: false,
				path: false
			}
		},
		module: {
			rules:[
			{
				test:/\.css$/,
				use:['style-loader', "css-loader"]
			}]
		},
		optimization: 
		{
			moduleIds: "named",
			chunkIds: "named",
			splitChunks: 
			{
				cacheGroups: 
				{
					commons: 
					{
						test: /[\\/]\.yarn[\\/]/,
						name: 'vendors',
						filename: "vendors.bundle.js",
						chunks: 'all'
					}
				}
			}
		}
	};
