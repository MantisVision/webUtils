# RYSKUrl sample project
This application presents a simple way to use RYSKUrl calss from ``@mantisvision/rysk`` package. The commented source 
of the project is located in [src/main.js](src/main.js) file. Index file is in [public_html/index.html](public_html/index.html)

## Build the project
This application is using Yarn v3 as its package manager and Webpack as package bundler. Since ``@mantisvision/rysk`` is
published in Github repository and Github doesn't allow unauthorized access to such packages, it might be necessary
to edit [.yarnrc.yml](.yarnrc.yml) file and set your authorization token (it can be generated through a user profile on Github).

If you don't have yarn installed yet, run:
``npm install --global yarn"
Then, inside this folder, run
``yarn install``
This should install all the necessary dependencies.
In order to build the project, run
``yarn build``
Verify that ``public_html`` now contains these three files:
  - ryskurl_sample.bundle.js
  - vendors.bundle.js
  - index.html

## Run the project
If you are already running a webserver (Apache, Nginx...), simply access ``public_html/index.html`` file. Alternatively,
you can use simple node.js http-server. You can install it running:
``npm install --global http-server``
Then enter ``public_html`` directory and run
``http-server -p 3000``
You should now be able to access the sample in your browser using this url: ``http://127.0.0.1:3000``
After clicking on Play, you should see a 3D animation.
