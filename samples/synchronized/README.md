# @mantisvision/synchronizer sample project
This application presents a simple way to use the ``VideoSync`` class from ``@mantisvision/synchronizer`` package in combination with URLMesh class from either ``@mantisvision/ryskthreejs`` or ``@mantisvision/ryskplaycanvas``.

## Build the project
This application is using Yarn as its package manager and Webpack as package bundler. Since ``@mantisvision/rysk*`` libraries
are published in Github repository and Github doesn't allow unauthorized access to such packages, it might be necessary
to add [.yarnrc.yml](.yarnrc.yml) file and set your authorization token (it can be generated through the user's profile on Github).

If you don't have yarn installed yet, run:
``npm install --global yarn``
Then, inside this folder, run
``yarn install``
This should install all the necessary dependencies.
In order to build the project, run
``yarn build``

## Run the project
If you are already running a webserver (Apache, Nginx...), simply access ``public_html/index.html`` file. Alternatively,
you can use simple node.js http-server. You can install it running:
``npm install --global http-server``
Then enter ``public_html`` directory and run
``http-server -p 3000``
You should now be able to access the sample in your browser using this url: ``http://127.0.0.1:3000``
After clicking on Play, you should see two synchronized 3D animations. You can switch between Three.js and Playcanvas version using
the button in the upper right corner.
