(function($, global, undefined){

	$('addTorrent').addEventListener('click', function(){
		console.log('popup.js addTorrent click');
		$('log').innerHTML = '';
		var request = {type: 'addTorrent'};
		request.symmetricKey = null;
		chrome.extension.sendRequest(request, function(response) {
			console.log('popup.js addTorrent response received', response);
			if(!response) return;
			if(response.type == 'error' || response.type == 'info') {
				var li = document.createElement('li');
				li.innerText = response.text;
				li.className = response.type;
				$('log').appendChild(li);
			}
			if(response.type == 'close')
				setTimeout(function(){ window.close(); }, 500);
		});
	});

})(function(){ return document.getElementById.apply(document,arguments) }, this)
