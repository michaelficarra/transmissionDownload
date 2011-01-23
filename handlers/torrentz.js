(function(){

	var getInfoHash = function(){
		var path = location.pathname,
			matches = /^\/(?:announce_)?([a-f0-9]{40})/i(path);
		if(!matches || matches.length < 2) return;
		return matches[1];
	};

	chrome.extension.onRequest.addListener(function(request,sender,respond){
		if(request.type != 'info_hash') return;
		respond(getInfoHash());
	});

})()
