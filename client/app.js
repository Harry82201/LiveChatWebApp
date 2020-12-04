// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM (elem){
	while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM (htmlString){
	let template = document.createElement('template');
	template.innerHTML = htmlString.trim();
	return template.content.firstChild;
}

var profile = {
    username: "Alice"
}

var Service = {
    origin : window.location.origin,
    getAllRooms: function(){
        return new Promise((resolve, reject)=>{
            var xhr = new XMLHttpRequest();
            xhr.open("GET", Service.origin + "/chat");
            xhr.onload = function(){
                if(xhr.status == 200){
                    console.log("getAllRooms Success: " + xhr.responseText);
                    resolve(JSON.parse(xhr.responseText));
                }
                else{
                    console.log("err: getRoom status not 200");
                    reject(new Error(xhr.responseText));
                }
            }
            xhr.onerror = function(){
                if(xhr.status >= 400 && xhr.status <= 599){
                    console.log("Server Error");
                    reject(new Error(xhr.responseText));
                }else{
                    reject(new Error(xhr.responseText));
                }
            }
            xhr.send();
        });
    },
    addRoom: function(data){
        return new Promise((resolve, reject)=>{
            var xhr = new XMLHttpRequest();
            xhr.open("POST", Service.origin + "/chat");
            xhr.onload = function(){
                if(xhr.status == 200){
                    console.log("addRoom Success: " + xhr.responseText);
                    resolve(JSON.parse(xhr.responseText));
                }
                else{
                    console.log("err: addRoom status not 200");
                    reject(new Error(xhr.responseText));
                }
            }
            xhr.onerror = function(){
                if(xhr.status >= 400 && xhr.status <= 599){
                    console.log("Server Error");
                    reject(new Error(xhr.responseText));
                }else{
                    reject(new Error(xhr.responseText));
                }
            }
            xhr.setRequestHeader("Content-Type", "application/json");
            var jsonData = JSON.stringify(data);
            xhr.send(jsonData);
        });
    },
    getLastConversation: function(roomId, before){
        
        return new Promise((resolve, reject)=>{
            var xhr = new XMLHttpRequest();
            xhr.open("GET", Service.origin + "/chat/" + roomId + "/messages?before=" + encodeURI(before));
            xhr.onload = function(){
                if(xhr.status == 200){
                    console.log("getLastConversation Success: " + xhr.responseText);
                    resolve(JSON.parse(xhr.responseText));
                }
                else{
                    console.log("err: getLastConversation status not 200");
                    reject(new Error(xhr.responseText));
                }
            }
            xhr.onerror = function(){
                if(xhr.status >= 400 && xhr.status <= 599){
                    console.log("Server Error");
                    reject(new Error(xhr.responseText));
                }else{
                    reject(new Error(xhr.responseText));
                }
            }
            xhr.send();
        });
        
    },
    getProfile: function(){
        return new Promise((resolve, reject)=>{
            var xhr = new XMLHttpRequest();
            xhr.open("GET", Service.origin + "/profile");
            xhr.onload = function(){
                if(xhr.status == 200){
                    console.log("getProfile Success: " + xhr.responseText);
                    resolve(JSON.parse(xhr.responseText));
                }
                else{
                    console.log("err: getProfile status not 200");
                    reject(new Error(xhr.responseText));
                }
            }
            xhr.onerror = function(){
                if(xhr.status >= 400 && xhr.status <= 599){
                    console.log("Server Error");
                    reject(new Error(xhr.responseText));
                }else{
                    reject(new Error(xhr.responseText));
                }
            }
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send();
        });
    }
}

