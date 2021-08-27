// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
const Me = imports.misc.extensionUtils.getCurrentExtension();

const {Gio, GLib, GObject, Shell, St} = imports.gi;
const Constants = Me.imports.constants;
const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu
const Util = imports.misc.util

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

function _aboutThisDistro() {
	Util.spawn(['gnome-control-center', 'info-overview'])
}

function _systemPreferences() {
	Util.spawn(['gnome-control-center'])
}

function _missionControl() {
	Main.overview.toggle();
}

function _forceQuit() {
	Util.spawn(['xkill'])
}

function _sleep() {
	Util.spawn(['systemctl', 'suspend'])
}

function _restart() {
	Util.spawn(['systemctl', 'reboot'])
}

function _shutdown() {
	Util.spawn(['systemctl', 'poweroff', '-prompt'])
}

function _lockScreen() {
	Util.spawn(['gnome-screensaver-command -l'])
}

function _logOut() {
	Util.spawn(['gnome-session-quit'])
}

function _extensions() {
	Util.spawn(['gnome-extensions-app'])
}

function _middleClick(actor, event) {
	// left click === 1, middle click === 2, right click === 3
	if (event.get_button() === 2) {
		this.menu.close();
		Main.overview.toggle();
	}
}

// function _hover() {
// 	button.actor.remove_actor(icon)

// 	const icon_hover = new St.Icon({
// 		style_class: 'menu-button-hover'
// 	})
	
// 	button.actor.add_actor(icon_hover)
// }


var MenuButton = GObject.registerClass(class FedoraMenu_MenuButton extends PanelMenu.Button {
	_init() {
		super._init(0.0, "MenuButton");
		this._settings = ExtensionUtils.getSettings(Me.metadata['settings-schema']);

		// Icon
		this.icon = new St.Icon({
			style_class: 'menu-button'
		})
		this._settings.connect("changed::menu-button-icon-image", () => this.setIconImage())
		this._settings.connect("changed::menu-button-icon-size", () => this.setIconSize())
		this.setIconImage()
		this.setIconSize()
		this.add_actor(this.icon)

		// Menu
		this.item1 = new PopupMenu.PopupMenuItem(_('About My System'))
		this.item2 = new PopupMenu.PopupMenuItem(_('System Settings'))
		this.item3 = new PopupMenu.PopupSeparatorMenuItem()
		this.item4 = new PopupMenu.PopupMenuItem(_('Software Center'))
		this.item5 = new PopupMenu.PopupMenuItem(_('Activities'))
		this.item6 = new PopupMenu.PopupMenuItem(_('Force Quit App'))
		this.item7 = new PopupMenu.PopupSeparatorMenuItem()
		this.item8 = new PopupMenu.PopupMenuItem(_('Terminal'))
		this.item9 = new PopupMenu.PopupMenuItem(_('Extensions'))

		this.item1.connect('activate', () => _aboutThisDistro())
		this.item2.connect('activate', () => _systemPreferences())
		this.item4.connect('activate', () => this.softwareStore())
		this.item5.connect('activate', () => _missionControl())
		this.item6.connect('activate', () => _forceQuit())
		this.item8.connect('activate', () => this.terminal())
		this.item9.connect('activate', () => this.extensions())
		this.menu.addMenuItem(this.item1)
		this.menu.addMenuItem(this.item2)
		this.menu.addMenuItem(this.item3)
		this.menu.addMenuItem(this.item4)
		this.menu.addMenuItem(this.item5)
		this.menu.addMenuItem(this.item6)
		this.menu.addMenuItem(this.item7)
		this.menu.addMenuItem(this.item8)
		this.menu.addMenuItem(this.item9)

		//bind middle click option to toggle overview
		this.connect('button-press-event', _middleClick.bind(this));
	}

	terminal() {
		Util.spawn([this._settings.get_string('menu-button-terminal')])
	}

	softwareStore() {
		Util.spawn([this._settings.get_string('menu-button-software-center')])
	}

	extensions() {
		let extension_app = this._settings.get_enum('extension-app');
		if (extension_app == 0) {
			Util.spawn(['gnome-extensions-app']);
		} else if (extension_app == 1) {
			Util.spawn(['flatpak run org.gnome.Extensions']);
		}
	}

	setIconImage(){
		let iconIndex = this._settings.get_int('menu-button-icon-image');
		let path = Me.path + Constants.DistroIcons[iconIndex].PATH;
		if(Constants.DistroIcons[iconIndex].PATH === 'start-here-symbolic')
			path = 'start-here-symbolic';
		else if(!GLib.file_test(path, GLib.FileTest.IS_REGULAR))
			path = 'start-here-symbolic';  
		this.icon.gicon = Gio.icon_new_for_string(path);
	}

	setIconSize(){
		let iconSize = this._settings.get_int('menu-button-icon-size');
		this.icon.icon_size = iconSize;
	}
})

function init() {
}
 
function enable() {
	const activitiesButton = Main.panel.statusArea['activities']
	if (activitiesButton) {
		activitiesButton.container.hide()
	}

	let indicator = new MenuButton()
	Main.panel.addToStatusArea('menuButton', indicator, 0, 'left')

	// hide
	Main.panel.statusArea['menuButton'].visible = false

	// change icon
	//Main.panel.statusArea['menuButton'].icon.icon_name = "appointment-soon-symbolic"

	// show
	Main.panel.statusArea['menuButton'].visible = true
}
 
function disable() {
	const activitiesButton = Main.panel.statusArea['activities']
	if (activitiesButton) {
		activitiesButton.container.show()
	}

	Main.panel.statusArea['menuButton'].destroy()
}
