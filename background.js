(function(global, undefined){

	localStorage.defaultServerProtocol          = JSON.stringify('http');
	localStorage.defaultServerHost              = JSON.stringify('localhost');
	localStorage.defaultServerPort              = JSON.stringify(9091);
	localStorage.defaultServerPath              = JSON.stringify('/transmission/rpc');
	localStorage.defaultAuthenticationEnabled   = JSON.stringify(false);
	localStorage.defaultAuthenticationEncrypted = JSON.stringify(false);
	localStorage.defaultAuthenticationUsername  = JSON.stringify('');
	localStorage.defaultAuthenticationPassword  = JSON.stringify('');
	localStorage.defaultStartAutomatically      = JSON.stringify(true);
	localStorage.defaultAddTrackers             = JSON.stringify(true);
	localStorage.defaultAdditionalTrackers      = JSON.stringify([]);

	var currentTab = -1;

	var log = function(){
		var args = Array.prototype.slice.call(arguments);
		console.log.apply(console,['transmissionDownload','--'].concat(args));
	}
	var getOption = function(opt){
		var def, obj;
		if((obj=localStorage['opt'+opt])!=null) return JSON.parse(obj);
		return (def=localStorage['default'+opt])!=null ? JSON.parse(def) : null;
	};

	var transmissionSessionId = null,
		server,
		authentication;

	var supportedUrls =
		[ /^https?:\/\/([^\/]*\.)?torrentz\.(com|eu|me)\/(announce_)?[a-f0-9]{40}/i
		//, /^http:\/\/([^\/]*\.)?bitsnoop.com\/.*\-q[0-9]+\.html$/
		//, /^http:\/\/([^\/]*\.)?kickasstorrents.com\/.*\-t[0-9]+\.html$/
		]
	var isSupportedUrl = function(url){
		for(var i=0,l=supportedUrls.length; i<l; ++i) {
			if(supportedUrls[i](url)) return true;
		}
		return false;
	};

	var refreshIcon = function(tab){
		chrome.pageAction[isSupportedUrl(tab.url) ? 'show' : 'hide'](tab.id);
		chrome.tabs.sendRequest(tab.id, {type:'hasMagnet'}, function(response){
			if(response) chrome.pageAction.show(tab.id);
		});
	}
	// show icon as page action on tab change
	chrome.tabs.onSelectionChanged.addListener(function(tabId) {
		//if(currentTab > -1)
		//	chrome.tabs.get(currentTab, function(tab){
		//		if(tab) chrome.pageAction.hide(tab.id);
		//	});
		currentTab = tabId;
		chrome.tabs.get(tabId,refreshIcon);
	});
	// show icon as page action on page load
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		currentTab = tabId;
		if(changeInfo.status == 'complete') refreshIcon(tab);
	});
	// show icon as page action
	//chrome.tabs.getSelected(null, function(tab) {
	//	if(!tab) return;
	//	currentTab = tab.id;
	//	refreshIcon(tab);
	//});


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
				if(list.length < 1) tryTorrentz();
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

	var buildUrl = function(protocol, host, port, path){
		return protocol + '://' + host + ':' + port + ('/'+path).replace(/\/(\.?\/)+/g, '/');
	};

	var startSession = function(callback){
		log('initiating transmission session');
		var xhr = new XMLHttpRequest;
		xhr.onreadystatechange = function(){
			if(xhr.readyState!=4 || xhr.status!=409) return;
			var sessionId = xhr.getResponseHeader('X-Transmission-Session-Id');
			log('retrieved session id', sessionId, callback);
			if(typeof callback=='function') callback(sessionId);
		};
		xhr.open('GET', buildUrl(server.protocol, server.host, server.port, server.path), true);
		if(authentication.enabled)
			xhr.setRequestHeader('Authorization', 'Basic '+Base64.encode(authentication.username+':'+authentication.password));
		xhr.send();
	};

	var addTorrent = function(info_hash, callback){
		log('adding torrent for',info_hash);
		if(!info_hash) throw new Error('Cannot add torrent with null info_hash');
		var sources =
			[ 'http://torrage.com/torrent/#{info_hash}.torrent'
			, 'http://torcache.com/torrent/#{info_hash}.torrent'
			, 'http://zoink.it/torrent/#{info_hash}.torrent'
			, 'http://torrage.ws/torrent/#{info_hash}.torrent'
			];
		var tryAgain;
		(tryAgain = function(){
			var source = sources.shift();
			if(!source) return log('no more hosts');
			log('attempting host',source);
			var xhr = new XMLHttpRequest;
			xhr.onreadystatechange = function(){
				if(xhr.readyState!=4) return;
				// handle 409s (for CSRF token timeout) by asking for a new token
				if(xhr.status==409)
					return startSession(function(newSessionId){
						return addTorrent(info_hash, newSessionId, callback);
					});
				if(xhr.status!=200) return tryAgain();
				var response = JSON.parse(xhr.responseText);
				if(response.result != 'success') return tryAgain();
				log('retrieved successful response', response.arguments['torrent-added'].id, response);
				if(typeof callback=='function') callback(response.arguments['torrent-added']);
			};
			var postData =
				{ method: 'torrent-add'
				, arguments:
					{ filename: source.replace('#{info_hash}', info_hash.toUpperCase())
					, paused: !getOption('StartAutomatically')
					}
				};
			log('postData',postData, JSON.stringify(postData));
			xhr.open('POST', buildUrl(server.protocol, server.host, server.port, server.path), true);
			xhr.setRequestHeader('X-Transmission-Session-Id', transmissionSessionId);
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xhr.send(JSON.stringify(postData));
		})();
	};

	var addTrackers = function(torrent){
		if(!torrent || !torrent.id || !torrent.hashString)
			throw new Error('Attempted to add trackers to an invalid torrent');
		log('addTorrent callback called');
		getTrackers(torrent.hashString, function(trackers){
			var additionalTrackers = getOption('AdditionalTrackers');
			trackers = trackers.concat(additionalTrackers);
			log('retrieved trackers',trackers);
			var xhr = new XMLHttpRequest;
			xhr.onreadystatechange = function(){};
			var postData =
				{ method: 'torrent-set'
				, arguments:
					{ ids: torrent.id
					, trackerAdd: trackers
					}
				};
			log('postData',postData, JSON.stringify(postData));
			xhr.open('POST', buildUrl(server.protocol, server.host, server.port, server.path), true);
			xhr.setRequestHeader('X-Transmission-Session-Id', transmissionSessionId);
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xhr.send(JSON.stringify(postData));
		});
	};

	chrome.pageAction.onClicked.addListener(function(){
		log('clicked');
		if(currentTab < 0) return;
		chrome.tabs.sendRequest(currentTab, {type:'info_hash'}, function(info_hash){
			log('determined info_hash',info_hash);
			if(!info_hash) return;
			server =
				{ protocol: getOption('ServerProtocol')
				, host: getOption('ServerHost')
				, port: getOption('ServerPort')
				, path: getOption('ServerPath')
				};
			authentication =
				{ enabled: getOption('AuthenticationEnabled')
				, encrypted: getOption('AuthenticationEncrypted')
				, username: getOption('AuthenticationUsername')
				, password: getOption('AuthenticationPassword')
				};
			if(authentication.encrypted) throw new Error('Encrypted usernames/passwords not yet supported');
			var initializationCallback = function(sessionId){
				if(!sessionId) throw new Error('Could not establish a secure session with the transmission server');
				transmissionSessionId = sessionId;
				addTorrent(info_hash, addTrackers);
			};
			if(transmissionSessionId)
				initializationCallback(transmissionSessionId);
			else
				startSession(initializationCallback);
		});
	});
})(this)
