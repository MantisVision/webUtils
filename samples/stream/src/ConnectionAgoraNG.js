import AgoraRTC from "agora-rtc-sdk-ng";
import AgoraRTM from 'agora-rtm-sdk';

/**
 * Main connection class
 */
export default class ConnectionAgoraNG
{
	/**
	 * Initializes a new object for connecting to Agora
	 */
	constructor()
	{
		AgoraRTC.setLogLevel(2);

		this.roomname = null; //

		this.connected = false;
		this.remoteAudioMuted = false;
		
		this.onUserReceiveVideo = null;
		this.onUserDisconnectVideo = null;
		this.onUserReceiveData = null;
		
		this.subscribe = true;
		this.private_renewTokensThis = this.private_renewTokens.bind(this);
		this.private_onUserJoinedThis = this.private_onUserJoined.bind(this);
		
		this.remoteStreams = {};
		this.channel = null;
		
		this.tokens = null;//agora security token obtained from server

		this.client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

		this.client.on("user-published",this.private_participantConnected.bind(this));
		this.client.on("user-unpublished",this.private_participantDisconnected.bind(this));

		this.msgClient = null;
		this.msgChannel = null;
	}
	
	 /**
	 * Connects to a room using both RTC and RTM
	 * @param {string} roomname name of the room (session, channel...)
	 */
	async connectToRoom(roomname)
	{
		this.identityName = "aframeaudience";
		this.roomname = roomname;
		return await this.private_connectPassive(roomname);
	}
	
	/**
	 * Disconnects from both RTC and RTM channels
	 */
	async disconnect()
	{		
		if (this.connected) 
		{			
			this.private_disconnectFromRTM();

			try
			{
				await this.private_disconnectFromRemoteParticipants();
				await this.client.leave();

				console.log("Client left without error");
			} catch (err)
			{
				console.error(err);
				console.log("Probably timeout");
			} finally
			{
				if (this.client)
				{
					this.client.off("token-privilege-will-expire",this.private_renewTokensThis);
					this.client.off("user-joined",this.private_onUserJoinedThis);
				}
				this.channel = null;
				this.remoteStreams = {};

				if (this.connected) 
				{
					this.connected = false;
					this.onUserReceiveVideo = null;
					this.onUserDisconnectVideo = null;
					this.onUserReceiveData = null;
					this.onNetworkQualityReport = null;
					this.onEmptyRoom = null;
				}
				this.identity = null;
				this.roomname = null;
				console.log("Disconnected");		
			}
		}
	}
	
	/**
	 * Mutes audio coming from the Agora
	 * @type Array
	 */
	muteRemoteAudio()
	{
		this.remoteAudioMuted = true;
		for (var user in this.remoteStreams)
		{
			if (this.remoteStreams[user].audio !== null)
			{
				this.remoteStreams[user].audio.stop();
			}
		}
	}
	
	/**
	 * Unmutes audio coming from Agora
	 * @type Array
	 */
	unmuteRemoteAudio()
	{
		this.remoteAudioMuted = false;
		for (var user in this.remoteStreams)
		{
			if (this.remoteStreams[user].audio !== null)
			{
				this.remoteStreams[user].audio.play();
			}
		}
	}
	
	/**
	 * Connects to the channel as an audience
	 * @param {String} roomname name of the channel to connect to
	 */
	async private_connectPassive(roomname)
	{
		try
		{
			this.role = "audience";
			await this.client.setClientRole(this.role);
			this.channel = roomname;
			await this.private_connectToChannel();
			this.connected = true;
			return true;
		}catch (err)
		{
			console.error(err);
			return false;
		}
	}
	
	/**
	 * Disconnects from all the remote streamers
	 * @type Array
	 */
	private_disconnectFromRemoteParticipants()
	{
		for (var participant in this.remoteStreams)
		{
			if (this.remoteStreams[participant] !== null)
			{
				if (this.remoteStreams[participant].video !== null)
				{
					this.remoteStreams[participant].video.stop();
				}
				if (this.remoteStreams[participant].audio !== null)
				{
					this.remoteStreams[participant].audio.stop();
				}					
			}
		}		
	}
		
	/**
	 * Connects to the channel (=room) in Agora
	 * @returns {unresolved} Promise resolved either with the identity of the user or rejected with an error
	 */
	async private_connectToChannel()
	{
		let tokenResponseObj = await this.getToken(this.identityName);
		const promises = [
			this.private_joinChannel(this.client,this.identityName,tokenResponseObj),
			this.private_connectToRTM(tokenResponseObj),
		];
		
		const status = await Promise.allSettled(promises);
		if (status[0].status === "fulfilled" && status[1].status === "fulfilled")
		{
			this.client.on("token-privilege-will-expire", this.private_renewTokensThis);
			return this.identityName;
		}else throw status[2].reason;
	}
	
