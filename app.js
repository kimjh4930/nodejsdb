
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
		
		//스키마 정의.
//		UserSchema = mongoose.Schema({
//			id: {type:String, required:true, unique:true},
//			password : {type:String, required:true},
//			name : {type:String, index:'hashed'},
//			age : {type:Number, 'default':-1},
//			create_at:{type : Date, index : {unique : false}, 'default': Date.now},
//			update_at:{type : Date, index : {unique : false}, 'default': Date.now}
//		});
//		
//		UserSchema.static('findbyId', function(id, callback){
//			return this.find({id : id}, callback);
//		});
//		
//		UserSchema.static('findAll', function(callback){
//			return this.find({ }, callback);
//		});
//		
//		console.log('UserSchema 정의함.');
//		
//		//User 모델 정의
//		UserModel = mongoose.model("users2", UserSchema);
//		console.log('users 정의함.');
		
	});
	
	database.on('disconnected', connectDB);
}

function createUserSchema(){
	
	//스키마 의미
	//password를 hashed_password로 변경, default 속성 모두 추가, salt 속성 추가.
	//salt속성은 암호화 과정에서 일종의 key값으로 salt값을 사용한다.
	UserSchema = mongoose.Schema({
		id : {type : String, required : true, unique : true, 'default' : ' '},
		hashed_password : {type : String, required : true, 'default' : ' '},
		salt : {type : String, required : true},
		name : {type : String, index : 'hashed', 'default' : ' '},
		age : {type : Number, 'default' : -1},
		create_at : {type : Date, index : {unique : false}, 'default' : Date.now},
		create_at : {type : Date, index : {unique : false}, 'default' : Date.now}
	});
	
	UserSchema
		.virtual('password')
		.set(function(){
			this._password = password;
			this.salt = this.makeSalt();
			this.hashed_password = this.encryptPassword(password);
			console.log('virtual password 호출됨 : ' + this.hashed_password);
		})
		.get(function(){
			return this._password;
		});
	
	UserSchema.static('findbyId', function(id, callback){
		return this.find({id : id}, callback);
	});
		
	UserSchema.static('findAll', function(callback){
		return this.find({ }, callback);
	});
	
	//스키마에 모델 인스턴스에서 사용할 수 있는 메소드 추가.
	//비밀번호 암호화 메소드.
	UserSchema.method('encryptPassword', function(plainText, inSalt){
		if(inSalt){
			return crypto.createHmac('sha1', inSalt)
		}else{
			return crypto.createHmac('sha1', this.salt).update(plainText).digest('hex');
		}
	});
	
	//salt값 만들기 메소드
	UserSchema.method('makeSalt', function(){
		return Math.round((new Date().valueOf() * Math.random())) + '';
	});
	
	//인증 메소드 - 입력된 비밀번호와 비교
	UserSchema.method('authenticate', function(plainText, inSalt, hashed_password){
		if(inSalt){
			console.log('authenticate 호출됨 : %s -> %s', plainText,
					this.encryptPassword(plainText, inSalt), hashed_password);
			
			return this.encryptPassword(plainText, inSalt) == hashed_password;
		}else{
			console.log('authenticate 호출됨 : %s -> %s', plainText,
					this.encryptPassword(plainText), hashed_password);
		}
	});
	
	//필수 속성에 대해 유효성 확인(길이 값 체크.)
	UserSchema.path('id').validate(function(id){
		return id.length;
	}, 'id 칼럼이 없습니다.');
	
	UserSchema.path('name').validate(function(name){
		return name.length;
	}, 'name 칼럼이 없습니다.');
	
	
	UserModel = mongoose.model("users3", UserSchema);
	console.log('users 정의함.');
	
}


//사용자를 인증하는 함수
var authUser = function(database, id, password, callback){
	console.log('authUser 호출됨.');
	
	//아이디를 이용해 검색.
	UserModel.findById(id, function(err, result){
		
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
	
	console.log('id : ' + paramId + ', password : ' + paramPassword + ', name : ' + paramName);
	
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

app.post('/process/listuser', function(req, res){
	console.log('/process/listuser 호출됨.');
	
	if(database){
		// 1.모든 사용자 검색.
		UserModel.findAll(function(err, results){
			if(err){
				callback(err, null);
				return;
			}
			
			if(results){
				console.dir(results);
				
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자리스트.</h2>');
				res.write('<div><ul>');
				
				for(var index=0; index < results.length; index++){
					var curId = results[index]._doc.id;
					var curName = results[index]._doc.name;
					res.write("      <li>#" + index + ' : ' + curId + ', ' + curName + '</li>');
				}
				
				res.write('</ul></div>');
				res.end();
			}else{
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자 리스트 조회 실패</h2>');
				res.end();
			}
		});
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
