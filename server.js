// assuming cpen400a-tester.js is in the same directory as server.js
const cpen400a = require('./cpen400a-tester.js');

const path = require('path');
const fs = require('fs');
const express = require('express');

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

var messages = {
	"room-1": [],
	"room-2": [],
	"room-3": []
}

//for(var room in chatrooms){
//	messages[room.id].push({});
//}

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

// express app
let app = express();

app.route('/chat')
	.get(function(req, res){
		//hardcode returnArray now for test
		var returnArray = [
			{id: "room-1", name: "name-1", image: "assets/everyone-icon.png", messages: []},
			{id: "room-2", name: "name-2", image: "assets/bibimbap.jpg", messages: []},
			{id: "room-3", name: "name-3", image: "assets/minecraft.jpg", messages: []}
		];
		res.send(JSON.stringify(returnArray));
	})
	.post(function(req, res){
		var data = req.body;
		//console.log(data.name);
		
		if(data["name"] === "undefined"){
			res.status(400).send("does not have name field");
		}else{
			var new_id = (Math.floor(Math.random() * 10) + 5).toString();
			//var new_id = "room-10";
			var new_room = {
				id: "room-" + new_id,
				name: data["name"],
				image: data["image"]
			};
			chatrooms.push(new_room);
			messages["new_id"] = [];
			res.status(200).send(JSON.stringify(new_room));
		}
	})

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

// at the very end of server.js
cpen400a.connect('http://35.183.65.155/cpen400a/test-a3-server.js');
cpen400a.export(__filename, { app, chatrooms, messages });