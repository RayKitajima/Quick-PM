
"use strict";

const http  = require('http');

let counter = 0;

const server = http.createServer(function(req,res){
	res.writeHead(200,{'content-type':'text/plain'});
	res.end("[DemoApp1] "+counter);
});

server.listen(10091,function(){
	console.log("demo app listening on port 10091");
	
	setInterval(function(){
		counter++;
		console.log("[DemoApp1] "+counter);
	},1000);
});

