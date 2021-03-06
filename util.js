var $ = function(){ return this.document.querySelector.apply(this.document, arguments); }
var $$ = function(){ return this.document.querySelectorAll.apply(this.document, arguments); }

var getOption = function(){
	var defaults =
		{ ServerProtocol          : 'http'
		, ServerHost              : 'localhost'
        , ServerPort              : 9091
        , ServerPath              : '/transmission/rpc'
        , AuthenticationEnabled   : false
        , AuthenticationEncrypted : false
        , AuthenticationUsername  : ''
        , AuthenticationPassword  : ''
        , StartAutomatically      : true
        , AddTrackers             : true
        , AdditionalTrackers      : []
		};
	return function(opt){
		var def, obj;
		if((obj=localStorage['opt' + opt]) != null) return JSON.parse(obj);
		return defaults[opt];
	};
}(),
setOption = function(opt, value){
	return localStorage['opt' + opt] = value == null ? null : JSON.stringify(value);
};

var hasClass = function(klass){
	return new RegExp('(^|\\s)' + klass + '(\\s|$)').test(this.className);
},
addClass = function(klass){
	if(hasClass.call(this, klass)) return;
	this.className = this.className.split(' ').concat(klass).join(' ');
},
removeClass = function(klass){
	if(!hasClass.call(this, klass)) return;
	this.className = this.className.replace(new RegExp('(^|\\s+)' + klass + '($|\\s+)', 'g'), ' ');
};

var buildUrl = function(protocol, host, port, path){
	return protocol + '://' + host + ':' + port + path.replace(/\/(\.?\/)+/g, '/');
};

var callCallback = function(callback){
	if(typeof callback == 'function')
		return callback.apply(null, Array.prototype.slice.call(arguments, 1));
}

var log = function(type){
	var consoleFn = console[type] || console.log;
	return function(msg){
		consoleFn.apply(console, Array.prototype.slice.call(arguments));
		var li = document.createElement('li');
		li.innerText = msg;
		li.className = type;
		$('#log').appendChild(li);
	};
},
info = log('info'),
error = log('error');