function main(){

    var lobby = new Lobby();
    var socket = new WebSocket("ws://localhost:8000");

    var lobbyView = new LobbyView(lobby);
    var chatView = new ChatView(socket);
    var profileView = new ProfileView();
    
    var renderRoute = function(){ 
        var page_view_empty = document.getElementById("page-view");
        if(window.location.hash == "#/"){
            emptyDOM(page_view_empty);
            page_view_empty.appendChild(lobbyView.elem);
            //console.log("at page room: " + window.location.hash);
        }else if(window.location.hash.startsWith("#/chat")){
            var roomID = window.location.hash.substring(7);
            console.log("roomID is: " + roomID);
            var room = lobby.getRoom(roomID);
            console.log(room);
            if(room != null){
                chatView.setRoom(room);
            }
            emptyDOM(page_view_empty);
            page_view_empty.appendChild(chatView.elem);
            //console.log("at page chat: " + window.location.hash);
        }else if(window.location.hash == "#/profile"){
            emptyDOM(page_view_empty);
            page_view_empty.appendChild(profileView.elem);
            //console.log("at page profile: " + window.location.hash);
        }
    }

    var refreshLobby = function(){
        //var p1 = Service.getAllRooms
        Service.getAllRooms().then(
            (roomArray)=>{  //roomArray is the array of rooms received form the server
                for(var i = 0; i < roomArray.length; i++){
                    var new_room = roomArray[i];
                    var old_room = lobby.getRoom(new_room._id);
                    if(old_room != null){
                        old_room.name = new_room.name;
                        old_room.image = new_room.image;
                    }else{
                        lobby.addRoom(new_room._id, new_room.name, new_room.image, new_room.messages);
                    }
                }
            }
        );
    }

    window.addEventListener("popstate", renderRoute, false);
    renderRoute();
    refreshLobby();
    setInterval(refreshLobby, 10000);

    Service.getProfile().then(
        (result)=>{
            console.log("result from getProfile():");
            console.log(result);
            profile.username = result.username;
        }
    );

    socket.addEventListener("message", function(message){
        var parsed_msg = JSON.parse(message.data);
        var room = lobby.getRoom(parsed_msg.roomId);
        room.addMessage(parsed_msg.username, parsed_msg.text);
    }, false);

    cpen400a.export(arguments.callee, { renderRoute, lobbyView, chatView, profileView, lobby, socket});
    cpen400a.export(arguments.callee, { refreshLobby, lobby });
}

class LobbyView{
    constructor(lobby){
        var self = this;
        this.elem = createDOM(
            `<div class="content">
                <ul class="room-list" style="height:90%">
                    <li>
                        <img src = "assets/everyone-icon.png" alt="everyone-icon_s" style="height: 40px; width: 40px;">
                        <a href= "#/chat/room-1"><p class="room-list-text">Everyone in CPEN400A</p></a>
                    </li>
                    <li>
                        <img src = "assets/bibimbap.jpg" alt="bibimbap_s" style="height: 40px; width: 40px;">
                        <a href= "#/chat/room-2"><p class="room-list-text">Foodies only</p></a>
                    </li>
                    <li>
                        <img src = "assets/minecraft.jpg" alt="minecraft_s" style="height: 40px; width: 40px;">
                        <a href= "#/chat/room-3"><p class="room-list-text">Gamers unite</p></a>
                    </li>
                </ul>
                <div class="page-control">
                    <input type="text" id="fname" name="fname"><br><br>
                    <button class="button">Create Room</button>
                </div>
            </div>`
        );

        this.listElem = this.elem.querySelector("ul.room-list");
        this.inputElem = this.elem.querySelector("input");
        this.buttonElem = this.elem.querySelector("button");

        this.lobby = lobby;
        
        this.lobby.onNewRoom = function(room){
            //self.listElem.push();
            self.redrawList();
        }
        
        var id = 4;

        this.buttonElem.addEventListener("click", function(){
            id++;
            var textValue = self.inputElem.value;
            //self.lobby.addRoom("room-" + id, textValue, "assets/everyone-icon.png", []); // arguments?
            
            var new_data = {
                name: textValue,
                image: "assets/everyone-icon.png"
            }
            console.log("new_data:\n");
            console.log(new_data);
            Service.addRoom(new_data).then(
                (returnRoom)=>{
                    console.log("!!!!!!!! sending data !!!!!!!");
                    self.lobby.addRoom(returnRoom._id, returnRoom.name, returnRoom.image, []);
                },
                (error)=>{
                    console.log(error);
                }
            );

            self.inputElem.value = "";
        }, false);
        this.redrawList();
    }
    redrawList(){
        emptyDOM(this.listElem);
        for(var room in this.lobby.rooms){
            this.listElem.appendChild(createDOM(
                `<li>
                    <img src = ${this.lobby.rooms[room].image} alt="everyone-icon_s" style="height: 40px; width: 40px;">
                    <a href = "#/chat/${this.lobby.rooms[room].id}"><p class="room-list-text">${this.lobby.rooms[room].name}</p></a>
                </li>`
            ));
        }
    }
}

