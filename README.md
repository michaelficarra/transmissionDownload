*Warning*: this plugin is not ready to be used yet; just don't use it

## TODO (before release)

* stop using global variable to pass along server and authentication info
* use proper node function signatures (first argument is `err`)
* handle errors by adding retry button (must be using node style callback signatures first)
* verify bug fix: add torrent successfully, change host, attempt to add torrent again; infinite loop (partially due to cached session id)
* make popup ask for symmetric key when using encrypted credentials
* clean up and standardize logged messages
* only add additional trackers if the option is enabled
* inspect [license of icon file](http://www.veryicon.com/icons/system/arcade-daze-apps-vol-1/transmission-2.html)
* set up automatic updates
* do rigorous hand testing
* bump version
* package the plugin
* write up installation/usage for README


## TODO (after release)

* don't make user type in password repeatedly (send request to background page to store password in closure for X seconds)
* don't require save button on options page
* find a way to test this thing
* go to transmission web interface (on torrent add) if tab is already open (see [goToInbox function](http://src.chromium.org/viewvc/chrome/trunk/src/chrome/common/extensions/docs/examples/extensions/gmail/background.html?content-type=text/plain))
* standardize element id naming convention (underscore or camel case)
* add support for multiple servers (don't forget to no longer cache the session ID as a single value!)
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
