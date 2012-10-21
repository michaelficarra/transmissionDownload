(function(global){

	var supportedUrls =
		[ /^https?:\/\/([^\/]*\.)?torrentz\.(com|eu|me)\/(announce_)?[a-f0-9]{40}/i
		//, /^http:\/\/([^\/]*\.)?bitsnoop.com\/.*\-q[0-9]+\.html$/
		//, /^http:\/\/([^\/]*\.)?kickasstorrents.com\/.*\-t[0-9]+\.html$/
		];
	var isSupportedUrl = function(url){
		for(var i=0,l=supportedUrls.length; i<l; ++i) {
			if(supportedUrls[i].test(url)) return true;
		}
		return false;
	};

	var refreshIcon = function(tab){
		chrome.pageAction[isSupportedUrl(tab.url) ? 'show' : 'hide'](tab.id);
		chrome.tabs.sendRequest(tab.id, {type:'hasMagnet'}, function(response){
			if(response) chrome.pageAction.show(tab.id);
		});
	};
	// show icon as page action on tab change
	chrome.tabs.onSelectionChanged.addListener(function(tabId) {
		chrome.tabs.get(tabId,refreshIcon);
	});
	// show icon as page action on page load
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		if(changeInfo.status == 'complete') refreshIcon(tab);
	});

	/*
	chrome.extension.onRequest.addListener(function(request, sender, respond){
		if(request.type != ...) return respond(null);
	});
	*/

})(this)
