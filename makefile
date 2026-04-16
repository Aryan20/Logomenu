# Define the zip name to avoid repeating it
ZIP_NAME = logomenu@aryan_k.shell-extension.zip
SOURCES = --extra-source=Resources/ --extra-source=PrefsLib/ --extra-source=constants.js --extra-source=display_module.js --extra-source=selection.js

.PHONY: build install clean

# The build target creates the zip
build:
	gnome-extensions pack $(SOURCES) --force

# The install target depends on build
install: build
	gnome-extensions install $(ZIP_NAME) --force
	rm $(ZIP_NAME)

# Useful for manual cleanup
clean:
	rm -f logomenu@aryan_k.shell-extension.zip
