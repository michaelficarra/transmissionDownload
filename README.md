## TODO (before release)

* go to transmission web interface (on torrent add) if tab is already open (see [goToInbox function](http://src.chromium.org/viewvc/chrome/trunk/src/chrome/common/extensions/docs/examples/extensions/gmail/background.html?content-type=text/plain))
* inspect [license of icon file](http://www.veryicon.com/icons/system/arcade-daze-apps-vol-1/transmission-2.html)
* add "popup" prompt for symmetric key when using encrypted credentials
* do rigorous hand testing
* remove logging


## TODO (after release)

* find a way to test this thing
* add support for multiple servers (don't forget to no longer cache the session ID as a single value!)
* make popup come up on click, select server, enter encryption key (only show input if passwords are encrypted), press go button, wait for response, close popup or present error and retry button
* write handlers for some more torrent websites without magnet links or with better alternatives
* modularize and DRY up everything
	* function for trying an XHR with an array of inputs until we make a function pass
	* function for sending an arguments object and a method to a transmission server
	* find a shared scope so background.js, options.js, and content scripts can share functions
	* completely separate localStorage (or its accessors) from all function bodies (except options.js save/load)
* remove shared-scope `server`, `authentication`, and `transmissionSessionId`; pass them around instead (somehow)
* think about allowing generic handler to find any 40-character hex string anywhere
* insert icons next to torrentz search results for extra accessibility (optional, defaulting to disabled)
