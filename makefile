install:
	gnome-extensions pack --extra-source=Resources/ --extra-source=constants.js  --force
	gnome-extensions install logomenu@aryan_k.shell-extension.zip --force
	rm logomenu@aryan_k.shell-extension.zip
