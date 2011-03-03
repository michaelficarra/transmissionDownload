*Warning*: this plugin is not ready to be used yet; just don't use it

## TODO (before release)

* verify bug fix: add torrent successfully, change host, attempt to add torrent again; infinite loop (partially due to cached session id)
* add "popup" prompt for symmetric key when using encrypted credentials
* add message area to popup for outputting status messages (torrent added, trackers added, etc.)
* inspect [license of icon file](http://www.veryicon.com/icons/system/arcade-daze-apps-vol-1/transmission-2.html)
* set up automatic updates
* do rigorous hand testing
* remove logging
* bump version
* package the plugin
* write up installation/usage for README


## TODO (after release)

* don't require save button on options page
* find a way to test this thing
* go to transmission web interface (on torrent add) if tab is already open (see [goToInbox function](http://src.chromium.org/viewvc/chrome/trunk/src/chrome/common/extensions/docs/examples/extensions/gmail/background.html?content-type=text/plain))
* add support for multiple servers (don't forget to no longer cache the session ID as a single value!)
* make popup come up on click, select server, enter encryption key (only show input if passwords are encrypted), press go button, wait for response, close popup or present error and retry button
* write handlers for some more torrent websites without magnet links or with better alternatives
* modularize and DRY up everything
	* function for trying an XHR with an array of inputs until we make a function pass
	* function for sending an arguments object and a method to a transmission server
	* find a shared scope so background.js, options.js, and content scripts can share functions
	* completely separate localStorage (or its accessors) from all function bodies (except options.js save/load)
* remove shared-scope `server`, `authentication`, and `transmissionSessionId`; pass them around instead (somehow)
* rewrite in CoffeeScript
* think about allowing generic handler to find any 40-character hex string anywhere
* insert icons next to torrentz search results for extra accessibility (optional, defaulting to disabled)
