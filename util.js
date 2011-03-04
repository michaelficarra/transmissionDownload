var $ = function(){
	return document.getElementById.apply(document,arguments);
};

var getOption = function(opt){
	var def, obj;
	if((obj=localStorage['opt'+opt])!=null) return JSON.parse(obj);
	return (def=localStorage['default'+opt])!=null ? JSON.parse(def) : null;
},
setOption = function(opt, value){
	return localStorage['opt'+opt] = value==null ? null : JSON.stringify(value);
};

var hasClass = function(klass){
	return new RegExp('(^|\\s)'+klass+'(\\s|$)').test(this.className);
},
addClass = function(klass){
	if(hasClass.call(this,klass)) return;
	this.className = this.className.split(' ').concat(klass).join(' ');
},
removeClass = function(klass){
	if(!hasClass.call(this,klass)) return;
	this.className = this.className.replace(new RegExp('(^|\\s+)'+klass+'($|\\s+)','g'),' ');
};

var buildUrl = function(protocol, host, port, path){
	return protocol + '://' + host + ':' + port + path.replace(/\/(\.?\/)+/g, '/');
};
