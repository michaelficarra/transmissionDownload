(function(){
	var currentTab = -1;
	var log = function(){
		var args = Array.prototype.slice.call(arguments);
		console.log.apply(console,['transmissionDownload','--'].concat(args));
	}

	var supportedUrls = [
		/^https?:\/\/([^\/]*\.)?torrentz\.(com|eu|me)\/(announce_)?[a-f0-9]{40}/i
	]
	var isSupportedUrl = function(url){
		var i, l;
		for(i=0,l=supportedUrls.length; i<l; ++i) {
			if(supportedUrls[i](url)) return true;
		}
		return false;
	};

	var refreshIcon = function(tab){
		chrome.pageAction[isSupportedUrl(tab.url) ? 'show' : 'hide'](tab.id);
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
		chrome.tabs.sendRequest(tabId, {reqtype: "clickhide-deactivate"})
		if(changeInfo.status == "complete") refreshIcon(tab);
	});
	// show icon as page action
	chrome.tabs.getSelected(null, function(tab) {
		if(!tab) return;
		currentTab = tab.id;
		refreshIcon(tab);
	});


	var getTrackers = function(info_hash, callback){
		info_hash = info_hash.toLowerCase();
		var trackers = [], running = 0,
			finish = function(){
				if(--running < 1) callback(trackers);
			};

		var xhrTorrentz = new XMLHttpRequest(),
			torrentzDomains = [
				'https://torrentz.eu',
				'https://torrentz.me',
				'http://torrentz.eu',
				'http://torrentz.me',
				'https://torrentz.com',
				'http://torrentz.com'
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
				var i=0, l=list.length;
				for(; i<l; ++i)
					if(0 > trackers.indexOf(list[i]))
						trackers.push(list[i]);
				finish();
			};
			xhrTorrentz.open("GET", url + '/announce_' + info_hash, true);
			xhrTorrentz.send();
		}

		var xhrBitsnoop = new XMLHttpRequest();
		var url = "http://bitsnoop.com/api/trackers.php?json=1&hash=" + info_hash;
		xhrBitsnoop.onreadystatechange = function(){
			if(xhrBitsnoop.readyState != 4) return;
			if(xhrBitsnoop.status != 200) return finish();
			var text = xhrBitsnoop.responseText;
			if(!text || text == "NOTFOUND" || text == "ERROR") return finish();
			var json = JSON.parse(text);
			if(!json || typeof json.length != "number" || json.length < 1) return finish();
			var i=0, l=json.length;
			for(; i<l; ++i)
				if(0 > trackers.indexOf(json[i]["ANNOUNCE"]))
					trackers.push(json[i]["ANNOUNCE"]);
			return finish();
		};
		xhrBitsnoop.open("GET", url, true);

		++running;
		xhrBitsnoop.send();

		++running;
		tryTorrentz();
	};

	chrome.pageAction.onClicked.addListener(function(){
		log('clicked');
		if(currentTab < 0) return;
		chrome.tabs.sendRequest(currentTab, {reqtype:'info_hash'}, function(info_hash){
			log('determined info_hash',info_hash);
			getTrackers(info_hash,function(trackers){
				log('retrieved trackers',trackers);
			});
		});
	});
})()
