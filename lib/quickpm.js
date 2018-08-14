
"use strict";

const spawn = require('child_process').spawn;

let Config   = '';
let Services = {};

// *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    * 

let api_status = function(query,callback){
	let name = query.name;
	if( name ){
		if( !Services[name] ){ callback(true); }
		return callback(false, { status : Services[name].status });
	}else{
		let names = Object.keys(Services);
		let statuses = [];
		for( let i=0; i<names.length; i++ ){
			statuses.push({
				name   : names[i],
				status : Services[names[i]].status
			});
		}
		return callback(false, { statuses : statuses });
	}
};

let api_stdout = function(query,callback){
	let name = query.name;
	if( !name ){ return callback(true); }
	if( !Services[name] ){ return callback(true); }
	
	let offset = query.offset || 0;
	let buff = [];
	for( let i=0; i<Services[name].stdout.length; i++ ){
		if( i>=offset ){ buff.push(Services[name].stdout[i]); }
	}
	callback(false, { stdout: buff });
};

let api_stderr = function(query,callback){
	let name = query.name;
	if( !name ){ return callback(true); }
	if( !Services[name] ){ return callback(true); }
	
	let offset = query.offset || 0;
	let buff = [];
	for( let i=0; i<Services[name].stderr.length; i++ ){
		if( i>=offset ){ buff.push(Services[name].stderr[i]); }
	}
	callback(false, { stdout: buff });
};

let api_start = function(query,callback){
	let name = query.name;
	if( !name ){ return callback(true); }
	if( !Services[name] ){ return callback(true); }
	
	let service = Services[name];
	up_service(service,true);
	
	callback(false, { status: 'up' });
};

let api_stop = function(query,callback){
	let name = query.name;
	if( !name ){ return callback(true); }
	if( !Services[name] ){ return callback(true); }
	
	down_service(name);
	
	callback(false, { status: 'down' });
};

let api_restart = function(query,callback){
	let name = query.name;
	if( !name ){ return callback(true); }
	if( !Services[name] ){ return callback(true); }
	
	down_service(name);
	up_service(name,true);
	
	callback(false, { status: 'up' });
};

let api_startall = function(query,callback){
	up_all();
	callback(false, { status: 'done' });
};

let api_stopall = function(query,callback){
	down_all();
	callback(false, { status: 'done' });
};

let api_config = function(query,callback){
	callback(false, { config: Config });
};

// *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    * 

let down_all = function(){
	let services = Config.Services;
	for( let i=0; i<services.length; i++ ){
		if( services[i].status != 'down' ){
			down_service(services[i].name);
		}
	}
};

let up_all = function(){
	let services = Config.Services;
	for( let i=0; i<services.length; i++ ){
		if( services[i].status != 'up' ){
			up_service(services[i],true);
		}
	}
};

let down_service = function(name){
	let proc = Services[name].proc;
	if( proc ){
		proc.kill();
	}
	Services[name].status = 'down';
};

let up_service = function(service,force){
	let name = service.name;
	let env  = service.env;
	let cmd  = service.cmd;
	let args = service.args;
	let stdout = [];
	let stderr = [];
	
	let should_start = service.start;
	
	let merged_env = Object.create( process.env );
	let envs = Object.keys(env);
	for( let i=0; i<envs.length; i++ ){
		merged_env[envs[i]] = env[envs[i]];
	}
	
	let proc   = '';
	let status = 'down';
	if( should_start || force ){
		proc = spawn(cmd,args,{ env:merged_env });
		proc.stdout.on('data',function(data){
			stdout.push(data.toString());
		});
		proc.stderr.on('data',function(data){
			stderr.push(data.toString());
		});
		status = 'up';
	}
	Services[name] = {
		proc   : proc,
		name   : name,
		env    : env,
		cmd    : cmd,
		args   : args,
		stdout : stdout,
		status : status,
	};
};

let deploy = function(conf,callback){
	Config = conf;
	let services = Config.Services;
	for( let i=0; i<services.length; i++ ){
		if( services[i].status != 'up' ){
			up_service(services[i],false);
		}
	}
	callback();
};

// *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    * 

module.exports = {
	deploy   : deploy,
	status   : api_status,
	stdout   : api_stdout,
	stderr   : api_stderr,
	start    : api_start,
	startall : api_startall,
	stop     : api_stop,
	stopall  : api_stopall,
	restart  : api_restart,
	config   : api_config,
	down_all : down_all,
};
