
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path');

var bodyParser = require('body-parser');
var expressErrorHandler = require('express-error-handler');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
var crypto = require('crypto');

var user = require('./routes/user');

var app = express();
var database;
var UserSchema;
var UserModel;

// all environments
app.set('port', process.env.PORT || 8080);
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(expressSession({
	secret:'my key',
	resave:true,
	saveUninitialized:true
}));

function connectDB(){
	var databaseUrl = 'mongodb://localhost:27017/shopping';
	
	//데이터베이스 연결.
	mongoose.connect(databaseUrl);
	database = mongoose.connection;
	
	console.log("connect : " + database);
	
	database.on('error', console.error.bind(console, 'mongoose connection error'));
	database.on('open', function(){
		console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);
		
		createUserSchema();
		user.init(database, UserSchema, UserModel);
		
	});
	
	database.on('disconnected', connectDB);
}

function createUserSchema(){
	
	UserSchema = require('./database/user_schema').createSchema(mongoose);
	//UserModel 정의.
	UserModel = mongoose.model("user3", UserSchema);
	console.log('UserModel 정의함.');
	
}

app.post('/process/adduser', user.adduser);
app.post('/process/login', user.login);
app.post('/process/listuser', user.listuser);

var errorHandler = expressErrorHandler({
	static :{
		'404' : './public/404.html'
	}
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

http.createServer(app).listen(app.get('port'), function(){
	console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));
	
	connectDB();
});
