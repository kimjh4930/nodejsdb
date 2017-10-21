//사용자 처리 함수를 분리.

var database;
var UserSchema;
var UserModel;

var init = function(db, schema, model){
	
	console.log('user 초기화.');
	
	database = db;
	UserSchema = schema;
	UserModel = model;
}

var login = function(req, res){
	
	console.log('/process/login 호출됨.');
	
	var paramId = req.param('id');
	var paramPassword = req.param('password');
	
	console.log('user : ' + database);
	
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
	
}

var adduser = function(req, res){
	
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
	
}

var listuser = function(req, res){
	
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

module.exports.init = init;
module.exports.login = login;
module.exports.adduser = adduser;
module.exports.listuser = listuser;