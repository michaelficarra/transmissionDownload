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

	var updateFullRpcUrl = function(){
		$('protocol_output').innerText = $('protocol').value;
		$('host_output')    .innerText = $('host').value;
		$('port_output')    .innerText = +$('port').value;
		$('path_output')    .innerText = ('/'+$('path').value).replace(/\/(\.?\/)+/g,'/');
	};
	$('protocol').addEventListener('change', updateFullRpcUrl);
	$('host')    .addEventListener('keyup' , updateFullRpcUrl);
	$('port')    .addEventListener('keyup' , updateFullRpcUrl);
	$('path')    .addEventListener('keyup' , updateFullRpcUrl);

	var fixAuthentication = function(){
		var elemAuthenticationEnabled = $('authentication_enabled'),
			state = elemAuthenticationEnabled.checked,
			elemAuthenticationContainer = $('authentication_container'),
			elemAuthenticationPassword = $('password'),
			elemEncryptionEnabled = $('encryption_enabled');
		(state ? removeClass : addClass).call(elemAuthenticationContainer,'disabled');
		$('username').disabled = !state || elemEncryptionEnabled.checked;
		$('password').disabled = !state || elemEncryptionEnabled.checked;
		$('encryption_key').disabled = !state;
		elemEncryptionEnabled.disabled = !state;
		elemAuthenticationPassword.type = elemEncryptionEnabled.checked ? 'text' : 'password';
	}

	$('authentication_enabled').addEventListener('click',fixAuthentication);
	$('encryption_enabled').addEventListener('click',function(){
		var username, password,
			elemEncryptionKey = $('encryption_key'),
			encryptionKey = elemEncryptionKey.value,
			elemAuthenticationUsername = $('username'),
			elemAuthenticationPassword = $('password');
		if(!this.checked) {
			if(!encryptionKey) {
				elemEncryptionKey.focus();
				this.checked = true;
				return;
			}
			username = elemAuthenticationUsername.value;
			password = elemAuthenticationPassword.value;
			try {
				elemAuthenticationUsername.value = AES.decrypt(encryptionKey, Base64.decode(username));
				elemAuthenticationPassword.value = AES.decrypt(encryptionKey, Base64.decode(password));
				elemEncryptionKey.value = '';
			} catch(e) {
				this.checked = true;
				alert('invalid decryption key')
				elemAuthenticationUsername.value = username;
				elemAuthenticationPassword.value = password;
				elemEncryptionKey.value = encryptionKey;
				elemEncryptionKey.focus();
				return null;
			}
		} else {
			if(!encryptionKey) {
				elemEncryptionKey.focus();
				this.checked = false;
				return;
			}
			username = elemAuthenticationUsername.value;
			elemAuthenticationUsername.value = Base64.encode(AES.encrypt(encryptionKey, username));
			password = elemAuthenticationPassword.value;
			elemAuthenticationPassword.value = Base64.encode(AES.encrypt(encryptionKey, password));
			elemEncryptionKey.value = '';
		}
		fixAuthentication();
	});

	var elemCancelButton = $('cancel');
	elemCancelButton.addEventListener('click',function(){
		if(!global.confirm('Cancel and discard changes?')) return;
		console.log('cancel');
	});

	var elemResetButton = $('reset');
	elemResetButton.addEventListener('click',function(){
		if(!global.confirm('Are you sure you would like to reset everything to defaults?')) return;
		for(var key in localStorage)
			if(key.slice(0,3)=='opt') delete localStorage[key];
		loadOptions();
	});

	var getOption = function(opt){
			var def, obj;
			if((obj=localStorage['opt'+opt])!=null) return JSON.parse(obj);
			return (def=localStorage['default'+opt])!=null ? JSON.parse(def) : null;
		},
		setOption = function(opt, value){
			localStorage['opt'+opt] = value==null ? null : JSON.stringify(value);
		};

	var loadOptions;
	(loadOptions = function(){
		var elemProtocol = $('protocol'),
			elemHost = $('host'),
			elemPort = $('port'),
			elemPath = $('path');
		elemProtocol.value = getOption('ServerProtocol');
		elemHost.value = getOption('ServerHost');
		elemPort.value = getOption('ServerPort');
		elemPath.value = getOption('ServerPath');

		var elemAuthenticationEnabled = $('authentication_enabled'),
			elemAuthenticationUsername = $('username'),
			elemAuthenticationPassword = $('password'),
			elemEncryptionEnabled = $('encryption_enabled');
		elemAuthenticationEnabled.checked = !!getOption('AuthenticationEnabled');
		elemAuthenticationUsername.value = getOption('AuthenticationUsername');
		elemAuthenticationPassword.value = getOption('AuthenticationPassword');
		elemEncryptionEnabled.checked = !!getOption('AuthenticationEncrypted');
		fixAuthentication();

		var elemAddTrackers = $('add_trackers'),
			elemStartAutomatically = $('start_automatically'),
			elemAdditionalTrackers = $('additional_trackers');
		elemAddTrackers.checked = !!getOption('AddTrackers');
		elemStartAutomatically.checked = !!getOption('StartAutomatically');
		elemAdditionalTrackers.innerText = getOption('AdditionalTrackers').join("\n");

		updateFullRpcUrl();
	})();

	var saveOptions = function(){
		setOption('ServerProtocol', $('protocol').value);
		setOption('ServerHost', $('host').value);
		var port = $('port').value;
		setOption('ServerPort', port==+port ? +port : null);
		var path = ('/'+$('path').value).replace(/\/(\.?\/)+/g,'/');
		setOption('ServerPath', path);

		setOption('AuthenticationEnabled', !!$('authentication_enabled').checked);
		setOption('AuthenticationUsername', $('username').value);
		setOption('AuthenticationPassword', $('password').value);
		setOption('AuthenticationEncrypted', !!$('encryption_enabled').checked);

		setOption('AddTrackers', !!$('add_trackers').checked);
		setOption('StartAutomatically', !!$('start_automatically').checked);
		var trackers = $('additional_trackers').value;
		trackers = trackers.split(/\s+/g).filter(function(_){ return !!_; });
		setOption('AdditionalTrackers', trackers);

		loadOptions();
	}
	var elemSaveButton = $('save');
	elemSaveButton.addEventListener('click',function(){
		console.log('save');
		saveOptions();
	});

})(function(){ return document.getElementById.apply(document,arguments) }, this)
