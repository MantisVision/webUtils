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

/***/ "./src/MantisRYSKPlayCanvas.min.js":
/*!*****************************************!*\
  !*** ./src/MantisRYSKPlayCanvas.min.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


/***/ }),

/***/ "./src/main-playcanvas.js":
/*!********************************!*\
  !*** ./src/main-playcanvas.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _MantisRYSKPlayCanvas_min_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./MantisRYSKPlayCanvas.min.js */ \"./src/MantisRYSKPlayCanvas.min.js\");\n\n\nconst video_url = \"https://www.mvkb.cc/lib/exe/fetch.php/pub/genady5.mp4\";\nconst data_url = \"https://www.mvkb.cc/lib/exe/fetch.php/pub/genady5.syk\";\n\ndocument.addEventListener('DOMContentLoaded',function()\n{\n\tvar app = null;\n\ttry\n\t{\n\t\tconst canvas = document.getElementById('playcanvas');\n\t\tapp = new pc.Application(canvas);\n\t\tconst scene = app.scene;\n\n\t\tapp.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);\n\t\tapp.setCanvasResolution(pc.RESOLUTION_AUTO);\n\n\t\tconst camera = new pc.Entity('camera');\n\t\tcamera.addComponent('camera', {\n\t\t\tclearColor: new pc.Color(1, 1, 1),\n\t\t\tprojection: pc.PROJECTION_PERSPECTIVE,\n\t\t\tfov: 70\n\t\t});\n\t\tapp.root.addChild(camera);\n\t\tcamera.setPosition(0, 1.5, -1);\n\t\tcamera.setEulerAngles(0, 180, 0);\n\n\t\t// create directional light entity\n\t\tconst light = new pc.Entity('light');\n\t\tlight.addComponent('light');\n\t\tapp.root.addChild(light);\n\t\tlight.setEulerAngles(45, 180, 0);\n\t}catch (err)\n\t{\n\t\tconsole.error(err);\n\t}\n\trun(app);\n});\n\n/**\n * Runs the whole animation\n * @param {THREE.WebGLRenderer} renderer\n * @param {THREE.Scene} scene\n * @param {THREE.PerspectiveCamera} camera\n * @returns {undefined}\n */\nfunction run(app)\n{\n\ttry\n\t{\n\t\tconst ryskObj = new _MantisRYSKPlayCanvas_min_js__WEBPACK_IMPORTED_MODULE_0__.URLMesh(video_url,data_url,pc);\n\n\t\tryskObj.run().then(mesh => \n\t\t{//add mesh to the scene\n\t\t\tmesh.visible = true;\n\t\t\tconst entity = new pc.Entity();\n\t\t\t\n\t\t\tentity.addComponent('render',{ meshInstances: [mesh] });\t\t\n\t\t\t\n\t\t\tapp.root.addChild(entity);\n\t\t\tentity.setPosition(0,0,1)\n\t\t\tconst scale = new pc.Vec3(0.001,0.001,0.001);\n\t\t\tentity.setLocalScale(scale);\n\t\t\tapp.start();\n\t\t\t\n\t\t\tapp.on(\"frameupdate\",() => ryskObj.update());\n\t\t}); \n\n\t\tdocument.getElementById(\"play\").addEventListener(\"click\",event =>\n\t\t{//event listener for the button which plays/pauses the animation\n\t\t\tif (ryskObj !== null)\n\t\t\t{\n\t\t\t\tif (ryskObj.isPaused())\n\t\t\t\t{\n\t\t\t\t\tryskObj.play();\n\t\t\t\t\tevent.target.innerHTML = \"Pause\";\n\t\t\t\t}else\n\t\t\t\t{\n\t\t\t\t\tryskObj.pause();\n\t\t\t\t\tevent.target.innerHTML = \"Play\";\n\t\t\t\t}\n\t\t\t}\n\t\t});\n\t}catch (err)\n\t{\n\t\tconsole.error(err);\n\t}\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvbWFpbi1wbGF5Y2FudmFzLmpzLmpzIiwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9SWVNLVXJsIHNhbXBsZS8uL3NyYy9tYWluLXBsYXljYW52YXMuanM/ODI3NSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBVUkxNZXNoIH0gZnJvbSBcIi4vTWFudGlzUllTS1BsYXlDYW52YXMubWluLmpzXCI7XG5cbmNvbnN0IHZpZGVvX3VybCA9IFwiaHR0cHM6Ly93d3cubXZrYi5jYy9saWIvZXhlL2ZldGNoLnBocC9wdWIvZ2VuYWR5NS5tcDRcIjtcbmNvbnN0IGRhdGFfdXJsID0gXCJodHRwczovL3d3dy5tdmtiLmNjL2xpYi9leGUvZmV0Y2gucGhwL3B1Yi9nZW5hZHk1LnN5a1wiO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJyxmdW5jdGlvbigpXG57XG5cdHZhciBhcHAgPSBudWxsO1xuXHR0cnlcblx0e1xuXHRcdGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwbGF5Y2FudmFzJyk7XG5cdFx0YXBwID0gbmV3IHBjLkFwcGxpY2F0aW9uKGNhbnZhcyk7XG5cdFx0Y29uc3Qgc2NlbmUgPSBhcHAuc2NlbmU7XG5cblx0XHRhcHAuc2V0Q2FudmFzRmlsbE1vZGUocGMuRklMTE1PREVfRklMTF9XSU5ET1cpO1xuXHRcdGFwcC5zZXRDYW52YXNSZXNvbHV0aW9uKHBjLlJFU09MVVRJT05fQVVUTyk7XG5cblx0XHRjb25zdCBjYW1lcmEgPSBuZXcgcGMuRW50aXR5KCdjYW1lcmEnKTtcblx0XHRjYW1lcmEuYWRkQ29tcG9uZW50KCdjYW1lcmEnLCB7XG5cdFx0XHRjbGVhckNvbG9yOiBuZXcgcGMuQ29sb3IoMSwgMSwgMSksXG5cdFx0XHRwcm9qZWN0aW9uOiBwYy5QUk9KRUNUSU9OX1BFUlNQRUNUSVZFLFxuXHRcdFx0Zm92OiA3MFxuXHRcdH0pO1xuXHRcdGFwcC5yb290LmFkZENoaWxkKGNhbWVyYSk7XG5cdFx0Y2FtZXJhLnNldFBvc2l0aW9uKDAsIDEuNSwgLTEpO1xuXHRcdGNhbWVyYS5zZXRFdWxlckFuZ2xlcygwLCAxODAsIDApO1xuXG5cdFx0Ly8gY3JlYXRlIGRpcmVjdGlvbmFsIGxpZ2h0IGVudGl0eVxuXHRcdGNvbnN0IGxpZ2h0ID0gbmV3IHBjLkVudGl0eSgnbGlnaHQnKTtcblx0XHRsaWdodC5hZGRDb21wb25lbnQoJ2xpZ2h0Jyk7XG5cdFx0YXBwLnJvb3QuYWRkQ2hpbGQobGlnaHQpO1xuXHRcdGxpZ2h0LnNldEV1bGVyQW5nbGVzKDQ1LCAxODAsIDApO1xuXHR9Y2F0Y2ggKGVycilcblx0e1xuXHRcdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0fVxuXHRydW4oYXBwKTtcbn0pO1xuXG4vKipcbiAqIFJ1bnMgdGhlIHdob2xlIGFuaW1hdGlvblxuICogQHBhcmFtIHtUSFJFRS5XZWJHTFJlbmRlcmVyfSByZW5kZXJlclxuICogQHBhcmFtIHtUSFJFRS5TY2VuZX0gc2NlbmVcbiAqIEBwYXJhbSB7VEhSRUUuUGVyc3BlY3RpdmVDYW1lcmF9IGNhbWVyYVxuICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAqL1xuZnVuY3Rpb24gcnVuKGFwcClcbntcblx0dHJ5XG5cdHtcblx0XHRjb25zdCByeXNrT2JqID0gbmV3IFVSTE1lc2godmlkZW9fdXJsLGRhdGFfdXJsLHBjKTtcblxuXHRcdHJ5c2tPYmoucnVuKCkudGhlbihtZXNoID0+IFxuXHRcdHsvL2FkZCBtZXNoIHRvIHRoZSBzY2VuZVxuXHRcdFx0bWVzaC52aXNpYmxlID0gdHJ1ZTtcblx0XHRcdGNvbnN0IGVudGl0eSA9IG5ldyBwYy5FbnRpdHkoKTtcblx0XHRcdFxuXHRcdFx0ZW50aXR5LmFkZENvbXBvbmVudCgncmVuZGVyJyx7IG1lc2hJbnN0YW5jZXM6IFttZXNoXSB9KTtcdFx0XG5cdFx0XHRcblx0XHRcdGFwcC5yb290LmFkZENoaWxkKGVudGl0eSk7XG5cdFx0XHRlbnRpdHkuc2V0UG9zaXRpb24oMCwwLDEpXG5cdFx0XHRjb25zdCBzY2FsZSA9IG5ldyBwYy5WZWMzKDAuMDAxLDAuMDAxLDAuMDAxKTtcblx0XHRcdGVudGl0eS5zZXRMb2NhbFNjYWxlKHNjYWxlKTtcblx0XHRcdGFwcC5zdGFydCgpO1xuXHRcdFx0XG5cdFx0XHRhcHAub24oXCJmcmFtZXVwZGF0ZVwiLCgpID0+IHJ5c2tPYmoudXBkYXRlKCkpO1xuXHRcdH0pOyBcblxuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGxheVwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIixldmVudCA9PlxuXHRcdHsvL2V2ZW50IGxpc3RlbmVyIGZvciB0aGUgYnV0dG9uIHdoaWNoIHBsYXlzL3BhdXNlcyB0aGUgYW5pbWF0aW9uXG5cdFx0XHRpZiAocnlza09iaiAhPT0gbnVsbClcblx0XHRcdHtcblx0XHRcdFx0aWYgKHJ5c2tPYmouaXNQYXVzZWQoKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJ5c2tPYmoucGxheSgpO1xuXHRcdFx0XHRcdGV2ZW50LnRhcmdldC5pbm5lckhUTUwgPSBcIlBhdXNlXCI7XG5cdFx0XHRcdH1lbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyeXNrT2JqLnBhdXNlKCk7XG5cdFx0XHRcdFx0ZXZlbnQudGFyZ2V0LmlubmVySFRNTCA9IFwiUGxheVwiO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1jYXRjaCAoZXJyKVxuXHR7XG5cdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHR9XG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/main-playcanvas.js\n");

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
/************************************************************************/
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
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval-source-map devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main-playcanvas.js");
/******/ 	
/******/ })()
;