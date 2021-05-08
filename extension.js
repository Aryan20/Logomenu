const Me = imports.misc.extensionUtils.getCurrentExtension();

const {GObject, Shell, St} = imports.gi;
const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu
const Util = imports.misc.util

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

function _aboutThisDistro() {
	Util.spawn(['gnome-control-center', 'info-overview'])
}

function _terminal() {
	Util.spawn(['gnome-terminal'])
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


var MenuButton = GObject.registerClass(class FedoraMenu_MenuButton 
	extends PanelMenu.Button {
    _init() {
		super._init(0.0, "MenuButton");

        // Icon
        this.icon = new St.Icon({
            style_class: 'menu-button'
        })
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
		this.item4.connect('activate', () => _appStore())
		this.item5.connect('activate', () => _missionControl())
		this.item6.connect('activate', () => _forceQuit())
		this.item8.connect('activate', () => _terminal())
		this.item9.connect('activate', () => _extensions())
		this.menu.addMenuItem(this.item1)
		this.menu.addMenuItem(this.item2)
		this.menu.addMenuItem(this.item3)
		this.menu.addMenuItem(this.item4)
		this.menu.addMenuItem(this.item5)
		this.menu.addMenuItem(this.item6)
		this.menu.addMenuItem(this.item7)
		this.menu.addMenuItem(this.item8)
		this.menu.addMenuItem(this.item9)
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
