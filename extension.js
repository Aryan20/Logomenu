const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu
const St = imports.gi.St
const Lang = imports.lang
const Meta = imports.gi.Meta
const Shell = imports.gi.Shell
const Util = imports.misc.util

function _aboutThisDistro() {
	Util.spawn(['gnome-control-center', 'info'])
}

function _systemPreferences() {
	Util.spawn(['gnome-control-center'])
}

function _appStore() {
	Util.spawn(['gnome-software'])
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


// function _hover() {
// 	button.actor.remove_actor(icon)

// 	const icon_hover = new St.Icon({
// 		style_class: 'menu-button-hover'
// 	})
	
// 	button.actor.add_actor(icon_hover)
// }


const MenuButton = new Lang.Class({
    Name: "MenuButton",
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent(null, "MenuButton")

        // Icon
        this.icon = new St.Icon({
            style_class: 'menu-button'
        })
        this.actor.add_actor(this.icon)

        // Menu
	this.item1 = new PopupMenu.PopupMenuItem('About Fedora')
	this.item2 = new PopupMenu.PopupMenuItem('System Preferences')
	this.item3 = new PopupMenu.PopupMenuItem('App Store')
	this.item4 = new PopupMenu.PopupMenuItem('Activities')
	this.item5 = new PopupMenu.PopupMenuItem('Extensions')
	
					
	this.item1.connect('activate', Lang.bind(this, _aboutThisDistro))
	this.item2.connect('activate', Lang.bind(this, _systemPreferences))
	this.item3.connect('activate', Lang.bind(this, _appStore))
	this.item4.connect('activate', Lang.bind(this, _missionControl))
	this.item5.connect('activate', Lang.bind(this, _extensions))
        this.menu.addMenuItem(this.item1)
	this.menu.addMenuItem(this.item2)
	this.menu.addMenuItem(this.item3)
	this.menu.addMenuItem(this.item4)
	this.menu.addMenuItem(this.item5)

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
	Main.panel.statusArea['menuButton'].actor.visible = false

	// change icon
	//Main.panel.statusArea['menuButton'].icon.icon_name = "appointment-soon-symbolic"

	// show
	Main.panel.statusArea['menuButton'].actor.visible = true
}
 
function disable() {
	const activitiesButton = Main.panel.statusArea['activities']
	if (activitiesButton) {
		activitiesButton.container.show()
	}

	Main.panel.statusArea['menuButton'].destroy()
}
