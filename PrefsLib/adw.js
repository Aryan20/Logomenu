import Adw from 'gi://Adw';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import * as Config from 'resource:///org/gnome/Shell/Extensions/js/misc/config.js';
import {gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import * as Constants from '../constants.js';

Gio._promisify(Gtk.FileDialog.prototype, "open", "open_finish");
const IconGrid = GObject.registerClass(class LogoMenuIconGrid extends Gtk.FlowBox {
    _init() {
        super._init({
            row_spacing: 10,
            column_spacing: 10,
            vexpand: false,
            hexpand: true,
            valign: Gtk.Align.START,
            halign: Gtk.Align.CENTER,
            homogeneous: true,
            selection_mode: Gtk.SelectionMode.SINGLE,
            margin_top: 5,
        });
        this.childrenCount = 0;
    }

    add(widget) {
        this.insert(widget, -1);
        this.childrenCount++;
    }
});

export const LogoMenuIconsPage = GObject.registerClass(class LogoMenuIconsWidget extends Adw.PreferencesPage {
    _init(settings) {
        super._init();
        this._settings = settings;
        this.set_title('Icon');
        this.set_name('Icon');
        this.set_icon_name('emblem-photos-symbolic');

        const symbolicIconGroup = new Adw.PreferencesGroup({
            title: _('Symbolic Icons'),
        });

        const colouredIconGroup = new Adw.PreferencesGroup({
            title: _('Coloured Icons'),
        });

        const iconSettingsGroup = new Adw.PreferencesGroup({
            title: _('Icon Settings'),
        });

        // Symbolic Icons

        const symbolicIconsRow = new Adw.ActionRow();

        const symbolicIconsFlowBox = new IconGrid();
        symbolicIconsFlowBox.connect('child-activated', () => {
            const selectedChild = symbolicIconsFlowBox.get_selected_children();
            const selectedChildIndex = selectedChild[0].get_index();
            this._settings.set_boolean('symbolic-icon', true);
            this._settings.set_int('menu-button-icon-image', selectedChildIndex);
            this._settings.set_boolean('use-custom-icon', false);
        });
        Constants.SymbolicDistroIcons.forEach(icon => {
            let iconName = icon.PATH.replace('/Resources/', '');
            iconName = iconName.replace('.svg', '');
            const iconImage = new Gtk.Image({
                icon_name: iconName,
                pixel_size: 36,
            });
            symbolicIconsFlowBox.add(iconImage);
        });

        symbolicIconsRow.set_child(symbolicIconsFlowBox);

        if (this._settings.get_boolean('symbolic-icon')) {
            const symbolicChildren = symbolicIconsFlowBox.childrenCount;
            for (let i = 0; i < symbolicChildren; i++) {
                if (i === this._settings.get_int('menu-button-icon-image')) {
                    symbolicIconsFlowBox.select_child(symbolicIconsFlowBox.get_child_at_index(i));
                    break;
                }
            }
        }

        // Coloured Icons

        const colouredIconsRow = new Adw.ActionRow();

        const colouredIconsFlowBox = new IconGrid();
        colouredIconsFlowBox.connect('child-activated', () => {
            const selectedChild = colouredIconsFlowBox.get_selected_children();
            const selectedChildIndex = selectedChild[0].get_index();
            this._settings.set_int('menu-button-icon-image', selectedChildIndex);
            this._settings.set_boolean('symbolic-icon', false);
            this._settings.set_boolean('use-custom-icon', false);
        });
        Constants.ColouredDistroIcons.forEach(icon => {
            let iconName = icon.PATH.replace('/Resources/', '');
            iconName = iconName.replace('.svg', '');
            const iconImage = new Gtk.Image({
                icon_name: iconName,
                pixel_size: 36,
            });
            colouredIconsFlowBox.add(iconImage);
        });

        colouredIconsRow.set_child(colouredIconsFlowBox);

        if (!this._settings.get_boolean('symbolic-icon')) {
            const children = colouredIconsFlowBox.childrenCount;
            for (let i = 0; i < children; i++) {
                if (i === this._settings.get_int('menu-button-icon-image')) {
                    colouredIconsFlowBox.select_child(colouredIconsFlowBox.get_child_at_index(i));
                    break;
                }
            }
        }

        // Icon Size Scale

        const menuButtonIconSizeRow = new Adw.ActionRow({
            title: _('Icon Size'),
        });

        const iconSize = this._settings.get_int('menu-button-icon-size');

        const menuButtonIconSizeScale = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            adjustment: new Gtk.Adjustment({
                lower: 14,
                upper: 64,
                step_increment: 1,
                page_increment: 1,
                page_size: 0,
            }),
            digits: 0,
            round_digits: 0,
            hexpand: true,
            draw_value: true,
            value_pos: Gtk.PositionType.RIGHT,
        });

        menuButtonIconSizeScale.set_format_value_func((scale, value) => {
            return `\t${value}px`;
        });

        menuButtonIconSizeScale.set_value(iconSize);
        menuButtonIconSizeScale.connect('value-changed', () => {
            this._settings.set_int('menu-button-icon-size', menuButtonIconSizeScale.get_value());
        });

        menuButtonIconSizeRow.add_suffix(menuButtonIconSizeScale);

        const customIconRow = new Adw.ExpanderRow({
            title: _('Use Custom Icon'),
            show_enable_switch: true,
            enable_expansion: this._settings.get_boolean('use-custom-icon'),
        });

        customIconRow.connect('notify::enable-expansion', () => {
            this._settings.set_boolean('use-custom-icon', customIconRow.enable_expansion);
        });

        this._settings.connect('changed::use-custom-icon', () => {
            customIconRow.set_enable_expansion(this._settings.get_boolean('use-custom-icon'))
        });

        const customIconSelectionRow = new Adw.ActionRow({
            title: _('Selected Icon'),
        });

        const customIconButton = new Gtk.Button({
            icon_name: 'document-open-symbolic',
            valign: Gtk.Align.CENTER,
        })

        const customIconPreview = new Gtk.Image({
            icon_name: "start-here-symbolic",
            icon_size: 2
        });

        if(this._settings.get_string('custom-icon-path'))
            customIconPreview.set_from_file(this._settings.get_string('custom-icon-path'));

        customIconButton.connect('clicked', async () => {
            try {
                const filter = new Gtk.FileFilter({
                    name: "Images",
                });

                filter.add_pixbuf_formats();

                const fileDialog = new Gtk.FileDialog({
                    title: _('Select a Custom Icon'),
                    modal: true,
                    default_filter: filter
                });

                const file = await fileDialog.open(customIconButton.get_root(), null);
                if (file) {
                    const filename = file.get_path();
                    this._settings.set_string("custom-icon-path", filename);
                    customIconPreview.set_from_file(filename);
                    console.log(`Selected custom icon: ${filename}`);
                }
            } catch (error) {
                console.error('Error selecting custom icon:', error.message);
            }
        });

        customIconSelectionRow.add_suffix(customIconPreview);
        customIconSelectionRow.add_suffix(customIconButton);
        customIconRow.add_row(customIconSelectionRow);

        // iconGroup
        symbolicIconGroup.add(symbolicIconsRow);
        colouredIconGroup.add(colouredIconsRow);
        iconSettingsGroup.add(customIconRow);
        iconSettingsGroup.add(menuButtonIconSizeRow);

        this.add(symbolicIconGroup);
        this.add(colouredIconGroup);
        this.add(iconSettingsGroup);
    }
});

