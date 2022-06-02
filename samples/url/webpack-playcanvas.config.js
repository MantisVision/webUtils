const webpack = require('webpack');
const path = require("path");

module.exports = 
	{
		mode: "development",
		devtool: "eval-cheap-module-source-map",
		context: __dirname,

		entry: {
			app: './src/main-playcanvas.js'
		},
		output: {
			filename: 'playcanvas_sample.bundle.js',
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
			},
			{
				test: /\.less$/,
				use: ['style-loader',"css-loader",'less-loader'] // compiles Less to CSS
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
