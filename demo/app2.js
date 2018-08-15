
"use strict";

const http  = require('http');

let counter = 0;

const server = http.createServer(function(req,res){
	res.writeHead(200,{'content-type':'text/plain'});
	res.end("[DemoApp2] "+counter);
});

server.listen(10092,function(){
	console.log("demo app listening on port 10092");
	
	setInterval(function(){
		counter++;
		console.log("count: "+counter);
	},1000);
});
