(function(){

	// only load generic handler if no specific handler exists
	if(chrome.extension.onRequest.hasListeners()) return;

	var getInfoHash = function(){
		var magnet = document.querySelector('a[href^="magnet:?xt=urn:btih:"]');
		if(!magnet) return;
		var match = magnet.href.match(/^magnet:\?xt=urn:btih:([a-f0-9]{40})/i);
		if(!match) return;
		return match[1];
	};

	chrome.extension.onRequest.addListener(function(request,sender,respond){
		switch(request.type){
			case 'info_hash':
				respond(getInfoHash());
				break;
			case 'hasMagnet':
				respond(getInfoHash() != null);
				break;
			default:
				respond(null);
		}
	});

})()
