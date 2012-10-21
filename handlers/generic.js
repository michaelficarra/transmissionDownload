(function(){

	// only load generic handler if no specific handler exists
	if(chrome.extension.onRequest.hasListeners()) return;

	var getInfoHash = function(){
		var magnet, match;
		// try to find a magnet link
		magnet = document.querySelector('a[href^="magnet:?xt=urn:btih:"]');
		if(magnet) {
			match = magnet.href.match(/^magnet:\?xt=urn:btih:([a-f0-9]{40})/i);
			if(match) return match[1];
		}
		// try to find an info_hash somewhere in the text of the page
		match = document.documentElement.innerText.match(/\b[a-f0-9]{40}\b/i);
		if(match) return match[0];
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
