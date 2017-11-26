var connectedUser, stream, yourConnection, dataChannel;
var connection = new WebSocket('ws://localhost:8888'),
name = "";
var connectArray = [];
var userlistbox = document.querySelector('#userlistbox');
var loginPage = document.querySelector('#login-page'),
usernameInput = document.querySelector('#username'),
loginButton = document.querySelector('#login'),
callPage = document.querySelector('#call-page'),
theirUsernameInput = document.querySelector('#theirusername'),
callButton = document.querySelector('#call'),
hangUpButton = document.querySelector('#hang-up');
sendButton = document.querySelector("#sendButton");
messageInput = document.querySelector("#messageInput");
received = document.querySelector("#received");
var canvas = document.querySelector("#canvas");
var photo = document.querySelector("#photo");
var takePhoto = document.querySelector("#takePhoto");
var video = document.querySelector("video");
var sendImage = document.querySelector("#sendImage");
var imageData=0;
var streaming = false;
var width = 320;    
var height = 0;

callPage.style.display = "none";
function setUsername() {
  var msg = {
  	type: "username",
    name: usernameInput.value
  };
  connection.send(JSON.stringify(msg));
}
// Login when the user clicks the button
loginButton.addEventListener("click", function (event) {
	name = usernameInput.value;
		if (name.length > 0) {
		send({
		type: "login",
		name: name,
		connectArray: connectArray
		});
		setUsername();
		console.log("connectArray=>" + connectArray);
	}
});
connection.onopen = function () {
	console.log("Connected");
};
// Handle all messages through this callback
connection.onmessage = function (message) {
	console.log("Got message", message.data);
	var data = JSON.parse(message.data);
	
	switch(data.type) {
	case "login":
	onLogin(data.success,data.status);
	//console.log("After log in, data=>"+data.connectionArray);
	//console.log("length: "s+data.connectionArray.length);
	//for(var i=0;i<data.connectionArray.length;i++){
//userlistbox.innerHTML += "<li><a href=&quot;#&quot;>"+data.connectionArray[i]+"</a></li>"
	//}
	break;

	case "userlist":
        handleUserListMsg(data);
    break;

	/**case "rejectusername":
        alert("Your username has been set to " + data.name + " because the name you chose is in use.");
        usernameInput.value=data.name;
    break;**/

	case "offer":
	onOffer(data.offer, data.name,data.status);
	break;

	case "answer":
	onAnswer(data.answer,data.status);
	break;

	case "candidate":
	onCandidate(data.candidate,data.status);
	break;

	case "leave":
	onLeave(data.status);
	break;

	default:
	break;
	}
};
connection.onerror = function (err) {
	console.log("Got error", err);
};
// Alias for sending messages in JSON format
function send(message) {
	if (connectedUser) {
	message.name = connectedUser;
	}
	connection.send(JSON.stringify(message));
};
function onLogin(success) {
	if (success === false) {
		alert("Login unsuccessful, please try a different name.");
	} else {
		loginPage.style.display = "none";
		callPage.style.display = "block";
		// Get the plumbing ready for a call
		startConnection();
		//openDataChannel();
	}
};



callButton.addEventListener("click", function () {
	var theirUsername = theirUsernameInput.value;
	if (theirUsername.length > 0) {
		startPeerConnection(theirUsername);
	}
	
});

hangUpButton.addEventListener("click", function () {
	send({
		type: "leave"
	});
	onLeave();
});
function onOffer(offer, name) {
		connectedUser = name;
		yourConnection.setRemoteDescription(new
		RTCSessionDescription(offer));
		yourConnection.createAnswer(function (answer) {
		yourConnection.setLocalDescription(answer);
		send({
		type: "answer",
		answer: answer
		});
		}, function (error) {
		alert("An error has occurred");
});
}
function onAnswer(answer) {
	yourConnection.setRemoteDescription(new
	RTCSessionDescription(answer));
}
function onCandidate(candidate) {
	yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
}
function onLeave() {
	connectedUser = null;
	theirVideo.src = null;
	yourConnection.close();
	yourConnection.onicecandidate = null;
	yourConnection.onaddstream = null;
	setupPeerConnection(stream);
}
function hasUserMedia() {
	navigator.getUserMedia = navigator.getUserMedia ||
	navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
	navigator.msGetUserMedia;
	return !!navigator.getUserMedia;
}
function hasRTCPeerConnection() {
	window.RTCPeerConnection = window.RTCPeerConnection ||
	window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
	window.RTCSessionDescription = window.RTCSessionDescription ||
	window.webkitRTCSessionDescription ||
	window.mozRTCSessionDescription;
	window.RTCIceCandidate = window.RTCIceCandidate ||
	window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
	return !!window.RTCPeerConnection;
}

