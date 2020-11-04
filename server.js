// assuming cpen400a-tester.js is in the same directory as server.js
const cpen400a = require('./cpen400a-tester.js');

const path = require('path');
const fs = require('fs');
const express = require('express');

var chatrooms = {
	1: {
		id: "room-1",
		name: "name-1",
		image: null
	},
	2: {
		id: "room-2",
		name: "name-2",
		image: null
	},
	3: {
		id: "room-3",
		name: "name-3",
		image: null
	}
}

var messages = {
	"room-1": {},
	"room-2": {},
	"room-3": {}
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

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

// at the very end of server.js
cpen400a.connect('http://35.183.65.155/cpen400a/test-a3-server.js');
cpen400a.export(__filename, { app });