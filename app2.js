
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

var user = require('./routes/user');

//분리한 모듈 불러오기
var config = require('./config');
var database = require('./database/database');
var route_loader = require('./routes/route_loader');


// all environments
console.log('config.server_port : %d', config.server_port);
app.set('port', process.env.PORT || 8080);
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(expressSession({
	secret:'my key',
	resave:true,
	saveUninitialized:true
}));

//라우팅 정보를 읽어들여 라우팅 설정
route_loader.init(app, express.Router());

var errorHandler = expressErrorHandler({
	static :{
		'404' : './public/404.html'
	}
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

http.createServer(app).listen(app.get('port'), function(){
	console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));
	
	//데이터베이스 초기화.
	database.init(app, config);
});