var yourVideo = document.querySelector('#yours'),
	theirVideo = document.querySelector('#theirs');

function startConnection() {
	if (hasUserMedia()) {
		navigator.getUserMedia({ video: true, audio: true }, function
		(myStream) {
			stream = myStream;
			yourVideo.src = window.URL.createObjectURL(stream);
			if (hasRTCPeerConnection()) {
			setupPeerConnection(stream);
			//openDataChannel();
			} else {
			alert("Sorry, your browser does not support WebRTC.");
			}
		}, function (error) {
		console.log(error);
		});

	} else {
		alert("Sorry, your browser does not support WebRTC.");
	}
}

function openDataChannel() {
	var dataChannelOptions = {reliable: true};
	dataChannel = yourConnection.createDataChannel("channel",dataChannelOptions);
	console.log("Data channel has been created");

	dataChannel.onerror = function (error) {
		console.log("Data Channel Error:", error);
	};
	dataChannel.onmessage = function (event) {
		console.log("Got Data Channel Message:", event.data);
		received.innerHTML += "recv: " + event.data + "<br />";
		received.scrollTop = received.scrollHeight;
	};
	dataChannel.onopen = function () {
		dataChannel.send(name + " has connected.");
		console.log("Data Channel "+name+" is opened");
	};
	dataChannel.onclose = function () {
		console.log("The Data Channel is Closed");
	};
}
function setupPeerConnection(stream) {
	var configuration = {
	"iceServers": [{ "url": "stun:stun.1.google.com:19302" }]
	};

	yourConnection = new RTCPeerConnection(configuration);

	yourConnection.ondatachannel = function(event){
		var receiveChannel = event.channel;
		receiveChannel.onmessage = function(event){
			console.log("ondatachannel message: "+event.data);
			received.innerHTML += "recv: " + event.data + "<br />";
			received.scrollTop = received.scrollHeight;
			handleImage(event);
		}
	}
	openDataChannel();
	// Setup stream listening
	yourConnection.addStream(stream);
	yourConnection.onaddstream = function (e) {
		theirVideo.src = window.URL.createObjectURL(e.stream);
	};
	// Setup ice handling
	yourConnection.onicecandidate = function (event) {
		if (event.candidate) {
				send({
				type: "candidate",
				candidate: event.candidate
				});
		}
	};
	openDataChannel();
}

function startPeerConnection(user) {
	connectedUser = user;
	// Begin the offer
	yourConnection.createOffer(function (offer) {
		send({
			type: "offer",
			offer: offer
		});
		yourConnection.setLocalDescription(offer);
		}, function (error) {
		alert("An error has occurred.");
		
	});
	
};

sendButton.addEventListener("click", function (event) {
	//openDataChannel();
	var val = messageInput.value;
	received.innerHTML += "send: " + val + "<br />";
	received.scrollTop = received.scrollHeight;
	dataChannel.send(val);
	messageInput.value="";
	
});

theirVideo.addEventListener('canplay', function(ev){
      if (!streaming) {
        height = theirVideo.videoHeight / (theirVideo.videoWidth/width);
      
        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.
      
        if (isNaN(height)) {
          height = width / (4/3);
        }

        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);

takePhoto.addEventListener("click",function(event){
	takePicture();
	event.preventDefault();
},false);

function takePicture(){
	var context = canvas.getContext('2d');
	console.log("context");
	if(width && height){
		console.log("width and height");
		canvas.width = width;
		canvas.height = height;
		context.drawImage(video, 0, 0, width, height);

		imageData = canvas.toDataURL('image/png');
		photo.setAttribute('src',imageData);
	}else{
		clearPhoto();
	}
}

function clearPhoto(){
	var context = canvas.getContext('2d');
	context.fillStyle = "#AAA";
	context.fillRect(0, 0, canvas.width, canvas.height);

	imageData = canvas.toDataURL('image/png');
	photo.setAttribute('src',imageData);
}

function handleUserListMsg(data) {
	console.log("handleUserlistMsg");
  var i;
  var li = "<ol>";
        

    for (i=0; i < data.users.length; i++) {
        console.log("length=>"+data.users.length);
         li += "<li><a href=&quot;#&quot;>"+data.users[i] + "</a></li>";
    }
    li+="</ol>";
   document.getElementById("userlistbox").innerHTML = li;

}

