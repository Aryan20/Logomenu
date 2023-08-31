import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';

import {AboutPage, LogoMenuIconsPage, LogoMenuOptionsPage} from './PrefsLib/adw.js';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class LogoMenuPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.search_enabled = true;

        const settings =  this.getSettings();

        const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
        if (!iconTheme.get_search_path().includes(`${this.path}/Resources`))
            iconTheme.add_search_path(`${this.path}/Resources`);

        const iconSettingsPage = new LogoMenuIconsPage(settings);
        window.add(iconSettingsPage);
        const optionsPage = new LogoMenuOptionsPage(settings);
        window.add(optionsPage);
        const aboutPage = new AboutPage(this.metadata);
        window.add(aboutPage);
    }
}

