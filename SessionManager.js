const crypto = require('crypto');

class SessionError extends Error {};

function SessionManager (){
	// default session length - you might want to
	// set this to something small during development
	const CookieMaxAgeMs = 600000;

	// keeping the session data inside a closure to keep them protected
	const sessions = {};

	// might be worth thinking about why we create these functions
	// as anonymous functions (per each instance) and not as prototype methods
	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
        /* To be implemented */
        var token = crypto.randomBytes(30).toString("hex");
        var newObj = {
            "username": username,
        };
        sessions[token] = newObj;
        response.cookie('cpen400a-session', token, {maxAge: maxAge});
        setTimeout(function(){delete sessions[token]}, maxAge);
	};

	this.deleteSession = (request) => {
        /* To be implemented */
        delete request.username;
        var tempSession = request.session;
		delete request.session;
		delete sessions[tempSession];
	};

	this.middleware = (request, response, next) => {
        /* To be implemented */
		if (request.headers.cookie == null || request.headers.cookie == undefined) {
            next(new SessionError('error'));
        }else{
            var cookie = request.headers.cookie.split(';').find(row => row.startsWith('cpen400a-session')).split('=')[1];
            if (cookie in sessions){
                request.username = sessions[cookie].username;
                request.session = cookie;
                next();
            }else {
                next(new SessionError('error'));
            }
        }
        
	};

	// this function is used by the test script.
	// you can use it if you want.
	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;