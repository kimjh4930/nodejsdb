module.exports = {
		server_port : 8080,
		db_url : 'mongodb://localhost:27017/shopping',
		db_schemas : [
			{file:'./database/user_schema', collection:'user3', schemaName:'UserSchema', modelName:'UserModel'}
		],
		route_info : [
			{file : './routes/user', path : '/process/login', method : 'login', type : 'post'},
			{file : './routes/user', path : '/process/adduser', method : 'adduser', type : 'post'},
			{file : './routes/user', path : '/process/listuser', method : 'listuser', type : 'post'}
		]
		
	
	
}