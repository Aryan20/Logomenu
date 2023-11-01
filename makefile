install:
	gnome-extensions pack --extra-source=Resources/ --extra-source=PrefsLib/ --extra-source=constants.js --extra-source=display_module.js --extra-source=selection.js --force
	gnome-extensions install logomenu@aryan_k.shell-extension.zip --force
	rm logomenu@aryan_k.shell-extension.zip

build:
	gnome-extensions pack --extra-source=Resources/ --extra-source=PrefsLib/ --extra-source=constants.js --extra-source=display_module.js --extra-source=selection.js --force
