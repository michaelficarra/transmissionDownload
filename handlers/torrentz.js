(function(){
	var getInfoHash = function(){
		var path = location.pathname,
			matches = /^\/(?:announce_)?([a-f0-9]{40})/i(path);
		return matches[1];
	};
	console.log('content_script loaded');
	chrome.extension.onRequest.addListener(function(req,sender,respond){
		if(req.reqtype != 'info_hash') return;
		console.log('responding to a request',arguments);
		respond(getInfoHash());
	});
})()
