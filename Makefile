default: clean dist

dist: transmissionDownload.crx

transmissionDownload.crx: transmissionDownload.pem
	crxmake --pack-extension=. --pack-extension-key=transmissionDownload.pem --ignore-file='\.(pem|crx)$$|^\.' --ignore-dir=images

.PHONY: clean

clean:
	rm -f transmissionDownload.crx