class ChatView{
    constructor(socket){
        var self = this;
        this.elem = createDOM(
            `<div class="content">
                <h4 class="room-name">Everyone in CPEN400A</h4>
                <div class="message-list" style="height:84%">
                    <div class="my-message">
                        <span class="message-user">Me</span><br>
                        <span class="message-text">Hi guys!</span>
                    </div>
                    <div class="message">
                        <span class="message-user">Charley</span><br>
                        <span class="message-text">How is everyone doing today?</span>
                    </div>
                    <div class="my-message">
                        <span class="message-user">Me</span><br>
                        <span class="message-text">I'm doing great!</span>
                    </div>
                    <div class="message">
                        <span class="message-user">Jennifer</span><br>
                        <span class="message-text">Same!</span>
                    </div>
                </div>
                <div class="page-control">
                    <textarea id="send-message" name="send-msg"> </textarea>
                    <button class="button">Send</button>
                </div>
            </div>`
        );

        this.titleElem = this.elem.querySelector("h4");
        this.chatElem = this.elem.querySelector("div.message-list");
        this.inputElem = this.elem.querySelector("textarea");
        this.buttonElem = this.elem.querySelector("button");
        
        this.chatElem.scrollTop = this.elem.querySelector("div.message-list");

        this.room = null;
        this.socket = socket;
        
        this.buttonElem.addEventListener("click", function(){
            self.sendMessage();
        }, false)
        
        this.inputElem.addEventListener("keyup", function(e){
            if(e.keyCode == 13 && !e.shiftKey){
                self.sendMessage();
            }    
        }, false)

        this.chatElem.addEventListener("wheel", function(e){
            if(self.chatElem.scrollTop == 0 && e.deltaY < 0 && self.room.canLoadConversation == true){
                self.room.getLastConversation.next();
            }
        })
    }
    sendMessage(){
        var textValue = this.inputElem.value;
        console.log(profile.username);
        console.log(textValue);
        this.room.addMessage(profile.username, textValue);
        this.inputElem.value = "";
        
        var message_to_server = {roomId: this.room.id, username: profile.username, text: textValue};
        this.socket.send(JSON.stringify(message_to_server));
    }
    setRoom(room){
        var self = this;
        this.room = room;
        this.titleElem.textContent = room.name;
        console.log("titleElem is: " + this.titleElem.textContent);
        emptyDOM(this.chatElem);
        console.log("emptying chat room");
        for(var messageIndex in this.room.messages){
            if(this.room.messages[messageIndex].username == profile.username){
                console.log("rendering my message");
                this.chatElem.appendChild(createDOM(
                    `<div class="my-message">
                        <span class="message-user">${profile.username}</span><br>
                        <span class="message-text">${this.room.messages[messageIndex].text.trim()}</span>
                    </div>`
                ));
            }else{
                console.log("rendering other's message");
                this.chatElem.appendChild(createDOM(
                    `<div class="message">
                        <span class="message-user">${this.room.messages[messageIndex].username}</span><br>
                        <span class="message-text">${this.room.messages[messageIndex].text.trim()}</span>
                    </div>`
                ));
            }
            
        }
        this.room.onNewMessage = function(message){
            console.log("message.username is: " + message.username);
            console.log("profile.username is: " + profile.username);
            if(message.username == profile.username){
                self.chatElem.appendChild(createDOM(
                    `<div class="my-message">
                        <span class="message-user">${profile.username}</span><br>
                        <span class="message-text">${message.text.trim()}</span>
                    </div>`
                ));
            }else{
                self.chatElem.appendChild(createDOM(
                    `<div class="message">
                        <span class="message-user">${message.username}</span><br>
                        <span class="message-text">${message.text.trim()}</span>
                    </div>`
                ));
            }
        }
        this.room.onFetchConversation = function(conversation){
            var message = conversation.messages;
            var temp_top = self.chatElem.scrollTop;
            for(var i = message.length - 1; i >= 0; i--){
                var msgIn = message[i];
                var msgRender;
                if(msgIn.username == profile.username){
                    msgRender = createDOM(
                        `<div class="my-message">
                            <span class="message-user">${msgIn.username}</span><br>
                            <span class="message-text">${msgIn.text.trim()}</span>
                        </div>`
                    );
                }else{
                    msgRender = createDOM(
                        `<div class="message">
                            <span class="message-user">${msgIn.username}</span><br>
                            <span class="message-text">${msgIn.text.trim()}</span>
                        </div>`
                    );
                }
                self.chatElem.insertBefore(msgRender, self.chatElem.firstChild);
            }
            self.chatElem.scrollTop = self.chatElem.scrollTop - temp_top;
        }
    }
}

