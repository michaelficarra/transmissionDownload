(function(global){

	var refreshIcon = function(tab){
		chrome.pageAction.hide(tab.id);
		chrome.tabs.sendRequest(tab.id, {type:'hasMagnet'}, function(response){
			if(response) chrome.pageAction.show(tab.id);
		});
	};
	// show icon as page action on tab change
	chrome.tabs.onSelectionChanged.addListener(function(tabId) {
		chrome.tabs.get(tabId, refreshIcon);
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