	/**
	 * Connects to the RTM channel.
	 * @type Array
	 */
	async private_connectToRTM(token)
	{
		try
		{
			this.msgClient = AgoraRTM.createInstance(token.appId,{ logFilter: AgoraRTM.LOG_FILTER_WARNING });
			await this.msgClient.login({ token: token.rtm,uid: this.identityName });
			this.msgChannel = this.msgClient.createChannel("ChatXR_" + this.channel + "_msg");
			await this.msgChannel.join();
		}catch (err)
		{
			console.error(err);
			throw err;
		}

		this.msgClient.on("ConnectionStateChanged",(newstate,reason) => 
		{
			if (reason === "REMOTE_LOGIN" && (newstate === "ABORTED" || newstate === "DISCONNECTED"))
			{//user was kicked out of application
				document.getElementById("disconnect").click();
				console.warn("Someone has connected using the same name!");
			}
		});

		this.msgChannel.on("ChannelMessage",(msg,sender) => 
		{
			if (this.onUserReceiveData !== null && msg.messageType === "RAW" && "rawMessage" in msg)
			{//application received binary data from RTM 
				try
				{
					if (msg instanceof Object && "description" in msg)
					{
						const desc = (typeof msg.description === 'string' || msg.description instanceof String) 
										? JSON.parse(msg.description)
										: msg.description;

						//if the data has action or streams specified in its description, it came from a moderator 
						//and in this demo the app isn't concerned with that
						if (!("streams" in desc || "action" in desc))
						{
							this.onUserReceiveData(msg.rawMessage,desc);
						}
					}else this.onUserReceiveData(msg.rawMessage);
				}catch (err)
				{
					console.error(err);
				}
			}
		});
		
		this.msgClient.on("MessageFromPeer",(msg,sender) => 
		{
			if (this.onUserReceiveData !== null && msg.messageType === "RAW" && "rawMessage" in msg)
			{
				if (msg instanceof Object && "description" in msg)
				{
					const desc = JSON.parse(msg.description);
					if (!(typeof  "streams" in desc))
					{//data probably came from a moderator
						this.onUserReceiveData(msg.rawMessage,desc);
					}
				}else this.onUserReceiveData(msg.rawMessage);
			}
		});

		this.client.on("token-privilege-will-expire", this.private_renewTokensThis);
	}
	
	/**
	 * Get security tokens
	 * @param {String} identity 
	 * @returns {unresolved}
	 */
	async getToken(identity)
	{
		let tokenResponse = await getTokenApi(identity,this.channel);
		let tokenResponseObj = JSON.parse(tokenResponse);

		if (tokenResponseObj.hasOwnProperty("appId") && tokenResponseObj.hasOwnProperty("rtc") && tokenResponseObj.hasOwnProperty("rtm"))
		{//we join to rtc channel
			return tokenResponseObj;
		}else new Error("Incorrect format of response from API server."); 	
	}
	
	/**
	 * Connects to a RTC channel
	 * @param {type} client RTC client
	 * @param {String} identity
	 * @param {Object} token object containing information about the token
	 */
	async private_joinChannel(client,identity,token)
	{
		if (token.hasOwnProperty("encryptionType") && token.hasOwnProperty("encryptionSecret")
		&& token.encryptionType && token.encryptionSecret)
		{//if the server sends an encryption config, enable the encryption
			client.setEncryptionConfig(token.encryptionType,token.encryptionSecret);
		}
		await client.join(token.appId,"ChatXR_" + this.channel,token.rtc,identity);
	}
	
	/**
	 * Callback bound to Agora's event user-joined
	 * @param {Object} remoteId 
	 */
	private_onUserJoined(remoteId)
	{
		console.log("user " + remoteId + " has joined");
	}
	
	
	/**
	 * Disconnects from RTM
	 */	
	private_disconnectFromRTM()
	{
		try
		{
			if (this.msgChannel !== null)
			{
				this.msgChannel.leave();
				this.msgChannel = null;
			}
			if (this.msgClient !== null)
			{
				this.msgClient.logout();
				this.msgClient = null;
			}
			console.log("Disconnected from RTM");
		}catch (err){ console.error(err); }
	}
	
