var crypto = require('crypto');

//Schema 객체를 정의함.
var Schema = { };

Schema.createSchema = function(mongoose){
	
	//스키마 의미
	//password를 hashed_password로 변경, default 속성 모두 추가, salt 속성 추가.
	//salt속성은 암호화 과정에서 일종의 key값으로 salt값을 사용한다.
	var UserSchema = mongoose.Schema({
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
		.set(function(password){
			this._password = password;
			this.salt = this.makeSalt();
			this.hashed_password = this.encryptPassword(password);
			console.log('virtual password 호출됨 : ' + this.hashed_password);
		})
		.get(function(){
			return this._password;
		});
	
	UserSchema.static('findById', function(id, callback){
		return this.find({id : id}, callback);
	});
		
	UserSchema.static('findAll', function(callback){
		return this.find({ }, callback);
	});
	
	//스키마에 모델 인스턴스에서 사용할 수 있는 메소드 추가.
	//비밀번호 암호화 메소드.
	UserSchema.method('encryptPassword', function(plainText, inSalt){
		if(inSalt){
			return crypto.createHmac('sha1', inSalt).update(plainText).digest('hex');
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
			console.log('authenticate 호출됨 : %s -> %s : %s', plainText,
					this.encryptPassword(plainText, inSalt), hashed_password);
			
			return this.encryptPassword(plainText, inSalt) == hashed_password;
		}else{
			console.log('authenticate 호출됨 : %s -> %s : %s', plainText,
					this.encryptPassword(plainText), hashed_password);
			
			return this.encryptPassword(plainText, inSalt) == hashed_password;
		}
	});
	
	//필수 속성에 대해 유효성 확인(길이 값 체크.)
	UserSchema.path('id').validate(function(id){
		return id.length;
	}, 'id 칼럼이 없습니다.');
	
	UserSchema.path('name').validate(function(name){
		return name.length;
	}, 'name 칼럼이 없습니다.');
	
	
	return UserSchema;
	
};

module.exports = Schema;
