const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Constants = Me.imports.constants;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const Config = imports.misc.config;
const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

function init() {
    ExtensionUtils.initTranslations(Me.metadata['gettext-domain']);
}


if (shellVersion >= 42) {
    const {Adw, Gdk, GdkPixbuf, Gio, GLib, GObject, Gtk} = imports.gi;

    var IconGrid = GObject.registerClass(class Logo_Menu_IconGrid extends Gtk.FlowBox{
        _init() {
            super._init({
                row_spacing: 10,
                column_spacing: 10,
                vexpand: false,
                hexpand: true,
                valign: Gtk.Align.START,
                valign: Gtk.Align.CENTER,
                homogeneous: true,
                selection_mode: Gtk.SelectionMode.SINGLE,
                margin_top: 5,
            });
            this.childrenCount = 0;
        }
    
        add(widget){
            this.insert(widget, -1);
            this.childrenCount++;
        }
    });
    
    var LogoMenuIconsWidget = GObject.registerClass(class Logo_Menu_IconsWidget extends Adw.PreferencesPage{
        _init(settings) {
            super._init({
                margin_top: 24,
                margin_start: 24,
                margin_bottom: 24,
                margin_end: 24,
            });
            this._settings = settings;
            this.set_title('Logo Settings');
            this.set_name('Logo Settings');
            this.set_icon_name('emblem-system-symbolic');
            
            
            let iconGroup = new Adw.PreferencesGroup({
                title: _("Icon Settings")
            });
    
            // Icons
        
            let iconsRow = new Adw.ActionRow({
                title:_("Icon")
            });
    
            let iconsFlowBox = new IconGrid();
            iconsFlowBox.connect('child-activated', ()=> {
                let selectedChild = iconsFlowBox.get_selected_children();
                let selectedChildIndex = selectedChild[0].get_index();
                this._settings.set_int('menu-button-icon-image', selectedChildIndex);
            });
            Constants.DistroIcons.forEach((icon)=>{
                let iconName = icon.PATH.replace("/Resources/", '');
                iconName = iconName.replace(".svg", '');
                let iconImage = new Gtk.Image({
                    icon_name: iconName,
                    pixel_size: 36
                });
                iconsFlowBox.add(iconImage);
            });
    
            iconsRow.add_suffix(iconsFlowBox);
    
            let children = iconsFlowBox.childrenCount;
            for(let i = 0; i < children; i++){
                if(i === this._settings.get_int('menu-button-icon-image')){
                    iconsFlowBox.select_child(iconsFlowBox.get_child_at_index(i));
                    break;
                }
            }
            
            // Icon Size Scale
            
            let menuButtonIconSizeRow = new Adw.ActionRow({
                title: _("Icon Size")
            });
            
            let iconSize = this._settings.get_int('menu-button-icon-size');
            
            let menuButtonIconSizeScale = new Gtk.Scale({
                orientation: Gtk.Orientation.HORIZONTAL,
                adjustment: new Gtk.Adjustment({
                    lower: 14,
                    upper: 64,
                    step_increment: 1,
                    page_increment: 1,
                    page_size: 0
                }),
                digits: 0,
                round_digits: 0,
                hexpand: true,
                draw_value: true,
                value_pos: Gtk.PositionType.RIGHT
            });
    
            menuButtonIconSizeScale.set_format_value_func( (scale, value) => {
                return "\t" + value + "px";
            });
                  
            menuButtonIconSizeScale.set_value(iconSize);
            menuButtonIconSizeScale.connect('value-changed', () => {
                this._settings.set_int('menu-button-icon-size', menuButtonIconSizeScale.get_value());
            });
            
            menuButtonIconSizeRow.add_suffix(menuButtonIconSizeScale);
            
            //iconGroup
            iconGroup.add(iconsRow);
            iconGroup.add( menuButtonIconSizeRow)
            
            this.add(iconGroup);
            
        }
    })
    
    var LogoMenuOptionsWidget = GObject.registerClass(class Logo_Menu_OptionsWidget extends Adw.PreferencesPage{
        _init(settings) {
            super._init({
                margin_top: 24,
                margin_start: 24,
                margin_bottom: 24,
                margin_end: 24,
            });
            this._settings = settings;
            this.set_title('Other Options');
            this.set_name('Other Options');
            this.set_icon_name('emblem-system-symbolic');
            
            let prefGroup1 = new Adw.PreferencesGroup({
                title: _("Change Defaults")
            });
            
            let prefGroup2 = new Adw.PreferencesGroup({
                title: _("Show/Hide Options")
            });
            // Rows
            
            // Activities click type 
            
            let clickType = this._settings.get_int('menu-button-icon-click-type');
            let menuButtonIconClickTypeRow = new Adw.ActionRow({
              title:_("Icon Click Type to open Activities")
            });
    
            let menuButtonIconClickTypeCombo= new Gtk.ComboBoxText({
              valign: Gtk.Align.CENTER
            });
            menuButtonIconClickTypeCombo.append("2", _("Middle Click "));
            menuButtonIconClickTypeCombo.append("3", _("Right Click "));
            menuButtonIconClickTypeCombo.set_active_id(clickType.toString());
    
            menuButtonIconClickTypeCombo.connect('changed', () => {
                this._settings.set_int('menu-button-icon-click-type', parseInt(menuButtonIconClickTypeCombo.get_active_id()));
            });
            
            menuButtonIconClickTypeRow.add_suffix(menuButtonIconClickTypeCombo);
            
            // Choose Terminal 
            
            let menuButtonTerminalRow = new Adw.ActionRow({
              title:_("Terminal")
            });
    
            // Change Terminal and build it's option in prefs
            let currentTerminal = this._settings.get_string('menu-button-terminal');
    
            let changeTerminalInput = new Gtk.Entry({
                valign: Gtk.Align.CENTER,
            });
    
            changeTerminalInput.set_text(currentTerminal);
            changeTerminalInput.connect('changed', () => {
                this._settings.set_string('menu-button-terminal', changeTerminalInput.get_text());
            });
            
            menuButtonTerminalRow.add_suffix(changeTerminalInput);
            
            // Change Software Center and build it's option in prefs
            
            let menuButtonSCRow = new Adw.ActionRow({
              title:_("Software Center")
            });
            let currentSoftwareCenter = this._settings.get_string('menu-button-software-center');
    
            let changeSoftwareCenterInput = new Gtk.Entry({
                valign: Gtk.Align.CENTER,
            });
    
            changeSoftwareCenterInput.set_text(currentSoftwareCenter);
            changeSoftwareCenterInput.connect('changed', () => {
                this._settings.set_string('menu-button-software-center', changeSoftwareCenterInput.get_text());
            });
    
            menuButtonSCRow.add_suffix(changeSoftwareCenterInput);
            
            
            // Power Options
            let showPowerOptionsRow = new Adw.ActionRow({
                title: _("Enable Power Options")
            });
            let showPowerOptionsSwitch = new Gtk.Switch({
                valign: Gtk.Align.CENTER
            });
    
            showPowerOptionsSwitch.set_active(this._settings.get_boolean('show-power-options'));
            showPowerOptionsSwitch.connect('notify::active', (widget) => {
                this._settings.set_boolean('show-power-options', widget.get_active());
            });
    
            showPowerOptionsRow.add_suffix(showPowerOptionsSwitch);
            
            // Toggle Force Quit option and build it's option in prefs
            let forceQuitOptionrow = new Adw.ActionRow({
                title: _("Hide Force Quit option")
            });
          
            let showFQOptionsSwitch= new Gtk.Switch({ 
                valign: Gtk.Align.CENTER,
            });
    
            showFQOptionsSwitch.set_active(this._settings.get_boolean('hide-forcequit'));
            showFQOptionsSwitch.connect('notify::active', (widget) => {
                this._settings.set_boolean('hide-forcequit', widget.get_active());
            });
            
            forceQuitOptionrow.add_suffix(showFQOptionsSwitch);
            
            
            // Toggle Lock Screen option and build it's option in prefs
            let lockScreenOptionRow = new Adw.ActionRow({
                title: _("Show Lock Screen option")
            });
    
            let showLCOptionsSwitch= new Gtk.Switch({ 
                valign: Gtk.Align.CENTER,
            });
    
            showLCOptionsSwitch.set_active(this._settings.get_boolean('show-lockscreen'));
            showLCOptionsSwitch.connect('notify::active', (widget) => {
                this._settings.set_boolean('show-lockscreen', widget.get_active());
            });
            
            lockScreenOptionRow.add_suffix(showLCOptionsSwitch);
            
            // Toggle Lock Orientation option and build it's option in prefs
            let lockOrientationOptionRow = new Adw.ActionRow({
                title:_("Show Lock Orientation option")        
            });
    
            let showLOOptionsSwitch= new Gtk.Switch({ 
                valign: Gtk.Align.CENTER,
            });
    
            showLOOptionsSwitch.set_active(this._settings.get_boolean('show-lockorientation'));
            showLOOptionsSwitch.connect('notify::active', (widget) => {
                this._settings.set_boolean('show-lockorientation', widget.get_active());
            });
            
            lockOrientationOptionRow.add_suffix(showLOOptionsSwitch);
            
            // Toggle Software centre option and build it's option in prefs
            let SoftwareCentreOptionRow = new Adw.ActionRow({
                title:_("Hide Software Centre option")        
            });
    
            let hideSCOptionSwitch= new Gtk.Switch({ 
                valign: Gtk.Align.CENTER,
            });
    
            hideSCOptionSwitch.set_active(this._settings.get_boolean('hide-softwarecentre'));
            hideSCOptionSwitch.connect('notify::active', (widget) => {
                this._settings.set_boolean('hide-softwarecentre', widget.get_active());
            });
            
            SoftwareCentreOptionRow.add_suffix(hideSCOptionSwitch);
            
            // Pref Group
            prefGroup1.add(menuButtonIconClickTypeRow);
            prefGroup1.add(menuButtonTerminalRow);
            prefGroup1.add(menuButtonSCRow);
            prefGroup2.add(showPowerOptionsRow);
            prefGroup2.add(forceQuitOptionrow);
            prefGroup2.add(lockScreenOptionRow);
            prefGroup2.add(lockOrientationOptionRow);
            prefGroup2.add(SoftwareCentreOptionRow);
            
            this.add(prefGroup1);
            this.add(prefGroup2);
        }
    })
    
    // Parts taken from Arc Menu - https://gitlab.com/logoMenu/logoMenu/-/blob/wip-GNOME42-AwdPrefs/prefs.js
    var AboutPage = GObject.registerClass(class Logo_Menu_AboutPage extends Adw.PreferencesPage {
            _init(settings) {
                super._init({
                    title: _("About"),
                    icon_name: 'info-symbolic',
                });
                
                this._settings = settings;
    
                let logoMenuLogoGroup = new Adw.PreferencesGroup();
                let logoMenuBox = new Gtk.Box( {
                    orientation: Gtk.Orientation.VERTICAL,
                    margin_top: 10,
                    margin_bottom: 10,
                    hexpand: false,
                    vexpand: false
                });
    
                let logoMenuLabel = new Gtk.Label({
                    label: '<span size="large"><b>' + _('Logo Menu') + '</b></span>',
                    use_markup: true,
                    vexpand: true,
                    valign: Gtk.Align.FILL
                });
    
                let projectDescriptionLabel = new Gtk.Label({
                    label: _('Quick access menu for GNOME'),
                    hexpand: false,
                    vexpand: false,
                    margin_bottom: 5
                });
                logoMenuBox.append(logoMenuLabel);
                logoMenuBox.append(projectDescriptionLabel);
                logoMenuLogoGroup.add(logoMenuBox);
    
                this.add(logoMenuLogoGroup);
                //-----------------------------------------------------------------------
    
                //Extension/OS Info Group------------------------------------------------
                let extensionInfoGroup = new Adw.PreferencesGroup();
                let logoMenuVersionRow = new Adw.ActionRow({
                    title: _("Logo Menu Version"),
                });
                let releaseVersion;
                if(Me.metadata.version)
                    releaseVersion = Me.metadata.version;
                else
                    releaseVersion = 'unknown';
                logoMenuVersionRow.add_suffix(new Gtk.Label({ 
                    label: releaseVersion + ''
                }));
                extensionInfoGroup.add(logoMenuVersionRow);
    
                let gnomeVersionRow = new Adw.ActionRow({
                    title: _('GNOME Version'),
                });
                gnomeVersionRow.add_suffix(new Gtk.Label({ 
                    label: imports.misc.config.PACKAGE_VERSION + '',
                }));
                extensionInfoGroup.add(gnomeVersionRow);
    
                
                let githubLinkRow = new Adw.ActionRow({
                    title: _('Github'),
                });
                githubLinkRow.add_suffix(new Gtk.Label({ 
                    label: 'Github.com/Aryan20/LogoMenu',
                }));
                extensionInfoGroup.add(githubLinkRow);
    
                this.add(extensionInfoGroup);
                //-----------------------------------------------------------------------
    
                let gnuSoftwareGroup = new Adw.PreferencesGroup();
                let gnuSofwareLabel = new Gtk.Label({
                    label: _('<span size="small">' +'This program comes with absolutely no warranty.\n' +
                        'See the <a href="https://gnu.org/licenses/old-licenses/gpl-2.0.html">' +
                          'GNU General Public License, version 2 or later</a> for details.' +
                          '</span>'
                    ),
                    use_markup: true,
                    justify: Gtk.Justification.CENTER
                });
                let gnuSofwareLabelBox = new Gtk.Box({
                    orientation: Gtk.Orientation.VERTICAL,
                    valign: Gtk.Align.END,
                    vexpand: true,
                    margin_top: 5,
                    margin_bottom: 10
                });
                gnuSofwareLabelBox.append(gnuSofwareLabel);
                gnuSoftwareGroup.add(gnuSofwareLabelBox);
                this.add(gnuSoftwareGroup);
            }
    });
    
    
    function fillPreferencesWindow(window) {
        this._settings = ExtensionUtils.getSettings(Me.metadata['settings-schema']);
        let options = new LogoMenuOptionsWidget(this._settings);
        let iconsettings = new LogoMenuIconsWidget(this._settings);
        let aboutpage = new AboutPage(this._settings);
    
        let iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
        if(!iconTheme.get_search_path().includes(Me.path + "/Resources"))
        iconTheme.add_search_path(Me.path + "/Resources");
        
        window.add(iconsettings);
        window.add(options);
        window.add(aboutpage);
        window.search_enabled = true;
    }
}   else {
    const {Gdk, GdkPixbuf, Gio, GLib, GObject, Gtk} = imports.gi;

    function init() {
        ExtensionUtils.initTranslations(Me.metadata['gettext-domain']);
    }

    var IconGrid = GObject.registerClass(class Logo_Menu_IconGrid extends Gtk.FlowBox{
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

        add(widget){
            this.insert(widget, -1);
            this.childrenCount++;
        }
    });

    var LogoMenuPreferencesWidget = GObject.registerClass(class Logo_Menu_PreferencesWidget extends Gtk.Box{
        _init() {
            super._init({
                orientation: Gtk.Orientation.VERTICAL,
                margin_top: 24,
                margin_start: 24,
                margin_bottom: 24,
                margin_end: 24,
                spacing: 24,
            });
            this._settings = ExtensionUtils.getSettings(Me.metadata['settings-schema']);

            let changeIconText = new Gtk.Label({
                label: _("Icon"),
                use_markup: true,
                xalign: 0,
            })
            
            let iconsFrame = new Gtk.Frame({
                valign: Gtk.Align.START,
            });
            let iconsBox = new Gtk.Box({
                margin_top: 5,
                margin_bottom: 5,
                margin_start: 5,
                margin_end: 5
            });

            if (shellVersion < 40){
                iconsFrame.add(iconsBox);
            }
            else{
                iconsFrame.set_child(iconsBox);
            }

            let iconsFlowBox = new IconGrid();
            iconsFlowBox.connect('child-activated', ()=> {
                let selectedChild = iconsFlowBox.get_selected_children();
                let selectedChildIndex = selectedChild[0].get_index();
                this._settings.set_int('menu-button-icon-image', selectedChildIndex);
            });
            Constants.DistroIcons.forEach((icon)=>{
                let iconName = icon.PATH.replace("/Resources/", '');
                iconName = iconName.replace(".svg", '');
                let iconImage = new Gtk.Image({
                    icon_name: iconName,
                    pixel_size: 36
                });
                iconsFlowBox.add(iconImage);
            });

            if (shellVersion < 40){
                iconsBox.add(changeIconText)
                iconsBox.add(iconsFlowBox);
                this.add(iconsFrame)
            }
            else {
                iconsBox.append(changeIconText)
                iconsBox.append(iconsFlowBox);
                this.append(iconsFrame)
            }

            let children = iconsFlowBox.childrenCount;
            for(let i = 0; i < children; i++){
                if(i === this._settings.get_int('menu-button-icon-image')){
                    iconsFlowBox.select_child(iconsFlowBox.get_child_at_index(i));
                    break;
                }
            }

            let menuButtonIconSizeFrame = new Gtk.Frame();
            let menuButtonIconSizeBox = new Gtk.Box({
                margin_top: 5,
                margin_bottom: 5,
                margin_start: 5,
                margin_end: 5,
            });
            let iconSize = this._settings.get_int('menu-button-icon-size');
            let menuButtonIconSizeLabel = new Gtk.Label({
                label: _('Icon Size'),
                use_markup: true,
                xalign: 0,
                hexpand: true
            });
            let menuButtonIconSizeScale = new Gtk.Scale({
                orientation: Gtk.Orientation.HORIZONTAL,
                adjustment: new Gtk.Adjustment({
                    lower: 14,
                    upper: 64,
                    step_increment: 1,
                    page_increment: 1,
                    page_size: 0
                }),
                digits: 0,
                round_digits: 0,
                hexpand: true,
                draw_value: true,
                value_pos: Gtk.PositionType.RIGHT
            });

            if (shellVersion < 40){
                menuButtonIconSizeScale.connect('format-value', (scale, value) => { return value.toString() + ' px'; });
            }
            else{
                menuButtonIconSizeScale.set_format_value_func( (scale, value) => {
                    return "\t" + value + "px";
                });
            }
                
            menuButtonIconSizeScale.set_value(iconSize);
            menuButtonIconSizeScale.connect('value-changed', () => {
                this._settings.set_int('menu-button-icon-size', menuButtonIconSizeScale.get_value());
            });
            if (shellVersion < 40){
                menuButtonIconSizeBox.add(menuButtonIconSizeLabel);
                menuButtonIconSizeBox.add(menuButtonIconSizeScale);
                menuButtonIconSizeFrame.add(menuButtonIconSizeBox);
                this.add(menuButtonIconSizeFrame);
            }
            else{
                menuButtonIconSizeBox.append(menuButtonIconSizeLabel);
                menuButtonIconSizeBox.append(menuButtonIconSizeScale);
                menuButtonIconSizeFrame.set_child(menuButtonIconSizeBox);
                this.append(menuButtonIconSizeFrame);
            }
            
            let clickType = this._settings.get_int('menu-button-icon-click-type');
            let menuButtonIconClickTypeFrame = new Gtk.Frame();
            let menuButtonIconClickTypeBox = new Gtk.Box({
                margin_top: 5,
                margin_bottom: 5,
                margin_start: 5,
                margin_end: 5,
            });

            let menuButtonIconClickTypeLabel = new Gtk.Label({
                label: _('Icon Click Type to open Activities'),
                use_markup: true,
                xalign: 0,
                hexpand: true
            });

            let menuButtonIconClickTypeCombo= new Gtk.ComboBoxText();
            menuButtonIconClickTypeCombo.append("2", _("Middle Click "));
            menuButtonIconClickTypeCombo.append("3", _("Right Click "));
            menuButtonIconClickTypeCombo.set_active_id(clickType.toString());

            menuButtonIconClickTypeCombo.connect('changed', () => {
                this._settings.set_int('menu-button-icon-click-type', parseInt(menuButtonIconClickTypeCombo.get_active_id()));
            });

            if (shellVersion < 40){
                menuButtonIconClickTypeBox.add(menuButtonIconClickTypeLabel);
                menuButtonIconClickTypeBox.add(menuButtonIconClickTypeCombo);
                menuButtonIconClickTypeFrame.add(menuButtonIconClickTypeBox);
                this.add(menuButtonIconClickTypeFrame);
            }
            else{
                menuButtonIconClickTypeBox.append(menuButtonIconClickTypeLabel);
                menuButtonIconClickTypeBox.append(menuButtonIconClickTypeCombo);
                menuButtonIconClickTypeFrame.set_child(menuButtonIconClickTypeBox);
                this.append(menuButtonIconClickTypeFrame);
            }


            let menuButtonTerminalFrame = new Gtk.Frame();
            let menuButtonTerminalBox = new Gtk.Box({
                margin_top: 5,
                margin_bottom: 5,
                margin_start: 5,
                margin_end: 5,
            });

            // Change Terminal and build it's option in prefs
            let currentTerminal = this._settings.get_string('menu-button-terminal');
            let changeTerminalText = new Gtk.Label({
                label: _("Terminal"),
                use_markup: true,
                
            })

            let changeTerminalInput = new Gtk.Entry({
                halign: Gtk.Align.END,
                hexpand: true,
            });

            changeTerminalInput.set_text(currentTerminal);
            changeTerminalInput.connect('changed', () => {
                this._settings.set_string('menu-button-terminal', changeTerminalInput.get_text());
            });

            if (shellVersion < 40){
                menuButtonTerminalBox.add(changeTerminalText);
                menuButtonTerminalBox.add(changeTerminalInput);
                menuButtonTerminalFrame.add(menuButtonTerminalBox);
                this.add(menuButtonTerminalFrame);
            }
            else{
                menuButtonTerminalBox.append(changeTerminalText);
                menuButtonTerminalBox.append(changeTerminalInput);
                menuButtonTerminalFrame.set_child(menuButtonTerminalBox);
                this.append(menuButtonTerminalFrame);
            }

            let menuButtonSCFrame = new Gtk.Frame();
            let menuButtonSCBox = new Gtk.Box({
                margin_top: 5,
                margin_bottom: 5,
                margin_start: 5,
                margin_end: 5,
            });

            // Change Software Center and build it's option in prefs
            let currentSoftwareCenter = this._settings.get_string('menu-button-software-center');
            let changeSoftwareCenterText = new Gtk.Label({
                label: _("Software Center"),
                use_markup: true,
                xalign: 0,
            })

            let changeSoftwareCenterInput = new Gtk.Entry({
                halign: Gtk.Align.END,
                hexpand: true,
            });

            changeSoftwareCenterInput.set_text(currentSoftwareCenter);
            changeSoftwareCenterInput.connect('changed', () => {
                this._settings.set_string('menu-button-software-center', changeSoftwareCenterInput.get_text());
            });

            if (shellVersion < 40){
                menuButtonSCBox.add(changeSoftwareCenterText);
                menuButtonSCBox.add(changeSoftwareCenterInput);
                menuButtonSCFrame.add(menuButtonSCBox);
                this.add(menuButtonSCFrame);
            }
            else{
                menuButtonSCBox.append(changeSoftwareCenterText);
                menuButtonSCBox.append(changeSoftwareCenterInput);
                menuButtonSCFrame.set_child(menuButtonSCBox);
                this.append(menuButtonSCFrame);
            }

            // Toggle Power Options visibility and build it's option in prefs
            let PowerOptionFrame = new Gtk.Frame();
            let PowerOptionBox = new Gtk.Box({
                margin_top: 5,
                margin_bottom: 5,
                margin_start: 5,
                margin_end: 5,
            });

            let enablePowerOptionText = new Gtk.Label({
                label: _("Enable Power Options"),
                use_markup: true,
                xalign: 0,
                hexpand: true
            })

            let showPowerOptionsSwitch= new Gtk.Switch({ 
                halign: Gtk.Align.END,
            });

            showPowerOptionsSwitch.set_active(this._settings.get_boolean('show-power-options'));
            showPowerOptionsSwitch.connect('notify::active', (widget) => {
                this._settings.set_boolean('show-power-options', widget.get_active());
            });

            if (shellVersion < 40){
                PowerOptionBox.add(enablePowerOptionText);
                PowerOptionBox.add(showPowerOptionsSwitch);
                PowerOptionFrame.add(PowerOptionBox);
                this.add(PowerOptionFrame);
            }
            else{
                PowerOptionBox.append(enablePowerOptionText);
                PowerOptionBox.append(showPowerOptionsSwitch);
                PowerOptionFrame.set_child(PowerOptionBox);
                this.append(PowerOptionFrame);
            }

            // Toggle Force Quit option and build it's option in prefs
            let forceQuitOptionFrame = new Gtk.Frame();
            let forceQuitOptionBox = new Gtk.Box({
                margin_top: 5,
                margin_bottom: 5,
                margin_start: 5,
                margin_end: 5,
            });

            let enableFQOptionText = new Gtk.Label({
                label: _("Hide Force Quit option"),
                use_markup: true,
                xalign: 0,
                hexpand: true
            })

            let showFQOptionsSwitch= new Gtk.Switch({ 
                halign: Gtk.Align.END,
            });

            showFQOptionsSwitch.set_active(this._settings.get_boolean('hide-forcequit'));
            showFQOptionsSwitch.connect('notify::active', (widget) => {
                this._settings.set_boolean('hide-forcequit', widget.get_active());
            });

            if (shellVersion < 40){
                forceQuitOptionBox.add(enableFQOptionText);
                forceQuitOptionBox.add(showFQOptionsSwitch);
                forceQuitOptionFrame.add(forceQuitOptionBox);
                this.add(forceQuitOptionFrame);
            }
            else{
                forceQuitOptionBox.append(enableFQOptionText);
                forceQuitOptionBox.append(showFQOptionsSwitch);
                forceQuitOptionFrame.set_child(forceQuitOptionBox);
                this.append(forceQuitOptionFrame);
            }

            // Toggle Lock Screen option and build it's option in prefs
            let lockScreenOptionFrame = new Gtk.Frame();
            let lockScreenOptionBox = new Gtk.Box({
                margin_top: 5,
                margin_bottom: 5,
                margin_start: 5,
                margin_end: 5,
            });

            let enableLSOptionText = new Gtk.Label({
                label: _("Show Lock Screen option"),
                use_markup: true,
                xalign: 0,
                hexpand: true
            })

            let showLCOptionsSwitch= new Gtk.Switch({ 
                halign: Gtk.Align.END,
            });

            showLCOptionsSwitch.set_active(this._settings.get_boolean('show-lockscreen'));
            showLCOptionsSwitch.connect('notify::active', (widget) => {
                this._settings.set_boolean('show-lockscreen', widget.get_active());
            });

            if (shellVersion < 40){
                lockScreenOptionBox.add(enableLSOptionText);
                lockScreenOptionBox.add(showLCOptionsSwitch);
                lockScreenOptionFrame.add(lockScreenOptionBox);
                this.add(lockScreenOptionFrame);
            }
            else{
                lockScreenOptionBox.append(enableLSOptionText);
                lockScreenOptionBox.append(showLCOptionsSwitch);
                lockScreenOptionFrame.set_child(lockScreenOptionBox);
                this.append(lockScreenOptionFrame);
            }    

            // Toggle Lock Orientation option and build it's option in prefs
            let lockOrientationOptionFrame = new Gtk.Frame();
            let lockOrientationOptionBox = new Gtk.Box({
                margin_top: 5,
                margin_bottom: 5,
                margin_start: 5,
                margin_end: 5,
            });

            let enableLOOptionText = new Gtk.Label({
                label: _("Show Lock Orientation option"),
                use_markup: true,
                xalign: 0,
                hexpand: true
            })

            let showLOOptionsSwitch= new Gtk.Switch({ 
                halign: Gtk.Align.END,
            });

            showLOOptionsSwitch.set_active(this._settings.get_boolean('show-lockorientation'));
            showLOOptionsSwitch.connect('notify::active', (widget) => {
                this._settings.set_boolean('show-lockorientation', widget.get_active());
            });

            if (shellVersion < 40){
                lockOrientationOptionBox.add(enableLOOptionText);
                lockOrientationOptionBox.add(showLOOptionsSwitch);
                lockOrientationOptionFrame.add(lockOrientationOptionBox);
                this.add(lockOrientationOptionFrame);
            }
            else{
                lockOrientationOptionBox.append(enableLOOptionText);
                lockOrientationOptionBox.append(showLOOptionsSwitch);
                lockOrientationOptionFrame.set_child(lockOrientationOptionBox);
                this.append(lockOrientationOptionFrame);
            }    

            // Toggle Software centre option and build it's option in prefs
            let SoftwareCentreOptionFrame = new Gtk.Frame();
            let SoftwareCentreOptionBox = new Gtk.Box({
                margin_top: 5,
                margin_bottom: 5,
                margin_start: 5,
                margin_end: 5,
            });

            let hideSCOptionText = new Gtk.Label({
                label: _("Hide Software Centre option"),
                use_markup: true,
                xalign: 0,
                hexpand: true
            })

            let hideSCOptionSwitch= new Gtk.Switch({ 
                halign: Gtk.Align.END,
            });

            hideSCOptionSwitch.set_active(this._settings.get_boolean('hide-softwarecentre'));
            hideSCOptionSwitch.connect('notify::active', (widget) => {
                this._settings.set_boolean('hide-softwarecentre', widget.get_active());
            });

            if (shellVersion < 40){
                SoftwareCentreOptionBox.add(hideSCOptionText);
                SoftwareCentreOptionBox.add(hideSCOptionSwitch);
                SoftwareCentreOptionFrame.add(SoftwareCentreOptionBox);
                this.add(SoftwareCentreOptionFrame);
            }
            else{
                SoftwareCentreOptionBox.append(hideSCOptionText);
                SoftwareCentreOptionBox.append(hideSCOptionSwitch);
                SoftwareCentreOptionFrame.set_child(SoftwareCentreOptionBox);
                this.append(SoftwareCentreOptionFrame);
            }    

        }
    })

    function buildPrefsWidget() {
        let widget = new LogoMenuPreferencesWidget();
        if (shellVersion < 40){
            let iconTheme = Gtk.IconTheme.get_default();
            if(!iconTheme.get_search_path().includes(Me.path + "/Resources"))
                iconTheme.append_search_path(Me.path + "/Resources");
            widget.show_all();
            return widget;
        } else if (shellVersion < 42) {
            var scrollBox = new Gtk.ScrolledWindow();
            scrollBox.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
            let iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
            if(!iconTheme.get_search_path().includes(Me.path + "/Resources"))
                iconTheme.add_search_path(Me.path + "/Resources");
            widget.show();
            scrollBox.set_child(widget);
            return scrollBox;
        }
    }

}

     
