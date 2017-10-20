
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

var app = express();
var database;
var UserSchema;
var UserModel;

var user = require('./routes/user');

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
	
	database.on('error', console.error.bind(console, 'mongoose connection error'));
	database.on('open', function(){
		console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);
		
		createUserSchema();
		
	});
	
	database.on('disconnected', connectDB);
}

function createUserSchema(){
	
	//스키마 의미
	//password를 hashed_password로 변경, default 속성 모두 추가, salt 속성 추가.
	//salt속성은 암호화 과정에서 일종의 key값으로 salt값을 사용한다.
	
	UserSchema = require('./user_schema').createSchema(mongoose);
	UserModel = mongoose.model("users3", UserSchema);

	user.init(database, UserSchema, UserModel);
	
}


//사용자를 인증하는 함수
var authUser = function(database, id, password, callback){
	console.log('authUser 호출됨.');
	
	//아이디를 이용해 검색.
	UserModel.findById(id, function(err, results){
		
		if (err){
			callback(err, null);
			return;
		}
		
		console.log('아이디 [%s], 비밀번호 [%s]로 사용자 검색 결과.',id, password);
		console.dir(results);
		
		if(results.length > 0){
			
			console.log('아이디와 일치하는 사용자 찾음.');
			
			//2. 비밀번호 확인 : 모델 인스턴스를 객체로 만들고 authenticate() 메소드 호출.
			var user = new UserModel({id : id});
			var authenticated = user.authenticate(password, results[0]._doc.salt, results[0]._doc.hashed_password);
			
			if(authenticated){
				console.log('비밀번호 일치함.');
				callback(null, results);
			}else{
				console.log('비밀번호 일치하지 않음.');
				callback(null, null);
			}
			
		}else{
			console.log('일치하는 사용자를 찾지 못함.');
			callback(null, null);
		}
		
	});
}

//사용자 등록하는 함수.
var addUser = function(database, id, password, name, callback){
	console.log('addUser 호출됨.');
	
	console.log('id : ' + id + ', password : ' + password + ', name : ' + name);
	
	//user컬렉션 참조.
	var user = new UserModel({"id":id, "password":password, "name":name});
	
	//save로 저장.
	user.save(function(err){
		if(err){
			callback(err, null);
			return;
		}
		
		console.log('사용자 데이터 추가함.');
		callback(null, user);
	});
}

app.post('/process/adduser', user.adduser );
app.post('/process/login', user.login );
app.post('/process/listuser', user.listuser );

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