	/**
	 * Someone else has just connected to Agora channel
	 * @param {Object} remoteUser
	 * @param {String} mediaType
	 */
	private_participantConnected(remoteUser, mediaType)
	{
		const remoteId = remoteUser.uid;
		
		if (remoteId !== this.identityName && remoteId !== (this.identityName + "-screen"))
		{
			if (this.subscribe)
			{
				this.client.subscribe(remoteUser,mediaType).then(() => 
				{
					if (!this.remoteStreams.hasOwnProperty(remoteId))
					{
						this.remoteStreams[remoteId] = { video: null, audio:null };
					}

					if (mediaType === "audio")
					{
						console.log("An audio from user " + remoteId + " received");
						this.remoteStreams[remoteId].audio = remoteUser.audioTrack;

						if (this.remoteAudioMuted)
						{
							remoteUser.audioTrack.stop();
						}else
						{
							remoteUser.audioTrack.setVolume(100);
							remoteUser.audioTrack.play();
						}	
					}else
					{
						console.log("A video from user " + remoteId + " received");
						this.remoteStreams[remoteId].video = remoteUser.videoTrack;
						this.onUserReceiveVideo(remoteUser.videoTrack.getMediaStreamTrack(),remoteId);
					}
				});
			}else
			{
				this.onUserReceiveVideo(mediaType,remoteId);
			}
		}
	}
	
	/**
	 * Renew tokens.
	 */
	private_renewTokens()
	{
		if (this.channel !== null)
		{			
			getTokenApi(this.identityName,this.channel).then(tokenResponse => 
			{
				let tokenResponseObj = JSON.parse(tokenResponse);
				if (tokenResponseObj.hasOwnProperty("appId") && tokenResponseObj.hasOwnProperty("rtc") && tokenResponseObj.hasOwnProperty("rtm"))
				{//renew tokens for both message client and a/v client (they have been issued at around the same time, so if one is about to expire, so does the other)
					if (this.client)
					{
						this.client.renewToken(tokenResponseObj.rtc);
					}
					if (this.msgClient !== null)
					{
						this.msgClient.renewToken(tokenResponseObj.rtm);
					}
					if (this.screenClient !== null)
					{
						this.screenClient.renewToken(tokenResponseObj.rtc);
					}
				}else throw new Error("Token renewal has failed");
			});
		}
	}
	
	/**
	 * Someone has just disconnected
	 * @param {Object} remoteUser
	 * @param {String} mediaType
	 */
	private_participantDisconnected(remoteUser, mediaType)
	{
		const participant = remoteUser.uid;
		console.warn('A remote ' + mediaType + " from user " + participant + " disconnected");
		
		if (mediaType === "video" && this.onUserDisconnectVideo !== null)
		{
			this.onUserDisconnectVideo(participant);
		}
		
		if (this.remoteStreams.hasOwnProperty(participant) 
		&& this.remoteStreams[participant].hasOwnProperty(mediaType)
		&& this.remoteStreams[participant][mediaType] !== null)
		{
			this.remoteStreams[participant][mediaType].stop();
			this.remoteStreams[participant][mediaType] = null;
		}
	}
}

const moderators = [];
const notModerators = [];

AgoraRTC.onAutoplayFailed = () => 
{
	console.warn("Permission grant","You must grant this application a permission to play the remote audio.")
};

/**
 * Obtains an Agora token from a remote service (in this particular case it's from ChatXR app)
 * @param {String} identity name of the user
 * @param {String} room Name of the room
 * @returns {String} token in its text form
 */
async function getTokenApi(identity, room)
{
	var params = {};
	
	if (identity) params.identity = identity;
	if (room) params.room = room;

	const response = await $get("/api/token",params);
	if (response.ok)
	{
		return await response.text();
	}else
	{
		throw new Error("Obtaining token failed");
	}
}

/**
 * Make GET request
 * @param {String} url
 * @param {Object} queryparams
 * @returns {Object} Response from the server
 */
async function $get(url,queryparams = {})
{
	const fullUrl = generateFullUrl(url,queryparams);
	return await myFetch(fullUrl,"GET");
}

/**
 * Generates a full URL for querying the server
 * @param {type} url
 * @param {type} queryparams
 * @returns {String}
 */
function generateFullUrl(url,queryparams)
{
	let queryString = [];
	for (var param in queryparams)
	{
		queryString.push(encodeURIComponent(param) + "=" + encodeURIComponent(queryparams[param]));
	}
	if (queryString.length > 0)
	{
		url = "https://chatxr.ring-streaming.com" + url + "?" + queryString.join('&');
	}
	return url;
}

/**
 * Fetch function wrapper
 * @param {String} url URL of the request
 * @param {String} method HTTP mehthos (GET, POST ...)
 * @returns {Object} Response from the server
 */ 
async function myFetch(url,method)
{
	const fetchOptions = { 
		method: method,
		mode: 'cors',
		redirect: 'follow',
		headers: {
			'Content-Type': 'application/json'
		}
	};
	return await fetch(url,fetchOptions);
}