class ProfileView{
    constructor(){
        this.elem = createDOM(
            `<div class="content">
                <div class="profile-form">
                    <div class="form-field" style="height: 10vh;">
                        <label for="uname">Username: </label>
                        <input type="text" id="uname" name="uname"><br><br>
                    </div>
                    <div class="form-field" style="height: 10vh;">
                        <label for="pword">Password: </label>
                        <input type="password" id="pword" name="pword"><br><br>
                    </div>
                    <div class="form-field" style="height: 10vh;">
                        <label for="fname">Avatar Image: </label>
                        <input type="file" id="fname" name="fname"><br><br>
                    </div>
                    <div class="form-field" style="height: 20vh;">
                        <label for="about">About: </label>
                        <textarea id="about" name="about"> </textarea>
                    </div>
                </div>
                <div class="page-control">
                    <button class="button">Save</button>
                </div>
            </div>`
        );
    }
}

class Room{
    constructor(id, name, image = "assets/everyone-icon.png", messages = []){
        this.id = id;
        this.name = name;
        this.image = image;
        this.messages = messages;
        this.canLoadConversation = true;
        this.timestamp = Date.now();
        this.getLastConversation = makeConversationLoader(this);
        
    }
    addMessage(username, text){
        var messageObj = {
            username: "",
            text: ""
        };
        console.log(text.trim());
        if(text.trim().length > 0){
            //messageObj = {username: username, text: text};
            messageObj.username = username;
            messageObj.text = text;
            this.messages.push(messageObj);
        }
        if(typeof this.onNewMessage === "function"){
            console.log("trying to send message");
            console.log(messageObj);
            this.onNewMessage(messageObj);
            
        }
    }
    addConversation(conversation){
        conversation.messages.forEach((msg)=>{
            this.messages.push(msg);
        })
        this.onFetchConversation(conversation);
    }
    //onFetchConversation(conversation);
}

class Lobby{
    constructor(){
        var room1Messages = [{username: "Alice", text: "Hi guys"}, {username: "Bob", text: "Hi"}, {username: "David", text: "How's everyone doing?"}];
        var room1 = new Room("room-1", "Everyone in CPEN400A", "assets/everyone-icon.png", room1Messages);
        var room2 = new Room("room-2", "Foodies only", "assets/bibimbap.jpg", []);
        var room3 = new Room("room-3", "Gamers unite", "assets/minecraft.jpg", []);
        var room4 = new Room("room-4", "room4", "assets/everyone-icon.png", []);
        //this.rooms = {"room-1": room1, "room-2": room2, "room-3": room3, "room-4": room4};
        this.rooms = {};
    }
    getRoom(roomId){
        return this.rooms[roomId];
    }
    addRoom(id, name, image, messages){
        var newRoom = new Room(id, name, image, messages);
        this.rooms[id] = newRoom;
        
        console.log(this.rooms);

        if(typeof this.onNewRoom === "function"){
            this.onNewRoom(newRoom);
        }
        
    }
}

function* makeConversationLoader(room){
    var lastTimestamp = room.timestamp;
    while((lastTimestamp > 0) && (room.canLoadConversation == true)){
        
        yield new Promise((resolve, reject)=>{
            room.canLoadConversation = false;
            Service.getLastConversation(room.id, lastTimestamp).then((res)=>{
                if(res){
                    lastTimestamp = res.timestamp;
                    room.canLoadConversation = true;
                    room.addConversation(res);
                    resolve(res);
                }else{
                    resolve(null);
                }
            });
        });
        
    }
}

window.addEventListener("load", main, false);