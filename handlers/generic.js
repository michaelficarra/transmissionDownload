(function(){

	if(chrome.extension.onRequest.hasListeners()) return;

	var getInfoHash = function(){
		var magnet = document.querySelector('a[href^="magnet:?xt=urn:btih:"]');
		if(!magnet) return;
		var match = magnet.href.match(/^magnet:\?xt=urn:btih:([a-f0-9]{40})/i);
		if(!match) return;
		return match[1];
	};

	chrome.extension.onRequest.addListener(function(request,sender,respond){
		if(request.type != 'info_hash') return respond(null);
		respond(getInfoHash());
	});

	chrome.extension.onRequest.addListener(function(request,sender,respond){
		if(request.type != 'hasMagnet') return respond(null);
		respond(getInfoHash() != null);
	});

})()
