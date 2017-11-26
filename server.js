var WebSocketServer = require('ws').Server,
wss = new WebSocketServer({ port: 8888 }),users = {};
var connectionArray= [];
var connectArray=[];
var appendToMakeUnique = 1;
function isUsernameUnique(name) {
  var isUnique = true;
  var i;

  for (i=0; i<connectionArray.length; i++) {
    if (connectionArray[i].username === name) {
      isUnique = false;
      break;
    }
  }
  return isUnique;
}


function makeUserListMessage() {
  var userListMsg = {
    type: "userlist",
    users: []
  };
  var i;

  // Add the users to the list

  for (i=0; i<connectionArray.length; i++) {
    userListMsg.users.push(connectionArray[i].username);
  }

  return userListMsg;
}

function sendUserListToAll() {
  var userListMsg = makeUserListMessage();
  var userListMsgStr = JSON.stringify(userListMsg);
  var i;

  for (i=0; i<connectionArray.length; i++) {
    connectionArray[i].send(userListMsgStr);
  }
}


wss.on('connection', function (connection) {
	connectionArray.push(connection);
connection.on('message', function (message) {
	var data;
	var sendToClients=true;
	try {
		data = JSON.parse(message);
	} catch (e) {
		console.log("Error parsing JSON");
		data = {};
	}
	switch (data.type) {
		case "login":
			console.log("User logged in as", data.name);
			if (users[data.name]) {
				sendTo(connection, {
					type: "login",
					success: false
				});
			} else {
				users[data.name] = connection;
				connection.name = data.name;
				connectArray.push(data.name);
				sendTo(connection, {
					type: "login",
					success: true,
					connectArray: connectArray
				});
				console.log(connectArray);
				//console.log(connectionArray);
			}
		break;

		case "username":
              /**var nameChanged = false;
              var origName = data.name;

              while (!isUsernameUnique(data.name)) {
                data.name = origName + appendToMakeUnique;
                appendToMakeUnique++;
                nameChanged = true;
              }

              if (nameChanged) {
                var changeMsg = {
                  type: "rejectusername",
                  name: data.name
                };
                connection.send(JSON.stringify(changeMsg));
              }**/

              connection.username = data.name;
              sendUserListToAll();
              break;

		case "offer":
			console.log("Sending offer to", data.name);
			var conn = users[data.name];
			if (conn != null) {
				connection.otherName = data.name;
				sendTo(conn, {
					type: "offer",
					offer: data.offer,
					name: connection.name
				});
			}
		break;

		case "answer":
			console.log("Sending answer to", data.name);
			var conn = users[data.name];
			if (conn != null) {
				connection.otherName = data.name;
				sendTo(conn, {
					type: "answer",
					answer: data.answer
					
				});
			}
		break;

		case "candidate":
			console.log("Sending candidate to", data.name);
			var conn = users[data.name];
			if (conn != null) {
				sendTo(conn, {
					type: "candidate",
					candidate: data.candidate
				});
			}
		break;

		case "leave":
			console.log("Disconnecting user from", data.name);
			var conn = users[data.name];
			conn.otherName = null;
			if (conn != null) {
				sendTo(conn, {
					type: "leave"
					
				});
			}
		break;

		default:
			sendTo(connection, {
				type: "error",
				message: "Unrecognized command: " + data.type
			});
		break;
	}
});
connection.on('close', function (connection) {
	
	connectionArray.pop(connection);
	console.log("closing connection");
	/*connectionArray = connectionArray.filter(function(el, idx, ar) {
      return el.connected;
    });*/
	console.log(connectionArray.length);
	
	sendUserListToAll();
	
    
/*	if (connection.name) {
	delete users[connection.name];
		if (connection.otherName) {
		console.log("Disconnecting user from",connection.otherName);
		var conn = users[connection.otherName];
		conn.otherName = null;
			if (conn != null) {
				sendTo(conn, {
					type: "leave"
				});
			}
		}
	}
	
    sendUserListToAll();*/
    
});
});

function sendTo(conn, message) {
	conn.send(JSON.stringify(message));
}
wss.on('listening', function () {
console.log("Server started...");
});