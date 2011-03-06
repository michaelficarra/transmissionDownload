## TODO (before release)

* inspect [license of icon file](http://www.veryicon.com/icons/system/arcade-daze-apps-vol-1/transmission-2.html)
* write up installation/usage for README


## TODO (after release)

* use proper node function signatures (first argument is `err`)
* handle errors by adding retry button (must be using node style callback signatures first)
* don't make user type in password repeatedly (send request to background page to store password in closure for X seconds)
* don't require save button on options page
* find a way to test this thing
* standardize element id naming convention (underscore or camel case)
* remove shared-scope `server`, `authentication`, and `transmissionSessionId`; pass them around instead (somehow)
* go to transmission web interface (on torrent add) if tab is already open (see [goToInbox function](http://src.chromium.org/viewvc/chrome/trunk/src/chrome/common/extensions/docs/examples/extensions/gmail/background.html?content-type=text/plain))
* modularize and DRY up everything
	* function for trying an XHR with an array of inputs until we make a function pass
	* function for sending an arguments object and a method to a transmission server
* add support for multiple servers (don't forget to no longer cache the session ID as a single value!)
* rewrite in CoffeeScript
* think about allowing generic handler to find any 40-character hex string anywhere
* insert icons next to torrentz search results for extra accessibility (optional, defaulting to disabled)
* write handlers for some more torrent websites without magnet links or with better alternatives