// Create all the customization options
export const LogoMenuOptionsPage = GObject.registerClass(class LogoMenuOptionsWidget extends Adw.PreferencesPage {
    _init(settings) {
        super._init();
        this._settings = settings;
        this.set_title('Other Options');
        this.set_name('Other Options');
        this.set_icon_name('emblem-system-symbolic');

        const prefGroup1 = new Adw.PreferencesGroup({
            title: _('Change Defaults'),
        });

        const prefGroup2 = new Adw.PreferencesGroup({
            title: _('Show/Hide Options'),
        });

        const prefGroup3 = new Adw.PreferencesGroup({
            title: _('Top Panel Options'),
        });
        // Rows

        // Activities click type

        const clickType = this._settings.get_int('menu-button-icon-click-type');
        const menuButtonIconClickTypeRow = new Adw.ActionRow({
            title: _('Icon Click Type to open Activities'),
        });

        const menuButtonIconClickTypeCombo = new Gtk.ComboBoxText({
            valign: Gtk.Align.CENTER,
        });
        menuButtonIconClickTypeCombo.append('1', _('Left Click '));
        menuButtonIconClickTypeCombo.append('2', _('Middle Click '));
        menuButtonIconClickTypeCombo.append('3', _('Right Click '));
        menuButtonIconClickTypeCombo.set_active_id(clickType.toString());

        menuButtonIconClickTypeCombo.connect('changed', () => {
            this._settings.set_int('menu-button-icon-click-type', parseInt(menuButtonIconClickTypeCombo.get_active_id()));
        });

        menuButtonIconClickTypeRow.add_suffix(menuButtonIconClickTypeCombo);

        // Extensions application choice

        const extensionApp = this._settings.get_string('menu-button-extensions-app');
        const extensionsAppRow = new Adw.ActionRow({
            title: _('Preferred Extensions Application'),
        });

        const extensionsAppCombo = new Gtk.ComboBoxText({
            valign: Gtk.Align.CENTER,
        });
        extensionsAppCombo.append('org.gnome.Extensions.desktop', _('GNOME Extensions'));
        extensionsAppCombo.append('com.mattjakeman.ExtensionManager.desktop', _('Extensions Manager'));
        extensionsAppCombo.set_active_id(extensionApp.toString());

        extensionsAppCombo.connect('changed', () => {
            this._settings.set_string('menu-button-extensions-app', extensionsAppCombo.get_active_id());
        });

        extensionsAppRow.add_suffix(extensionsAppCombo);

        // Choose Terminal

        const menuButtonTerminalRow = new Adw.ActionRow({
            title: _('Terminal'),
        });

        // Change Terminal and build it's option in prefs
        const currentTerminal = this._settings.get_string('menu-button-terminal');

        const changeTerminalInput = new Gtk.Entry({
            valign: Gtk.Align.CENTER,
        });

        changeTerminalInput.set_text(currentTerminal);
        changeTerminalInput.connect('changed', () => {
            this._settings.set_string('menu-button-terminal', changeTerminalInput.get_text());
        });

        menuButtonTerminalRow.add_suffix(changeTerminalInput);

        // Change Software Center and build it's option in prefs

        const softwareCentreRow = new Adw.ActionRow({
            title: _('Software Center'),
        });
        const currentSoftwareCenter = this._settings.get_string('menu-button-software-center');

        const changeSoftwareCenterInput = new Gtk.Entry({
            valign: Gtk.Align.CENTER,
        });

        changeSoftwareCenterInput.set_text(currentSoftwareCenter);
        changeSoftwareCenterInput.connect('changed', () => {
            this._settings.set_string('menu-button-software-center', changeSoftwareCenterInput.get_text());
        });

        softwareCentreRow.add_suffix(changeSoftwareCenterInput);

        // Change System Monitor and build it's option in prefs

        const systemMonitorRow = new Adw.ActionRow({
            title: _('System Monitor'),
        });
        const currentSystemMonitor = this._settings.get_string('menu-button-system-monitor');

        const changeSystemMonitorInput = new Gtk.Entry({
            valign: Gtk.Align.CENTER,
        });

        changeSystemMonitorInput.set_text(currentSystemMonitor);
        changeSystemMonitorInput.connect('changed', () => {
            this._settings.set_string('menu-button-system-monitor', changeSystemMonitorInput.get_text());
        });

        systemMonitorRow.add_suffix(changeSystemMonitorInput);


        // Power Options
        const showPowerOptionsRow = new Adw.ActionRow({
            title: _('Enable Power Options'),
        });
        const showPowerOptionsSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });

        showPowerOptionsSwitch.set_active(this._settings.get_boolean('show-power-options'));
        showPowerOptionsSwitch.connect('notify::active', widget => {
            this._settings.set_boolean('show-power-options', widget.get_active());
        });

        showPowerOptionsRow.add_suffix(showPowerOptionsSwitch);

        // Toggle Force Quit option and build it's option in prefs
        const forceQuitOptionrow = new Adw.ActionRow({
            title: _('Hide Force Quit option'),
        });

        const forceQuitOptionsSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });

        forceQuitOptionsSwitch.set_active(this._settings.get_boolean('hide-forcequit'));
        forceQuitOptionsSwitch.connect('notify::active', widget => {
            this._settings.set_boolean('hide-forcequit', widget.get_active());
        });

        forceQuitOptionrow.add_suffix(forceQuitOptionsSwitch);


        // Toggle Lock Screen option and build it's option in prefs
        const lockScreenOptionRow = new Adw.ActionRow({
            title: _('Show Lock Screen option'),
        });

        const showLockScreenSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });

        showLockScreenSwitch.set_active(this._settings.get_boolean('show-lockscreen'));
        showLockScreenSwitch.connect('notify::active', widget => {
            this._settings.set_boolean('show-lockscreen', widget.get_active());
        });

        lockScreenOptionRow.add_suffix(showLockScreenSwitch);

        // Toggle Software centre option and build it's option in prefs
        const softwareCentreOptionRow = new Adw.ActionRow({
            title: _('Hide Software Centre option'),
        });

        const hideSoftwareCentreSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });

        hideSoftwareCentreSwitch.set_active(this._settings.get_boolean('hide-softwarecentre'));
        hideSoftwareCentreSwitch.connect('notify::active', widget => {
            this._settings.set_boolean('hide-softwarecentre', widget.get_active());
        });

        softwareCentreOptionRow.add_suffix(hideSoftwareCentreSwitch);

        // Activities Button visibility
        const activitiesButtonVisiblityRow = new Adw.ActionRow({
            title: _('Show Activities Button'),
        });

        const activitiesButtonVisiblitySwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
            active: this._settings.get_boolean('show-activities-button'),
        });

        activitiesButtonVisiblitySwitch.connect('notify::active', widget => {
            this._settings.set_boolean('show-activities-button', widget.get_active());
        });

        activitiesButtonVisiblityRow.add_suffix(activitiesButtonVisiblitySwitch);
        
         // Icon Shadow Visibility
        const iconShadowVisibilityRow = new Adw.ActionRow({
            title: _('Hide Icon Shadow'),
        });

        const iconShadowRowVisiblitySwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
            active: this._settings.get_boolean('hide-icon-shadow'),
        });

        iconShadowRowVisiblitySwitch.connect('notify::active', widget => {
            this._settings.set_boolean('hide-icon-shadow', widget.get_active());
        });

        iconShadowVisibilityRow.add_suffix(iconShadowRowVisiblitySwitch);

        // Pref Group
        prefGroup1.add(menuButtonIconClickTypeRow);
        prefGroup1.add(extensionsAppRow);
        prefGroup1.add(menuButtonTerminalRow);
        prefGroup1.add(softwareCentreRow);
        prefGroup1.add(systemMonitorRow);

        prefGroup2.add(showPowerOptionsRow);
        prefGroup2.add(forceQuitOptionrow);
        prefGroup2.add(lockScreenOptionRow);
        prefGroup2.add(softwareCentreOptionRow);

        prefGroup3.add(activitiesButtonVisiblityRow);
        prefGroup3.add(iconShadowVisibilityRow);

        this.add(prefGroup1);
        this.add(prefGroup2);
        this.add(prefGroup3);
    }
});

