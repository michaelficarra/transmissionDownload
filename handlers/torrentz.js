(function(){

	var getInfoHash = function(){
		var path = location.pathname,
			matches = path.match(/^\/(?:announce_)?([a-f0-9]{40})/i);
		if(!matches || matches.length < 2) return;
		return matches[1];
	};

	chrome.extension.onRequest.addListener(function(request,sender,respond){
		if(request.type != 'info_hash') return respond(null);
		respond(getInfoHash());
	});

})()
