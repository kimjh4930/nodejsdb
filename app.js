
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
	
	database.on('error', console.error.bind(console, 'mongoose connection error'));
	database.on('open', function(){
		console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);
		
		//스키마 정의.
		UserSchema = mongoose.Schema({
			id: {type:String, required:true, unique:true},
			password : {type:String, required:true},
			name : String,
			age : Number,
			create_at:Date,
			update_at:Date
		});
		
		console.log('UserSchema 정의함.');
		
		//User 모델 정의
		UserModel = mongoose.model("users", UserSchema);
		console.log('users 정의함.');
		
	});
	
	database.on('disconnected', connectDB);
}

//사용자를 인증하는 함수
var authUser = function(database, id, password, callback){
	console.log('authUser 호출됨.');
	
	var users = database.collection('users');
	
	//아이디와 비밀번호를 사용해 검색.
	UserModel.find({"id" : id, "password" : password}, function(err, results){
		if (err){
			callback(err, null);
			return;
		}
		
		console.log('아이디 [%s], 비밀번호 [%s]로 사용자 검색 결과.',id, password);
		console.dir(results);
		
		if(results.length > 0){
			console.log('아이디 [%s], 비밀번호 [%s]가 일치하는 사용자를 찾음.', id, password);
			callback(null, results);
		}else{
			console.log('일치하는 사용자를 찾지 못함.');
			callback(null, null);
		}
		
	});
}

//사용자 등록하는 함수.
var addUser = function(database, id, password, name, callback){
	console.log('addUser 호출됨.');
	
	//user컬렉션 참조.
	var users = new UserModel({"id" : id, "password" : password, "name" : name});
	
	//save로 저장.
	users.save(function(err){
		if(err){
			callback(err, null);
			return;
		}
		
		console.log('사용자 데이터 추가함.');
		callback(null, users);
	});
}

app.post('/process/adduser', function(req, res){
	console.log('/process/adduser 호출됨.');
	
	var paramId = req.param('id');
	var paramPassword = req.param('password');
	var paramName = req.param('name');
	
	if(database){
		addUser(database, paramId, paramPassword, paramName, function(err, result){
			if(err) throw err;
			
			if(result){
				console.dir(result);
				
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자 추가 성공</h2>');
				res.end();
			}else{
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자 추가 실패</h2>');
				res.end();
			}
		});
	}else{
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결실패.</h2>');
		res.end();
	}
});

app.post('/process/login', function(req,res){
	console.log('/process/login 호출됨.');
	
	var paramId = req.param('id');
	var paramPassword = req.param('password');
	
	if(database){
		authUser(database, paramId, paramPassword, function(err, docs){
			if(err) {throw err;}
			
			if(docs){
				console.dir(docs);
				
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h1>로그인 성공.</h1>');
				res.write('<div><p>사용자 아이디 : ' + paramId + '</p></div>');
				res.write('<div><p>사용자 이름 : ' + docs[0].name + '</p></div>');
				res.write("<br><br><a href='/login.html'>다시 로그인하기</a>");
				res.end();
			}else{
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h1>로그인 실패</h1>');
				res.write('<div><p>아이디와 비밀번호를 다시 확인하십시오.</p></div>');
				res.write("<br><br><a href='/login.html'>다시 로그인하기.</a>");
				res.end();
			}
			
		});
	}else{
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패.</h2>');
		res.write('<div><p>데이터베이스에 연결하지 못했습니다.</p></div>');
		res.end();
	}
});

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
