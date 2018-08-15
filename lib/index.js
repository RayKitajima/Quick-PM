
"use strict";

const http  = require('http');
const url   = require('url');
const fs    = require('fs');
const path  = require('path');
const hjson = require('hjson');
const qpm   = require('./quickpm');

var program_file = process.argv[1];

let config   = hjson.parse(fs.readFileSync(process.argv[2],'utf8'));
let doc_root = config.Setting.doc_root || path.resolve(__dirname,"../");

const web = function(path,res){
	path.replace(/[\.\.|~|^\.]/g,''); // quick sanitize
	path = doc_root + path;
	
	fs.readFile(path,function(err,data){
		if( err ){
			res.statusCode = 404;
			return res.end();
		}
		res.end(data);
	});
};

const gate = function(req,res){
	let request_url = url.parse(req.url,true);
	let match;
	match = request_url.pathname.match(/^\/api\/(.*)/);
	if( match ){
		let api = qpm[match[1]];
		if( !api ){
			res.statusCode = 500;
			return res.end();
		}
		api(request_url.query,function(err,result){
			if( err ){
				res.statusCode = 500;
				return res.end();
			}else{
				res.writeHead(200,{'content-type':'application/json'});
				return res.end(JSON.stringify(result));
			}
		});
	}
	match = request_url.pathname.match(/^\/web\/(.*)/);
	if( match ){
		web(request_url.pathname,res);
	}else{
		res.statusCode = 404;
		res.end();
	}
};

const server = http.createServer(function(req,res){
	if( req.method == 'GET' ){
		gate(req,res);
	}else{
		res.statusCode = 500;
		res.end();
	}
});

const exit_handler = function(){
	qpm.down_all();
	console.log("\nbye");
	process.exit();
};

process.on('SIGINT',exit_handler);
process.on('SIGTERM',exit_handler);

qpm.deploy(config,function(){
	server.listen(config.Setting.port,function(){
		console.log("I'm waiting you on:");
		console.log("http://127.0.0.1:"+config.Setting.port+"/web/default/index.html");
	});
});

