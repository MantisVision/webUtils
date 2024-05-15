import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default
	{
		mode: "production",
		devtool: "source-map",
		context: __dirname,

		entry: {
			three: './src/main-three.js',
			playcanvas: './src/main-playcanvas.js',
			aframe: './src/main-aframe.js'
		},
		output: {
			filename: '[name].bundle.js',
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
						filename: "mantis.bundle.js",
						chunks: "all"
					},
					commons: 
					{
						test: /[\\/]node_modules[\\/](?!@mantisvision[\\/].+[\\/])/,
						name: 'vendors',
						filename: "vendors.bundle.js",
						chunks: 'all'
					}
				}
			}
		}
	};
