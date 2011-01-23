(function($, global, undefined){
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

	var elemEnableAuthentication = $('authentication_enabled');
	elemEnableAuthentication.addEventListener('click',function(){
		var state = this.checked,
			elemAuthenticationContainer = $('authentication_container');
		(state ? removeClass : addClass).call(elemAuthenticationContainer,'disabled');
		$('username').disabled = !state;
		$('password').disabled = !state;
		$('encryption_key').disabled = $('encryption_enabled').disabled;
	});

	var elemSaveButton = $('save');
	elemSaveButton.addEventListener('click',function(){
		console.log('save');
	});

	var elemCancelButton = $('cancel');
	elemCancelButton.addEventListener('click',function(){
		if(!global.confirm('Cancel and discard changes?')) return;
		console.log('cancel');
	});

	var elemResetButton = $('reset');
	elemResetButton.addEventListener('click',function(){
		if(!global.confirm('Are you sure you would like to reset everything to defaults?')) return;
		console.log('reset');
	});
})(function(){ return document.getElementById.apply(document,arguments) }, this)
