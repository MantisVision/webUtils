/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/main-playcanvas.js":
/*!********************************!*\
  !*** ./src/main-playcanvas.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _mantisvision_ryskplaycanvas__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @mantisvision/ryskplaycanvas */ \"./.yarn/cache/@mantisvision-ryskplaycanvas-npm-0.1.1-def0c3259b-1d33259086.zip/node_modules/@mantisvision/ryskplaycanvas/dist/MantisRYSKPlayCanvas.js\");\n\n\nconst video_url = \"https://www.mvkb.cc/lib/exe/fetch.php/pub/genady5.mp4\";\nconst data_url = \"https://www.mvkb.cc/lib/exe/fetch.php/pub/genady5.syk\";\n\ndocument.addEventListener('DOMContentLoaded',function()\n{\n\tvar app = null;\n\ttry\n\t{\n\t\tconst canvas = document.getElementById('playcanvas');\n\t\tapp = new pc.Application(canvas);\n\t\tconst scene = app.scene;\n\n\t\tapp.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);\n\t\tapp.setCanvasResolution(pc.RESOLUTION_AUTO);\n\n\t\tconst camera = new pc.Entity('camera');\n\t\tcamera.addComponent('camera', {\n\t\t\tclearColor: new pc.Color(1, 1, 1),\n\t\t\tprojection: pc.PROJECTION_PERSPECTIVE,\n\t\t\tfov: 70\n\t\t});\n\t\tapp.root.addChild(camera);\n\t\tcamera.setPosition(0, 1.5, -1);\n\t\tcamera.setEulerAngles(0, 180, 0);\n\n\t\t// create directional light entity\n\t\tconst light = new pc.Entity('light');\n\t\tlight.addComponent('light');\n\t\tapp.root.addChild(light);\n\t\tlight.setEulerAngles(45, 180, 0);\n\t}catch (err)\n\t{\n\t\tconsole.error(err);\n\t}\n\trun(app);\n});\n\n/**\n * Runs the whole animation\n * @param {THREE.WebGLRenderer} renderer\n * @param {THREE.Scene} scene\n * @param {THREE.PerspectiveCamera} camera\n * @returns {undefined}\n */\nfunction run(app)\n{\n\ttry\n\t{\n\t\tconst ryskObj = new _mantisvision_ryskplaycanvas__WEBPACK_IMPORTED_MODULE_0__.URLMesh(video_url,data_url,pc);\n\n\t\tryskObj.run().then(mesh => \n\t\t{//add mesh to the scene\n\t\t\tmesh.visible = true;\n\t\t\tconst entity = new pc.Entity();\n\t\t\t\n\t\t\tentity.addComponent('render',{ meshInstances: [mesh] });\t\t\n\t\t\t\n\t\t\tapp.root.addChild(entity);\n\t\t\tentity.setPosition(0,0,1)\n\t\t\tconst scale = new pc.Vec3(0.001,0.001,0.001);\n\t\t\tentity.setLocalScale(scale);\n\t\t\tapp.start();\n\t\t\t\n\t\t\tapp.on(\"frameupdate\",() => ryskObj.update());\n\t\t}); \n\n\t\tdocument.getElementById(\"play\").addEventListener(\"click\",event =>\n\t\t{//event listener for the button which plays/pauses the animation\n\t\t\tif (ryskObj !== null)\n\t\t\t{\n\t\t\t\tif (ryskObj.isPaused())\n\t\t\t\t{\n\t\t\t\t\tryskObj.play();\n\t\t\t\t\tevent.target.innerHTML = \"Pause\";\n\t\t\t\t}else\n\t\t\t\t{\n\t\t\t\t\tryskObj.pause();\n\t\t\t\t\tevent.target.innerHTML = \"Play\";\n\t\t\t\t}\n\t\t\t}\n\t\t});\n\t}catch (err)\n\t{\n\t\tconsole.error(err);\n\t}\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvbWFpbi1wbGF5Y2FudmFzLmpzLmpzIiwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9SWVNLVXJsIHNhbXBsZS8uL3NyYy9tYWluLXBsYXljYW52YXMuanM/ODI3NSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBVUkxNZXNoIH0gZnJvbSBcIkBtYW50aXN2aXNpb24vcnlza3BsYXljYW52YXNcIjtcblxuY29uc3QgdmlkZW9fdXJsID0gXCJodHRwczovL3d3dy5tdmtiLmNjL2xpYi9leGUvZmV0Y2gucGhwL3B1Yi9nZW5hZHk1Lm1wNFwiO1xuY29uc3QgZGF0YV91cmwgPSBcImh0dHBzOi8vd3d3Lm12a2IuY2MvbGliL2V4ZS9mZXRjaC5waHAvcHViL2dlbmFkeTUuc3lrXCI7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLGZ1bmN0aW9uKClcbntcblx0dmFyIGFwcCA9IG51bGw7XG5cdHRyeVxuXHR7XG5cdFx0Y29uc3QgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BsYXljYW52YXMnKTtcblx0XHRhcHAgPSBuZXcgcGMuQXBwbGljYXRpb24oY2FudmFzKTtcblx0XHRjb25zdCBzY2VuZSA9IGFwcC5zY2VuZTtcblxuXHRcdGFwcC5zZXRDYW52YXNGaWxsTW9kZShwYy5GSUxMTU9ERV9GSUxMX1dJTkRPVyk7XG5cdFx0YXBwLnNldENhbnZhc1Jlc29sdXRpb24ocGMuUkVTT0xVVElPTl9BVVRPKTtcblxuXHRcdGNvbnN0IGNhbWVyYSA9IG5ldyBwYy5FbnRpdHkoJ2NhbWVyYScpO1xuXHRcdGNhbWVyYS5hZGRDb21wb25lbnQoJ2NhbWVyYScsIHtcblx0XHRcdGNsZWFyQ29sb3I6IG5ldyBwYy5Db2xvcigxLCAxLCAxKSxcblx0XHRcdHByb2plY3Rpb246IHBjLlBST0pFQ1RJT05fUEVSU1BFQ1RJVkUsXG5cdFx0XHRmb3Y6IDcwXG5cdFx0fSk7XG5cdFx0YXBwLnJvb3QuYWRkQ2hpbGQoY2FtZXJhKTtcblx0XHRjYW1lcmEuc2V0UG9zaXRpb24oMCwgMS41LCAtMSk7XG5cdFx0Y2FtZXJhLnNldEV1bGVyQW5nbGVzKDAsIDE4MCwgMCk7XG5cblx0XHQvLyBjcmVhdGUgZGlyZWN0aW9uYWwgbGlnaHQgZW50aXR5XG5cdFx0Y29uc3QgbGlnaHQgPSBuZXcgcGMuRW50aXR5KCdsaWdodCcpO1xuXHRcdGxpZ2h0LmFkZENvbXBvbmVudCgnbGlnaHQnKTtcblx0XHRhcHAucm9vdC5hZGRDaGlsZChsaWdodCk7XG5cdFx0bGlnaHQuc2V0RXVsZXJBbmdsZXMoNDUsIDE4MCwgMCk7XG5cdH1jYXRjaCAoZXJyKVxuXHR7XG5cdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHR9XG5cdHJ1bihhcHApO1xufSk7XG5cbi8qKlxuICogUnVucyB0aGUgd2hvbGUgYW5pbWF0aW9uXG4gKiBAcGFyYW0ge1RIUkVFLldlYkdMUmVuZGVyZXJ9IHJlbmRlcmVyXG4gKiBAcGFyYW0ge1RIUkVFLlNjZW5lfSBzY2VuZVxuICogQHBhcmFtIHtUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYX0gY2FtZXJhXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxuICovXG5mdW5jdGlvbiBydW4oYXBwKVxue1xuXHR0cnlcblx0e1xuXHRcdGNvbnN0IHJ5c2tPYmogPSBuZXcgVVJMTWVzaCh2aWRlb191cmwsZGF0YV91cmwscGMpO1xuXG5cdFx0cnlza09iai5ydW4oKS50aGVuKG1lc2ggPT4gXG5cdFx0ey8vYWRkIG1lc2ggdG8gdGhlIHNjZW5lXG5cdFx0XHRtZXNoLnZpc2libGUgPSB0cnVlO1xuXHRcdFx0Y29uc3QgZW50aXR5ID0gbmV3IHBjLkVudGl0eSgpO1xuXHRcdFx0XG5cdFx0XHRlbnRpdHkuYWRkQ29tcG9uZW50KCdyZW5kZXInLHsgbWVzaEluc3RhbmNlczogW21lc2hdIH0pO1x0XHRcblx0XHRcdFxuXHRcdFx0YXBwLnJvb3QuYWRkQ2hpbGQoZW50aXR5KTtcblx0XHRcdGVudGl0eS5zZXRQb3NpdGlvbigwLDAsMSlcblx0XHRcdGNvbnN0IHNjYWxlID0gbmV3IHBjLlZlYzMoMC4wMDEsMC4wMDEsMC4wMDEpO1xuXHRcdFx0ZW50aXR5LnNldExvY2FsU2NhbGUoc2NhbGUpO1xuXHRcdFx0YXBwLnN0YXJ0KCk7XG5cdFx0XHRcblx0XHRcdGFwcC5vbihcImZyYW1ldXBkYXRlXCIsKCkgPT4gcnlza09iai51cGRhdGUoKSk7XG5cdFx0fSk7IFxuXG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwbGF5XCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLGV2ZW50ID0+XG5cdFx0ey8vZXZlbnQgbGlzdGVuZXIgZm9yIHRoZSBidXR0b24gd2hpY2ggcGxheXMvcGF1c2VzIHRoZSBhbmltYXRpb25cblx0XHRcdGlmIChyeXNrT2JqICE9PSBudWxsKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAocnlza09iai5pc1BhdXNlZCgpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cnlza09iai5wbGF5KCk7XG5cdFx0XHRcdFx0ZXZlbnQudGFyZ2V0LmlubmVySFRNTCA9IFwiUGF1c2VcIjtcblx0XHRcdFx0fWVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJ5c2tPYmoucGF1c2UoKTtcblx0XHRcdFx0XHRldmVudC50YXJnZXQuaW5uZXJIVE1MID0gXCJQbGF5XCI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblx0fWNhdGNoIChlcnIpXG5cdHtcblx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdH1cbn1cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/main-playcanvas.js\n");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".playcanvas_sample.bundle.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		__webpack_require__.b = document.baseURI || self.location.href;
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"app": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkRYSKUrl_sample"] = self["webpackChunkRYSKUrl_sample"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors"], () => (__webpack_require__("./src/main-playcanvas.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;