import 'aframe';
import ConnectionAgoraNG from "./ConnectionAgoraNG.js";

import('@mantisvision/ryskaframe').then(() => 
{
	console.log("ryskaframe imported");
}).catch(console.error);

window.addEventListener('load',function()
{
	var playing = false;
	const connectButton = document.getElementById("connection");
	
	connectButton.addEventListener("click",() => 
	{
		if (playing)
		{
			connectButton.innerHTML = "CONNECT";
			disconnectFromAgora();
			playing = false;
		}else
		{
			connectButton.innerHTML = "DISCONNECT";
			connectToAgora();
			playing = true;
		}
	});
});

/**
 * Creates a new connection to Agora using object of a dedicated class and sets the listeners for new connections 
 * and RYKS data.
 */
async function connectToAgora()
{
	connection = new ConnectionAgoraNG();
	
	/**
	 * Callback after a user connects to the channel and streams video
	 * @param {MediaStreamTrack} videoTrack
	 * @param {String} participantName
	 */
	connection.onUserReceiveVideo = (videoTrack,participantName) => 
	{
		console.log(participantName + " connected");
		RYSKObj.createMediaStream(videoTrack);
	}; 
	
	/**
	 * Callback after disconnected from the Agora
	 */
	connection.onUserDisconnectVideo = () => 
	{
		RYSKObj.disconnected();
	};
	
	/**
	 * Callback after Agora received a message from RTM.
	 * @param {ArrayBuffer} data raw data portion of the message
	 * @param {Array} description JSON decoded description part of the message
	 */
	connection.onUserReceiveData = (data,description = null) => 
	{
		RYSKObj.addDescData(data,description);
	};
	
	if (await connection.connectToRoom("aframetest"))
	{
		console.log("Connected to the room");
	}else
	{
		console.error("Failed to connect to the room");
	}
}

/**
 * Disconnects from Agora and destroys the RYSK object
 */
function disconnectFromAgora()
{
	RYSKObj.disconnected();
	if (connection !== null)
	{
		connection.disconnect();
		connection = null;
	}
}

/**
 * Helper object containing all the necessery information about the received stream.
 */
const RYSKObj = {
	version: null,				// version of the stream
	processingFrame: null,		// number of the frame which is currently being processed
	storedInArray: null,		// how much data is currently in the buffer
	currentBuffer: null,		// buffer for the current frame
	width: 0,					// video width
	height: 0,					// video height
	ryskStreamRunning: false,	// whether the stream is currently running
	mediaStream: null,			// media stream itself
	aframeModel: null,			// reference to HTML tag for the mesh
	
	/**
	 * Creates a MediaStream from MediaStramTrack obtained from Agora
	 * @param {MediaStreamTrack} videoTrack
	 */
	createMediaStream(videoTrack)
	{
		this.mediaStream = new MediaStream([videoTrack]);
		this.setAFrame();
	},
	
	/**
	 * Gets a reference to the A-Frame tag for the RYSKStream 3D mesh and lets it know there is a mediastream
	 * which should be displayed.
	 */
	setAFrame()
	{
		if (this.mediaStream && this.width && this.height)
		{// only proceed if both media stream and video resolution is present (the latter is obtained from the RYSK data)
			this.ryskStreamRunning = true;
			this.aframeModel = document.querySelector("#rysk");
			this.aframeModel.emit("newstream",{ stream: this.mediaStream, width: this.width, height: this.height });
		}
	},
	
	/**
	 * Emits newdata event to update the shape of the mesh according to the received RYSK data which contains encoded
	 * uvs, indices and vertices.
	 * @param {String} version version of the RYSK data format (read from the incoming data stream)
	 * @param {ArrayBuffer} data data itself in the form of ArrayBuffer
	 */
	updateData(version,data)
	{
		if (this.aframeModel)
		{
			this.aframeModel.emit("newdata",{ version,data });
		}
	},
	
	/**
	 * Resets RYSKObj (e.g. after the strem disconnects)
	 */
	disconnected()
	{
		if (this.aframeModel !== null)
		{
			this.aframeModel.emit("endstream");
			this.aframeModel = null;
		}
		this.version = null;
		this.processingFrame= null;
		this.storedInArray = null;
		this.currentBuffer = null;
		this.width = 0;
		this.height = 0;
		this.mediaStream = null;
		this.ryskStreamRunning = false;
	},
	
	/**
	 * Connects the chunks of data from the Agora RTM into a data frame which contains encoded uvs, vertices and indices
	 * for a single video frame.
	 * @param {ArrayBuffer} data RAW data from Agora RTM
	 * @param {Array} description metadata from Agora RTM converted into a javascript array 
	 */
	addDescData(data,description)
	{	
		if (Array.isArray(description) && data)
		{
			if (description.length === 6)
			{//it is indeed the first package of the frame; metadata is array in the form [flags, version, sizeOfAllData, frame, width, height]
				this.version = description[1];
				this.processingFrame = description[3];
				this.storedInArray = 0;
				this.currentBuffer = new Uint8Array(description[2]);
				this.currentBuffer.set(data);
				this.storedInArray = data.length;
				this.width = description[4];
				this.height = description[5];
				if (!this.ryskStreamRunning) this.setAFrame(); // if the RYSK isn't in the scene yet, try to emit newstream event
			}else if (description.length === 1
					&& this.processingFrame === description[0]
					&& this.currentBuffer !== null 
					&& data.length + this.storedInArray <= this.currentBuffer.length)
			{//it is not the first package -- then proceed only if the currentBuffer is not empty and incoming data won't 
			 //overflow the current buffer (that might indicate some packages have got lost)
				this.currentBuffer.set(data,this.storedInArray);
				this.storedInArray += data.length;
			}
			
			if (this.currentBuffer !== null && this.currentBuffer.length === this.storedInArray)
			{//the whole buffer is full which means one whole data frame was completed
				if (this.ryskStreamRunning)
				{
					this.storedInArray = 0;
					const firstBytes = new Uint32Array(this.currentBuffer.buffer,0,1);
					//correction of the frame number -- ensures the data always carries the right frame number (the one from the metadata)
					firstBytes[0] = this.processingFrame; 
					// the version must be prepended with 'RYS' string to indicate the type of data 
					// (the other type is SYK, but that one is currently deprecated)
					this.updateData("RYS" + this.version,this.currentBuffer.buffer);
					this.currentBuffer = null;
				}
			}
		}
	}
};

var connection = null;
