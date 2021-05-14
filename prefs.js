const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Gdk, GdkPixbuf, Gio, GLib, GObject, Gtk} = imports.gi;
const Constants = Me.imports.constants;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const Config = imports.misc.config;
const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

function init() {
    ExtensionUtils.initTranslations(Me.metadata['gettext-domain']);
}

var IconGrid = GObject.registerClass(class Fedora_Menu_IconGrid extends Gtk.FlowBox{
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

var FedoraMenuPreferencesWidget = GObject.registerClass(class Fedora_Menu_PreferencesWidget extends Gtk.Box{
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
    }
})

function buildPrefsWidget() {
    let widget = new FedoraMenuPreferencesWidget();
    if (shellVersion < 40){
        let iconTheme = Gtk.IconTheme.get_default();
        if(!iconTheme.get_search_path().includes(Me.path + "/Resources"))
            iconTheme.append_search_path(Me.path + "/Resources");
        widget.show_all();
    }
    else{
        let iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
        if(!iconTheme.get_search_path().includes(Me.path + "/Resources"))
            iconTheme.add_search_path(Me.path + "/Resources");
        widget.show();
    }
    return widget;
}