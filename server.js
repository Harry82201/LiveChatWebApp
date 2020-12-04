// assuming cpen400a-tester.js is in the same directory as server.js
const cpen400a = require('./cpen400a-tester.js');
const crypto = require('crypto');

var mongoUrl = "mongodb://localhost:27017";
var dbName = "cpen400a-messenger";
var Database = require("./Database.js");
var db = new Database(mongoUrl, dbName);

const path = require('path');
const fs = require('fs');
const express = require('express');
const WebSocket = require('ws');
const SessionManager = require('./SessionManager.js');
var broker = new WebSocket.Server({port: 8000});

var sessionManager = new SessionManager();

/*
var chatrooms = [
	{
		id: "room-1",
		name: "name-1",
		image: "assets/everyone-icon.png"
	},
	{
		id: "room-2",
		name: "name-2",
		image: "assets/bibimbap.jpg"
	},
	{
		id: "room-3",
		name: "name-3",
		image: "assets/minecraft.jpg"
	}
]
*/

/*
var messages = {
	"room-1": [],
	"room-2": [],
	"room-3": []
}
*/

//for(var room in chatrooms){
//	messages[room.id].push({});
//}

var messageBlockSize = 10;

var messages = {};
db.getRooms().then((res)=>{
	for(var room of res){
		messages[room._id] = [];
	}
});

function isCorrectPassword(password, saltedHash){
	var salt = saltedHash.substring(0, 20);
    var hash = saltedHash.substring(20);
    var passwordIN = crypto.createHash('SHA256').update(password + salt).digest('BASE64');
    return passwordIN == hash;
}


function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

app.use('/chat/:room_id/messages', sessionManager.middleware);
app.use('/chat/:room_id', sessionManager.middleware);
app.use('/chat', sessionManager.middleware);
app.use('/profile', sessionManager.middleware);
app.use('/app.js', sessionManager.middleware, express.static(clientApp + '/app.js'));
app.use('/index.html', sessionManager.middleware, express.static(clientApp + '/index.html'));
app.use('/index', sessionManager.middleware, express.static(clientApp + '/index.html'));
app.use(/^\/$/, sessionManager.middleware, express.static(clientApp, { extensions: ['html'] }));


app.use(function(err, req, res, next){
	if(err instanceof SessionManager.Error) {
		if(req.headers.accept == 'application/json'){
			res.status(401).json(err);
		}else{
			res.redirect('/login');
		}
	}else if(err){
		res.status(500).send();
	} else {
		next();
	}
})

//hardcode returnArray now for test
		/*
		var returnArray = [
			{id: "room-1", name: "name-1", image: "assets/everyone-icon.png", messages: []},
			{id: "room-2", name: "name-2", image: "assets/bibimbap.jpg", messages: []},
			{id: "room-3", name: "name-3", image: "assets/minecraft.jpg", messages: []}
		];
		*/

app.route('/login')
	.get(function(req, res){
		res.sendFile(path.join(__dirname, 'client/login.html'));
	})
	.post(function(req, res){
		var username = req.body.username;
		var password = req.body.password;
		console.log(password);
		var maxAge = req.body.maxAge;
		db.getUser(username).then((user)=>{
			if(user == null){
				res.redirect('/login');
			}else{
				if(isCorrectPassword(password, user.password)){
					sessionManager.createSession(res, username, maxAge);
					res.redirect('/');
				}else{
					res.redirect('/login');
				}
			}
		})
	})



app.route('/chat')
	.get(function(req, res){
		var returnArray = [];
		db.getRooms().then((roomList)=>{
			//console.log("roomList:");
			//console.log(roomList);
			for(var room of roomList){
				room["messages"] = messages[room._id];
				//console.log("combined room:");
				//console.log(room);
				returnArray.push(room);
				//console.log("returnArray:");
				//console.log(returnArray);
			}
			res.send(JSON.stringify(returnArray));
		});
		
	})
	.post(function(req, res){
		//console.log("req is: " + req);
		var data = req.body;
		//console.log("data is: \n");
		//console.log(data["name"]);
		
		if(data.name === undefined){
			res.status(400).send("does not have name field");
		}else{
			//var new_id = (Math.floor(Math.random() * 10) + 5).toString();
			var new_room = {
			//	id: "room-" + new_id,
				name: data.name,
				image: data.image
			};

			//console.log("==================================new room=========================");
			//console.log(new_room);

			db.addRoom(new_room).then((added_room)=>{
				messages[added_room._id] = [];
				res.status(200).send(JSON.stringify(added_room));
			});

			//chatrooms.push(new_room);
			//messages["room-" + new_id] = [];
			//console.log("updated messages:\n");
			//console.log(messages);
			
			//res.status(200).send(JSON.stringify(new_room));
		}
	});

app.route('/chat/:room_id')
	.get(function(req, res){
		var roomId = req.params.room_id;
		//console.log("room id is: ");
		//console.log(roomId);
		db.getRoom(roomId).then((room)=>{
			if(room != null){
				//console.log("room:");
				//console.log(room);
				res.status(200).send(room);
			}else{
				res.status(404).send("Room " + roomId + " was not found");
			}
		});
	});

app.route('/chat/:room_id/messages')
	.get(function(req, res){
		var roomId = req.params.room_id;
		var before = parseInt(req.query.before);
		
		db.getLastConversation(roomId, before).then((conversation)=>{
			if(conversation !== null && conversation.length > 0){
				res.status(200).send(conversation);
			}else{
				res.status(404).send("Conversation was not found");
			}
		})
	});

app.route('/profile')
	.get(function(req, res){
		var obj = {
			"username": req.username
		};
		console.log("/profile object is:");
		console.log(obj);
		res.send(obj);
	})

app.route('/logout')
	.get(function(req, res){
		sessionManager.deleteSession(req);
		res.redirect('/login');
	})

console.log("Ready for broker!");
broker.on('connection', function(ws, request){
	console.log("Ready for ws!");
	var cookie = request.headers.cookie;
	if(cookie != null && cookie != undefined){
		var cookieVal = cookie.split('=')[1];
	}
	if(cookie === undefined || sessionManager.getUsername(cookieVal) === null){
		ws.close();
	}else{
		ws.on('message', function(data){

			//console.log("data is:");
			//console.log(data);

			var message_in = JSON.parse(data);
		
			//console.log("message_in is:");
			//console.log(message_in);

			let new_name = sessionManager.getUsername(request.headers.cookie.split('=')[1]);
		
			var msg_obj = {username: new_name, text: message_in.text};
			messages[message_in.roomId].push(msg_obj);
		
			//console.log("task5 updated messages:");
			//console.log(messages);

			if(messages[message_in.roomId].length == messageBlockSize){
				var conversation = {
					room_id: message_in.roomId,
					timestamp: Date.now(),
					messages: messages[message_in.roomId]
				};
				//console.log("conversation is:");
				//console.log(conversation);
				db.addConversation(conversation)
					.then()
					.catch((err)=>{console.log(err)});
				messages[message_in.roomId] = [];
			}

			broker.clients.forEach(function(client){
				if(client !== ws && client.readyState === WebSocket.OPEN){
					client.send(JSON.stringify(msg_obj));
				}
			});

		});
	}
});

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

// at the very end of server.js
cpen400a.connect('http://35.183.65.155/cpen400a/test-a5-server.js');
cpen400a.export(__filename, { app, messages, broker, db, messageBlockSize, sessionManager, isCorrectPassword });