# RYSKStream with A-Frame and Agora
This sample demonstrates interaoperability between RYSK libraries, A-Frame and a remote streaming, in this particular
case Agora. The sample code is divided into two parts.
The main code is in ``src/app.js``. Agora specific code can be found in ``src/ConnectionAgoraNG.js``.

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

## Receiving a stream
The sample application connects to Agora using ChatXR and its app keys. After clicking on "CONNECT" button, it by default
joins aframetest channel and waits for other participants. In order to see the 3D mesh, another user must connect either
using the Mantis Vision ring system or stream a pre-recorded video using Mantis Vision Genesis application. The 3D mesh
should be displayed right after the streamer connects.

## Data from Agora
In order to correctly render the 3D mesh, the library needs to be passed the following input from Agora:
- Video MediaStreamTrack at the time the streaming participant connects
- Original video width and height. The resolution obtained from Agora is insufficient since it the Agora service might have reencoded the source video. Original width and height are sent as description data with each RTM package.
- encoded RYSK data periodically received from Agora through RTM channel. After each package, the demo application emits "newdata" event on HTML tag and passes the data to the underlying library.
The sample already does that using the class from ``ConnectionAgoraNG.js``. However, the code in the file is closely
coupled with the online ChatXR application, so in order to test the sample with a custom Agora project or with other
streaming service, ``ConnectionAgoraNG.js`` must be replaced with a suitable code.
