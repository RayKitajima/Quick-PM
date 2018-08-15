
window.QPM = {};
window.QPM.Func = {};

window.QPM.Func.ajax = function(url,callback){
	var http = new XMLHttpRequest();
	http.onload = function(e){ callback(this.responseText); };
	http.onerror = function(e){ alert('Cannot load'); };
	http.ontimeout = function(){ alert('Timeout'); };
	http.open('GET',url);
	http.send();
};

// *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    * 

window.QPM.Func.update_status_all = function(){
	var names = Object.keys(QPM.Services);
	for( var i=0; i<names.length; i++ ){
		QPM.Func.update_status(names[i]);
	}
};

window.QPM.Func.check_status = function(){
	var names = Object.keys(QPM.Services);
	var power_off = true;
	for( var i=0; i<names.length; i++ ){
		if( QPM.Services[names[i]].status == 'up' ){
			power_off = false;
			break;
		}
	}
	if( power_off ){
		window.QPM.Func.power_status_off();
	}else{
		window.QPM.Func.power_status_on();
	}
};

// *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    * 

window.QPM.Func.update_status = function(name){
	var url = '/api/status';
	if( name ){ url = url + '?name=' + name; }
	QPM.Func.ajax(url,function(responseText){
		var result = JSON.parse(responseText);
		if( result.status == 'up' ){
			QPM.Func.status_up(name);
		}else{
			QPM.Func.status_down(name);
		}
	});
};

window.QPM.Func.status_up = function(name){
	var ui_on  = $("#on_"+name);
	var ui_off = $("#off_"+name);
	ui_on.css('display','block');
	ui_off.css('display','none');
	QPM.Services[name].status = 'up';
	QPM.Func.check_status();
};

window.QPM.Func.status_down = function(name){
	var ui_on  = $("#on_"+name);
	var ui_off = $("#off_"+name);
	ui_on.css('display','none');
	ui_off.css('display','block');
	QPM.Services[name].status = 'down';
	QPM.Func.check_status();
};

// *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    * 

window.QPM.Func.toggle_service = function(name){
	if( QPM.Services[name].status == 'up' ){
		QPM.Func.service_down(name);
	}else{
		QPM.Func.service_up(name);
	}
};

window.QPM.Func.service_up = function(name){
	QPM.Func.ajax('/api/start?name='+name,function(responseText){
		var result = JSON.parse(responseText);
		if( result.status == 'up' ){
			QPM.Func.status_up(name);
		}else{
			alert("faild to up servcie: "+responseText);
		}
	});
};

window.QPM.Func.service_down = function(name){
	QPM.Func.ajax('/api/stop?name='+name,function(responseText){
		var result = JSON.parse(responseText);
		if( result.status == 'down' ){
			QPM.Func.status_down(name);
		}else{
			alert("faild to down servcie: "+responseText);
		}
	});
};

// *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    * 

window.QPM.Func.toggle_power = function(name){
	if( QPM.status == 'on' ){
		QPM.Func.power_off(name);
	}else{
		QPM.Func.power_on(name);
	}
	QPM.Func.update_status_all();
};

window.QPM.Func.power_on = function(){
	QPM.Func.ajax('/api/startall',function(responseText){
		var result = JSON.parse(responseText);
		if( result.status ){
			QPM.Func.power_status_on(name);
		}else{
			alert("faild to start services: "+responseText);
		}
	});
};

window.QPM.Func.power_off = function(){
	QPM.Func.ajax('/api/stopall',function(responseText){
		var result = JSON.parse(responseText);
		if( result.status ){
			QPM.Func.power_status_off(name);
		}else{
			alert("faild to stop servcies: "+responseText);
		}
	});
};

window.QPM.Func.power_status_on = function(){
	var ui_power = $("#power_switch");
	ui_power.removeClass("Header-power-off");
	ui_power.addClass("Header-power-on");
	QPM.status = 'on';
};

window.QPM.Func.power_status_off = function(name){
	var ui_power = $("#power_switch");
	ui_power.removeClass("Header-power-on");
	ui_power.addClass("Header-power-off");
	QPM.status = 'off';
};

