## Usage

On any supported page (which currently includes the Torrentz individual torrent
pages and any page containing a magnet link), a [chrome page
action](http://code.google.com/chrome/extensions/pageAction.html) will be made
available to aid in the torrent starting process.

This extension requires the Transmission HTTP RPC. This can be enabled [through
the preferences
GUI](http://www.transmissionbt.com/help/gtk/2.2x/html/preferences.html#web)
when using transmission-gtk or by setting the `rpc-enabled` and related `rpc-*`
values in transmission-daemon's `settings.json` file when using transmission-daemon.


## Features

* Adds torrents to a transmission server (remote or local)
* (optionally) Adds all trackers from tracker aggregation websites
* Saves and optionally encrypts login information
* Adds additional, specified trackers to each torrent


## Installation

0. Download [the transmissionDownload.crx file](https://github.com/michaelficarra/transmissionDownload/raw/master/transmissionDownload.crx)
0. Open it with chrome
0. Accept security warnings


## TODO

* use proper node function signatures (first argument should be `err`)
	* handle errors by adding retry button (must be using node style callback signatures first)
* change `addTorrent` signature to accept URLs, not `info_hash`es
	* move looping/retrying behaviour from `addTorrent` to event handler
	* add support for adding torrents by torrent download URL (for private torrents)
* don't make user type in password repeatedly (send request to background page to store password in closure for X seconds)
* don't require save button on options page
* find a way to test this thing
* keyboard shortcut
* standardize element id naming convention (underscore or camel case)
* remove shared-scope `server`, `authentication`, and `transmissionSessionId`; pass them around instead (somehow)
* find a way to make it continue even if popup is closed
* add images to documentation
* publicize
* go to transmission web interface (on torrent add) if tab is already open (see [goToInbox function](http://src.chromium.org/viewvc/chrome/trunk/src/chrome/common/extensions/docs/examples/extensions/gmail/background.html?content-type=text/plain))
* modularize and DRY up everything
	* function for trying an XHR with an array of inputs until we make a function pass
	* function for sending an arguments object and a method to a transmission server
* add support for multiple servers (don't forget to no longer cache the session ID as a single value!)
* rewrite in CoffeeScript
* think about allowing generic handler to find any 40-character hex string anywhere
* insert icons next to search results for extra accessibility (optional, defaulting to disabled)
* (permanent) write handlers for some more torrent websites without magnet links or with better alternatives


## Building / Releasing

0. Open `chrome://extensions` in chrome
0. Enable developer mode
0. Delete `transmissionDownload.crx` from repo directory
0. Bump version number in `updateInfo.xml`
0. Bump version number in `manifest.json`
0. Press "Load unpacked extension..." button
0. Choose repo directory
0. Press "Pack extension..." button
0. Choose repo directory
0. If making an official release, choose signature file as well
0. Move generated `transmissionDownload.crx` file to repo directory
0. Commit, tag, and push