// Parts taken from Arc Menu
// Create the About page
export const AboutPage = GObject.registerClass(class LogoMenuAboutPage extends Adw.PreferencesPage {
    _init(metadata) {
        if (parseInt(Config.PACKAGE_VERSION) >= 46) {
            super._init({
                title: _('About'),
                icon_name: 'help-about-symbolic',
            });
        } else {
            super._init({
                title: _('About'),
                icon_name: 'info-symbolic',
            });
        }

        const PROJECT_IMAGE = 'settings-logo-menu-logo';
        const EXTERNAL_LINK_ICON = 'adw-external-link-symbolic'

        const logoMenuLogoGroup = new Adw.PreferencesGroup();
        const logoMenuBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            margin_top: 10,
            margin_bottom: 10,
            hexpand: false,
            vexpand: false,
        });

        const projectImage = new Gtk.Image({
            margin_bottom: 15,
            icon_name: PROJECT_IMAGE,
            pixel_size: 100,
        });

        const logoMenuLabel = new Gtk.Label({
            label: `<span size="large"><b>${_('Logo Menu')}</b></span>`,
            use_markup: true,
            vexpand: true,
            valign: Gtk.Align.FILL,
        });

        const projectDescriptionLabel = new Gtk.Label({
            label: _('Quick access menu for GNOME'),
            hexpand: false,
            vexpand: false,
            margin_bottom: 5,
        });

        logoMenuBox.append(projectImage);
        logoMenuBox.append(logoMenuLabel);
        logoMenuBox.append(projectDescriptionLabel);
        logoMenuLogoGroup.add(logoMenuBox);

        this.add(logoMenuLogoGroup);
        // -----------------------------------------------------------------------

        // Extension/OS Info Group------------------------------------------------
        const extensionInfoGroup = new Adw.PreferencesGroup();
        const logoMenuVersionRow = new Adw.ActionRow({
            title: _('Logo Menu Version'),
        });
        let releaseVersion;
        if (metadata['version-name'])
            releaseVersion = metadata['version-name'];
        else
            releaseVersion = 'unknown';
        logoMenuVersionRow.add_suffix(new Gtk.Label({
            label: `${releaseVersion}`,
        }));

        const gnomeVersionRow = new Adw.ActionRow({
            title: _('GNOME Version'),
        });
        gnomeVersionRow.add_suffix(new Gtk.Label({
            label: `${Config.PACKAGE_VERSION.toString()}`,
        }));

        const createdByRow = new Adw.ActionRow({
            title: _('Created with love by'),
        });
        createdByRow.add_suffix(new Gtk.Label({
            label: 'Aryan Kaushik',
        }));

        const matrixRoomRow = new Adw.ActionRow({
            title: _('Matrix/Element room'),
        });
        matrixRoomRow.add_suffix(new Gtk.LinkButton({
            icon_name: EXTERNAL_LINK_ICON,
            uri: 'https://matrix.to/#/#logo-menu:matrix.org',
        }));

        const githubLinkRow = new Adw.ActionRow({
            title: 'GitHub',
        });
        githubLinkRow.add_suffix(new Gtk.LinkButton({
            icon_name: EXTERNAL_LINK_ICON,
            uri: 'https://github.com/Aryan20/LogoMenu',
        }));

        const contributorRow = new Adw.ActionRow({
            title: _('Contributors'),
        });
        contributorRow.add_suffix(new Gtk.LinkButton({
            icon_name: EXTERNAL_LINK_ICON,
            uri: 'https://github.com/Aryan20/Logomenu/graphs/contributors'
        }));

        extensionInfoGroup.add(logoMenuVersionRow);
        extensionInfoGroup.add(gnomeVersionRow);
        extensionInfoGroup.add(createdByRow);
        extensionInfoGroup.add(githubLinkRow);
        extensionInfoGroup.add(matrixRoomRow);
        extensionInfoGroup.add(contributorRow);

        this.add(extensionInfoGroup);
        // -----------------------------------------------------------------------

        const warrantyLabel = _('This program comes with absolutely no warranty.');
        const urlLabel = _('See the %sGNU General Public License, version 2 or later%s for details.').format('<a href="https://gnu.org/licenses/old-licenses/gpl-2.0.html">', '</a>');

        const gnuSoftwareGroup = new Adw.PreferencesGroup();
        const gnuSofwareLabel = new Gtk.Label({
            label: `<span size="small">${warrantyLabel}\n${urlLabel}</span>`,
            use_markup: true,
            justify: Gtk.Justification.CENTER,
        });

        const gnuSofwareLabelBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            valign: Gtk.Align.END,
            vexpand: true,
            margin_top: 5,
            margin_bottom: 10,
        });
        gnuSofwareLabelBox.append(gnuSofwareLabel);
        gnuSoftwareGroup.add(gnuSofwareLabelBox);
        this.add(gnuSoftwareGroup);
    }
});
