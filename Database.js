const { MongoClient, ObjectID } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v3.6+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/3.6/api/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen400a app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			(err, client) => {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getRooms = function(){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatrooms from `db`
			 * and resolve an array of chatrooms */
            db.collection("chatrooms").find({}).toArray()
                .then((result)=>{
                    //console.log("Result:");
                    //console.log(result);
                    resolve(result);
                });
		})
	)
}

Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatroom from `db`
			 * and resolve the result */
            var id;
            try{
               id = ObjectID(room_id);
            }catch(error){
               id = room_id;
            }
            var room = db.collection("chatrooms").findOne({"_id": id});
            room.then(resolve(room)).catch(resolve(null));
		})
	)
}

Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			/* TODO: insert a room in the "chatrooms" collection in `db`
			 * and resolve the newly added room */
            if(room["name"] === undefined){
                reject(room);
            }else{
                if(room["id"] === undefined || room["id"] === null){
                    room["_id"] = ObjectID();
                }
                db.collection("chatrooms").insertOne(room)
                    .then(resolve(room))
                    .catch((err)=>{console.log(err)});
            } 
            
		})
	)
}

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
            if(before === undefined || before === null){
                before = Date.now();
            }
            var conversations = db.collection("conversations").find({"room_id": room_id, timestamp:{$lt: before}});
            conversations.toArray().then((result)=>{
                if(result != null){
                    //console.log("getLastConversation result:");
                    //console.log(result);
                    var minDiffTime = Math.abs(result[0].timestamp - before);
                    var conversation = null;
                    for(var i = 0; i < result.length; i++){
                        var curDiffTime = Math.abs(result[i].timestamp - before);
                        if(minDiffTime > curDiffTime){
                            minDiffTime = curDiffTime;
                            conversation = result[i];
                        }
                    }
                    if(conversation != null){
                        resolve(conversation);
                    }else{
                        resolve(null);
                    }
                }else{
                    resolve(null);
                }
            }).catch((err)=>{console.log(err)});
               
		})
	)
}

Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */
            if(conversation.room_id === undefined || conversation.timestamp === undefined || conversation.messages === undefined){
                reject(conversation);
            }else{
                db.collection("conversations").insertOne(conversation)
                .then(resolve(conversation))
            }
		})
	)
}

Database.prototype.getUser = function(username){
    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            //var user = db.collection("users").findOne({"username": username});
            //user.then(resolve(user)).catch(resolve(null));
            
            var user = db.collection("users").find({"username": username});
            user.toArray().then((result)=>{
                if(result != null){
                    resolve(result);
                }else{
                    resolve(null);
                }
            }).catch((err)=>{console.log(err)});
        })
    )
}



module.exports = Database;