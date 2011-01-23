(function(){
	var currentTab = -1;
	var log = function(){
		var args = Array.prototype.slice.call(arguments);
		console.log.apply(console,['transmissionDownload','--'].concat(args));
	}

	var supportedUrls = [
		/^https?:\/\/([^\/]*\.)?torrentz\.(com|eu)\/(announce_)?[a-f0-9]{40}/i
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

	var clicked = function(){
		log('clicked');
		if(currentTab < 0) return;
		chrome.tabs.sendRequest(currentTab, {}, function(info_hash){
			log('retrieved info_hash',info_hash);
		});
	};
	chrome.pageAction.onClicked.addListener(clicked);
})()