// *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    * 

window.QPM.Func.toggle_stdout = function(name){
	if( QPM.Services[name].display ){
		QPM.Func.stdout_hide(name);
	}else{
		QPM.Func.stdout_show(name);
	}
};

window.QPM.Func.stdout_show = function(name){
	QPM.Func.ajax('/api/stdout?name='+name,function(responseText){
		var result = JSON.parse(responseText);
		var stdout = result.stdout.join("");
		var ui = $("#stdout_"+name);
		ui.css('display','block');
		ui.html(`
			<div class="Wrap-Service-stdout-pre" onclick="QPM.Func.stdout_show('${name}');event.stopPropagation();" title="click to reload stdout">
			<pre class="Service-stdout-pre">${stdout}<pre>
			</div>
		`);
		ui.scrollTop(ui[0].scrollHeight);
		QPM.Services[name].display = true;
	});
};

window.QPM.Func.stdout_hide = function(name){
	var ui = $("#stdout_"+name);
	ui.css('display','none');
	QPM.Services[name].display = false;
};

// *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    * 

window.QPM.Func.toggle_console = function(){
	if( QPM.console_display ){
		QPM.Func.console_hide();
	}else{
		QPM.Func.console_show();
	}
};

window.QPM.Func.console_show = function(){
	QPM.Func.ajax('/api/console',function(responseText){
		var result = JSON.parse(responseText);
		var merged_console = result.Console.join("");
		var ui = $("#merged_console");
		ui.css('display','block');
		ui.html(`
			<div class="Wrap-Service-stdout-pre" onclick="QPM.Func.console_show();event.stopPropagation();" title="click to reload console">
			<pre class="Service-stdout-pre">${merged_console}<pre>
			</div>
		`);
		ui.scrollTop(ui[0].scrollHeight);
		QPM.console_display = true;
	});
};

window.QPM.Func.console_hide = function(){
	var ui = $("#merged_console");
	ui.css('display','none');
	QPM.console_display = false;
};

// *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    *    * 

window.QPM.Template = {};

window.QPM.Template.body = Handlebars.compile(`

	<div class="Header">
		<div class="Header-name">
			{{Config.Setting.name}}
		</div>
		<div class="Wrap-Header-power">
			<div class="Header-power" onclick="QPM.Func.toggle_power();" title="toggle all services">
				<span id="power_switch" class="Header-power-off"><i class="fa fa-power-off" aria-hidden="true"></i></span>
			</div>
		</div>
	</div>
	
	{{#if Config.Setting.merge}}
	<div class="Wrap-Service">
	<div class="Service-first">
		<div class="Service-summary">
			<div class="Service-toggle">
			</div>
			<div class="Service-detail" onclick="QPM.Func.toggle_console();event.stopPropagation();" title="click to toggle console">
				<div class="Service-name">
					Console
				</div>
				<div class="Service-cmd">
					All of stdout and stderr across services.
				</div>
			</div>
		</div>
	</div>
	<div id="merged_console" class="Service-stdout" style="height:300px;"></div>
	</div>
	{{/if}}
	
	<div class="Wrap-Service">
	{{#Config.Services}}
	<div class="{{#if @first}}Service-first{{else}}Service{{/if}}">
		<div class="Service-summary">
			<div class="Service-toggle" onclick="QPM.Func.toggle_service('{{name}}');" title="click to toggle service">
				<span id="on_{{name}}" class="Service-toggle-on"><i class="fa fa-toggle-on" aria-hidden="true"></i></span>
				<span id="off_{{name}}" class="Service-toggle-off"><i class="fa fa-toggle-off" aria-hidden="true"></i></span>
			</div>
			<div class="Service-detail" onclick="QPM.Func.toggle_stdout('{{name}}');event.stopPropagation();" title="click to toggle stdout">
				<div class="Service-name">
					{{name}} 
				</div>
				<div class="Service-cmd">
					{{cmd}} {{#args}}{{this}} {{/args}}
				</div>
			</div>
		</div>
	</div>
	<div id="stdout_{{name}}" class="Service-stdout"></div>
	{{/Config.Services}}
	</div>

`);

