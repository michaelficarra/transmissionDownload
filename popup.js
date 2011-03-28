(function(global, undefined){

	var transmissionSessionId = null,
		server =
			{ protocol: getOption('ServerProtocol')
			, host:     getOption('ServerHost')
			, port:     getOption('ServerPort')
			, path:     getOption('ServerPath')
			},
		authentication =
			{ enabled:   getOption('AuthenticationEnabled')
			, encrypted: getOption('AuthenticationEncrypted')
			, username:  getOption('AuthenticationUsername')
			, password:  getOption('AuthenticationPassword')
			};

	var log = function(type){
			return function(msg){
				(console[type] || console.log).apply(
					console,
					Array.prototype.slice.call(arguments));
				var li = document.createElement('li');
				li.innerText = msg;
				li.className = type;
				$('log').appendChild(li);
			};
		},
		info = function(msg){ return log('info').apply(this, arguments); },
		error = function(msg){ return log('error').apply(this, arguments); };


	var getTrackers = function(info_hash, callback){
		info_hash = info_hash.toLowerCase();
		var trackers = [], running = 0,
			finish = function(){
				if(--running < 1 && typeof callback == 'function')
					callback(trackers);
			};

		var torrentzDomains =
				[ 'https://torrentz.eu'
				, 'https://torrentz.me'
				, 'http://torrentz.eu'
				, 'http://torrentz.me'
				, 'https://torrentz.com'
				, 'http://torrentz.com'
				]
		var tryTorrentz = function(){
			var xhrTorrentz = new XMLHttpRequest,
				url = torrentzDomains.shift();
			if(!url) return finish();
			xhrTorrentz.onreadystatechange = function(){
				if(xhrTorrentz.readyState!=4) return;
				if(xhrTorrentz.status != 200) return tryTorrentz();
				var text = xhrTorrentz.responseText;
				if(!text.trim()) return tryTorrentz();
				var list = text.match(/((?:https?|udp):\/\/.+\/announce$)/gi);
				if(!list || list.length < 1) return tryTorrentz();
				for(var i=0,l=list.length; i<l; ++i)
					if(0 > trackers.indexOf(list[i]))
						trackers.push(list[i]);
				finish();
			};
			xhrTorrentz.open('GET', url + '/announce_' + info_hash, true);
			xhrTorrentz.send();
		}

		var xhrBitsnoop = new XMLHttpRequest;
		var url = 'http://bitsnoop.com/api/trackers.php?json=1&hash=' + info_hash;
		xhrBitsnoop.onreadystatechange = function(){
			if(xhrBitsnoop.readyState != 4) return;
			if(xhrBitsnoop.status != 200) return finish();
			var text = xhrBitsnoop.responseText;
			if(!text || text == 'NOTFOUND' || text == 'ERROR') return finish();
			var json = JSON.parse(text);
			if(!json || typeof json.length != 'number' || json.length < 1) return finish();
			for(var i=0,l=json.length; i<l; ++i)
				if(0 > trackers.indexOf(json[i].ANNOUNCE))
					trackers.push(json[i].ANNOUNCE);
			return finish();
		};
		xhrBitsnoop.open('GET', url, true);

		++running;
		xhrBitsnoop.send();

		/*
		++running;
		tryTorrentz();
		*/ // disabled torrentz for now, as they just changed their announce list URLs
	};

	var startSession = function(callback){
		info('initiating transmission session');
		if(transmissionSessionId) {
			if(typeof callback=='function')
				callback(transmissionSessionId);
			return;
		}
		var xhr = new XMLHttpRequest;
		xhr.onreadystatechange = function(){
			if(xhr.readyState!=4) return
			var sessionId = xhr.getResponseHeader('X-Transmission-Session-Id');
			if(xhr.status!=409 && xhr.status!=200 || !sessionId)
				return error('could not establish a secure session with the transmission server', xhr, sessionId);
			transmissionSessionId = sessionId;
			info('secured transmission session', sessionId);
			if(typeof callback=='function') callback(sessionId);
		};
		xhr.open('GET', buildUrl(server.protocol, server.host, server.port, server.path), true);
		var basicAuth = 'Basic '+Base64.encode(authentication.username+':'+authentication.password);
		if(authentication.enabled) xhr.setRequestHeader('Authorization', basicAuth);
		xhr.send();
	};

	var addTorrent = function(info_hash, callback){
		if(!info_hash) return error('addTorrent called without info_hash', info_hash);
		if(!transmissionSessionId)
			return startSession(function(newSessionId){
				if(!newSessionId) return;
				addTorrent(info_hash, callback);
			});
		var sources =
			[ { name: 'torrage.com',  url: 'http://torrage.com/torrent/#{info_hash}.torrent'  }
			, { name: 'torcache.com', url: 'http://torcache.com/torrent/#{info_hash}.torrent' }
			, { name: 'zoink.it',     url: 'http://zoink.it/torrent/#{info_hash}.torrent'     }
			, { name: 'torrage.ws',   url: 'http://torrage.ws/torrent/#{info_hash}.torrent'   }
			];
		var tryAgain;
		(tryAgain = function(){
			var source = sources.shift();
			if(!source) return error('all torrent sources failed', sources);
			info('attempting to download torrent from ' + source.name, source);
			var xhr = new XMLHttpRequest;
			xhr.onreadystatechange = function(){
				if(xhr.readyState!=4) return;
				// handle 409s (for CSRF token timeout) by asking for a new token
				if(xhr.status==409)
					return startSession(function(newSessionId){
						if(!newSessionId) return;
						addTorrent(info_hash, callback);
					});
				if(xhr.status!=200) return tryAgain();
				var response = JSON.parse(xhr.responseText);
				if(response.result != 'success') return error(response.result, response);
				if(typeof callback=='function') callback(response.arguments['torrent-added']);
			};
			var postData =
				{ method: 'torrent-add'
				, arguments:
					{ filename: source.url.replace('#{info_hash}', info_hash.toUpperCase())
					, paused: !getOption('StartAutomatically')
					}
				};
			xhr.open('POST', buildUrl(server.protocol, server.host, server.port, server.path), true);
			xhr.setRequestHeader('X-Transmission-Session-Id', transmissionSessionId);
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			var basicAuth = 'Basic '+Base64.encode(authentication.username+':'+authentication.password);
			if(authentication.enabled) xhr.setRequestHeader('Authorization', basicAuth);
			xhr.send(JSON.stringify(postData));
		})();
	};

	var addTrackers = function(torrent, callback){
		if(!torrent || !torrent.id || !torrent.hashString)
			return error('attempted to add trackers to an invalid torrent', torrent);
		var additionalTrackers = getOption('AdditionalTrackers');
		var next = function(trackers){
			if(additionalTrackers.length)
				info('adding supplementary trackers', additionalTrackers);
			trackers = trackers.concat(additionalTrackers);
			if(!trackers.length)
				return typeof callback=='function' ? callback([]) : null;
			var xhr = new XMLHttpRequest;
			xhr.onreadystatechange = function(){
				if(xhr.readyState!=4 || xhr.status!=200) return;
				if(typeof callback=='function') callback(trackers);
			};
			var postData =
				{ method: 'torrent-set'
				, arguments:
					{ ids: torrent.id
					, trackerAdd: trackers
					}
				};
			xhr.open('POST', buildUrl(server.protocol, server.host, server.port, server.path), true);
			xhr.setRequestHeader('X-Transmission-Session-Id', transmissionSessionId);
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			var basicAuth = 'Basic '+Base64.encode(authentication.username+':'+authentication.password);
			if(authentication.enabled) xhr.setRequestHeader('Authorization', basicAuth);
			xhr.send(JSON.stringify(postData));
		}
		if(getOption('AddTrackers')) {
			info('fetching tracker list');
			getTrackers(torrent.hashString, function(trackers){
				info('retrieved tracker list', trackers);
				return next(trackers || []);
			});
		} else {
			next([]);
		}
	};


	$('close').addEventListener('click', function(){
		window.close();
	});

	var decrypt = (function(){
		var lastKey = '';
		return function(){
			if(this.value == lastKey) return;
			lastKey = this.value;

			var username = getOption('AuthenticationUsername'),
				password = getOption('AuthenticationPassword');

			try {
				authentication.username = AES.decrypt(this.value, Base64.decode(username));
				authentication.password = AES.decrypt(this.value, Base64.decode(password));
				info('decrypted username, password', authentication.username, authentication.password.replace(/./g,'*'));
				// TODO: modularize this part for future DRYness
				addClass.call($('symmetricKeyContainer'), 'hidden');
				addClass.call($('close'), 'hidden');
				$('addTorrent').disabled = false;
				removeClass.call($('addTorrent'), 'hidden');
				$('addTorrent').focus();
			} catch(e) {
				authentication.username = username;
				authentication.password = password;
			}
		};
	})();
	var symmetricKeyInput = $('symmetric_key');
	symmetricKeyInput.addEventListener('keyup', decrypt);
	symmetricKeyInput.addEventListener('paste', function(){
		setTimeout(function(){ decrypt.call(this); }.bind(this), 0);
		return true;
	});

	var start = function(){
		addClass.call($('symmetricKeyContainer'), 'hidden');
		addClass.call($('addTorrent'), 'hidden');
		$('log').innerHTML = '';
		removeClass.call($('log'), 'hidden');

		var username = getOption('AuthenticationUsername'),
			password = getOption('AuthenticationPassword');

		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.sendRequest(tab.id, {type:'info_hash'}, function(info_hash){
				if(!info_hash) return error('could not determine info_hash', info_hash);
				info('determined info_hash', info_hash);
				var success = true;
				addTorrent(info_hash, function(torrent){
					info('added torrent ' + JSON.stringify(torrent.name), torrent);
					addTrackers(torrent, function(trackers){
						if(trackers)
							info('added ' + trackers.length + ' additional trackers', trackers);
						log('done')('done');
						if(!success) removeClass.call($('retry'), 'hidden');
						removeClass.call($('close'), 'hidden');
						$(success ? 'close' : 'retry').focus();
					});
				});
			});
		});
	};
	$('addTorrent').addEventListener('click', start);
	$('retry').addEventListener('click', start);

	var needsDecryption = getOption('AuthenticationEnabled') && getOption('AuthenticationEncrypted');
	(needsDecryption ? removeClass : addClass).call($('symmetricKeyContainer'), 'hidden');
	if(needsDecryption) $('symmetric_key').focus();
	(needsDecryption ? addClass : removeClass).call($('addTorrent'), 'hidden');
	$('addTorrent').disabled = needsDecryption;
	(needsDecryption ? removeClass : addClass).call($('close'), 'hidden');

	$('rpc').innerText = buildUrl(
		getOption('ServerProtocol'),
		getOption('ServerHost'),
		getOption('ServerPort'),
		getOption('ServerPath'));

	/*
		chrome.extension.sendRequest(request, function(response){
			if(!response) return;
		});
	*/

})(this)
