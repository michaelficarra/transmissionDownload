(function(global, undefined){

	var transmissionSessionId = null,
		server,
		authentication;

	var log = function(type, msg){
			var li = document.createElement('li');
			li.innerText = msg;
			li.className = type;
			$('log').appendChild(li);
		},
		info = function(msg){ return log('info', msg); },
		error = function(msg){ return log('error', msg); };


	var getTrackers = function(info_hash, callback){
		info_hash = info_hash.toLowerCase();
		var trackers = [], running = 0,
			finish = function(){
				if(--running < 1 && typeof callback == 'function')
					callback(trackers);
			};

		var xhrTorrentz = new XMLHttpRequest,
			torrentzDomains =
				[ 'https://torrentz.eu'
				, 'https://torrentz.me'
				, 'http://torrentz.eu'
				, 'http://torrentz.me'
				, 'https://torrentz.com'
				, 'http://torrentz.com'
				]
		var tryTorrentz = function(){
			var url = torrentzDomains.shift();
			if(!url) return finish();
			xhrTorrentz.onreadystatechange = function(){
				if(xhrTorrentz.readyState!=4) return;
				if(xhrTorrentz.status != 200) tryTorrentz();
				var text = xhrTorrentz.responseText;
				if(!text) tryTorrentz();
				var list = text.match(/(.{0,3}ps?:\/\/.+\/announce)/gi);
				if(!list || list.length < 1) tryTorrentz();
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
				if(0 > trackers.indexOf(json[i]['ANNOUNCE']))
					trackers.push(json[i]['ANNOUNCE']);
			return finish();
		};
		xhrBitsnoop.open('GET', url, true);

		++running;
		xhrBitsnoop.send();

		++running;
		tryTorrentz();
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
				return error('Could not establish a secure session with the transmission server');
			transmissionSessionId = sessionId;
			info('retrieved session id: ' + sessionId);
			if(typeof callback=='function') callback(sessionId);
		};
		xhr.open('GET', buildUrl(server.protocol, server.host, server.port, server.path), true);
		var basicAuth = 'Basic '+Base64.encode(authentication.username+':'+authentication.password);
		if(authentication.enabled) xhr.setRequestHeader('Authorization', basicAuth);
		xhr.send();
	};

	var addTorrent = function(info_hash, callback){
		if(!info_hash) return error('addTorrent called without info_hash');
		var sources =
			[ 'http://torrage.com/torrent/#{info_hash}.torrent'
			, 'http://torcache.com/torrent/#{info_hash}.torrent'
			, 'http://zoink.it/torrent/#{info_hash}.torrent'
			, 'http://torrage.ws/torrent/#{info_hash}.torrent'
			];
		var tryAgain;
		(tryAgain = function(){
			var source = sources.shift();
			if(!source) return error('no more hosts');
			info('attempting host: ' + source);
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
				if(response.result != 'success') return error(response.result);
				if(typeof callback=='function') callback(response.arguments['torrent-added']);
			};
			var postData =
				{ method: 'torrent-add'
				, arguments:
					{ filename: source.replace('#{info_hash}', info_hash.toUpperCase())
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
			return error('attempted to add trackers to an invalid torrent');
		getTrackers(torrent.hashString, function(trackers){
			var additionalTrackers = getOption('AdditionalTrackers');
			trackers = trackers.concat(additionalTrackers);
			info('retrieved tracker list');
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
		});
	};


	$('close').addEventListener('click', function(){
		window.close();
	});

	$('symmetric_key').addEventListener('keyup', (function(){
		var lastKey = '';
		return function(){
			if(this.value == lastKey) return;
			lastKey = this.value;
		};
	})());

	var start = function(){
		addClass.call($('symmetricKeyContainer'), 'hidden');
		addClass.call($('addTorrent'), 'hidden');
		$('log').innerHTML = '';
		removeClass.call($('log'), 'hidden');

		var username = getOption('AuthenticationUsername'),
			password = getOption('AuthenticationPassword');

		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.sendRequest(tab.id, {type:'info_hash'}, function(info_hash){
				if(!info_hash) return error('Could not determine info_hash');
				info('Determined info_hash (' + info_hash + ')');
				server =
					{ protocol: getOption('ServerProtocol')
					, host:     getOption('ServerHost')
					, port:     getOption('ServerPort')
					, path:     getOption('ServerPath')
					};
				authentication =
					{ enabled:   getOption('AuthenticationEnabled')
					, encrypted: getOption('AuthenticationEncrypted')
					, username:  getOption('AuthenticationUsername')
					, password:  getOption('AuthenticationPassword')
					};
				var success = true;
				addTorrent(info_hash, function(torrent){
					info('torrent added: ' + torrent.name);
					addTrackers(torrent, function(trackers){
						info('added ' + trackers.length + ' additional trackers');
						log('done','done');
						removeClass.call($(success ? 'close' : 'retry'), 'hidden');
					});
				});
			});
		});
	};
	$('addTorrent').addEventListener('click', start);
	$('retry').addEventListener('click', start);

	var needsDecryption = getOption('AuthenticationEnabled') && getOption('AuthenticationEncrypted');
	(needsDecryption ? removeClass : addClass).call($('symmetricKeyContainer'), 'hidden');
	$('addTorrent').disabled = needsDecryption;

	var protocol = getOption('ServerProtocol'),
		host = getOption('ServerHost'),
		port = getOption('ServerPort'),
		path = getOption('ServerPath');
	$('rpc').innerText = protocol + '://' + host + ':' + port + path;

	/*
		chrome.extension.sendRequest(request, function(response){
			if(!response) return;
		});
	*/

})(this)
