/*
The MIT License (MIT)
Copyright (c) 2023 Aryan20
Copyright (c) 2013 otto.allmendinger@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*
This file has been copied from force-quit/selection.js [1], with edits. 
Edits primarily involves removing graphical feedback.

[1]: https://github.com/meghprkh/force-quit/blob/master/selection.js
*/

/* exported SelectionWindow */
'use strict';

const GObject = imports.gi.GObject;
const Signals = imports.signals;
const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Layout = imports.ui.layout;

const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

// const Ext = Me.imports.extension;
const DisplayApi = Me.imports.display_module.DisplayApi;

const Config = imports.misc.config;
const shellVersion = Number.parseInt(Config.PACKAGE_VERSION.split('.')[0]);

/**
 * @type {Lang.Class}
 */
const Capture = GObject.registerClass({
    GTypeName: 'ForceQuit_Capture',
}, class Capture extends GObject.Object {
    /**
     * @private
     */
    _init() {
        this._mouseDown = false;

        this.monitor = Main.layoutManager.focusMonitor;

        this._areaSelection = new St.Widget({
            name: 'area-selection',
            style_class: 'area-selection',
            visible: 'true',
            reactive: 'true',
            x: -10,
            y: -10,
        });

        Main.uiGroup.add_actor(this._areaSelection);

        this._grab = Main.pushModal(this._areaSelection);

        if (this._grab) {
            if (shellVersion >= 42) {
                this._signalCapturedEvent = this._areaSelection.connect(
                    'captured-event',
                    this._onCaptureEvent.bind(this)
                );
            } else {
                this._grab = this._areaSelection;
                this._signalCapturedEvent = global.stage.connect(
                    'captured-event',
                    this._onCaptureEvent.bind(this)
                );
            }



            this._setCaptureCursor();
        }
    }

    /**
     * @private
     */
    _setDefaultCursor() {
        DisplayApi.set_cursor(Meta.Cursor.DEFAULT);
    }

    /**
     * @private
     */
    _setCaptureCursor() {
        DisplayApi.set_cursor(Meta.Cursor.CROSSHAIR);
    }

    /**
     * @param {Clutter.Actor} actor the actor that received the event
     * @param {Clutter.Event} event a Clutter.Event
     * @private
     */
    _onCaptureEvent(actor, event) {
        if (event.type() === Clutter.EventType.KEY_PRESS) {
            if (event.get_key_symbol() === Clutter.KEY_Escape) {
                this._stop();
            }
        }

        this.emit('captured-event', event);
    }

    /**
     * @private
     */
    _stop() {
        global.stage.disconnect(this._signalCapturedEvent);
        this._setDefaultCursor();
        Main.uiGroup.remove_actor(this._areaSelection);
        Main.popModal(this._grab);
        this._areaSelection.destroy();
        this.emit('stop');
        this.disconnectAll();
    }

    toString() {
        return this.GTypeName;
    }
});

Signals.addSignalMethods(Capture.prototype);

var SelectionWindow = GObject.registerClass({
    GTypeName: 'ForceQuit_SelectionWindow',
}, class SelectionWindow extends GObject.Object {
    /**
     * @private
     */
    _init() {

        this._windows = global.get_window_actors();
        this._capture = new Capture();
        this._capture.connect('captured-event', this._onEvent.bind(this));
        this._capture.connect('stop', this.emit.bind(this, 'stop'));
    }

    /**
     * @param {Clutter.Actor} capture the actor the captured the event
     * @param {Clutter.Event} event a Clutter.Event
     * @private
     */
    _onEvent(capture, event) {
        let type = event.type();
        let [x, y] = global.get_pointer();

        this._selectedWindow = _selectWindow(this._windows, x, y);


        if (type === Clutter.EventType.BUTTON_PRESS) {
            if (event.get_button() === Clutter.BUTTON_SECONDARY) {
                this._capture._stop();
            } else if (this._selectedWindow) {
                this._capture._stop();

                this._selectedWindow.get_meta_window().kill()
            }
        }
    }

    toString() {
        return this.GTypeName;
    }
});

Signals.addSignalMethods(SelectionWindow.prototype);



/**
 * @param {Array(Clutter.Actor)} windows all windows on the display
 * @param {number} x left position
 * @param {number} y top position
 * @returns {Clutter.Actor}
 */
function _selectWindow(windows, x, y) {
    let filtered = windows.filter(win => {
        if (
            win !== undefined &&
            win.visible &&
            typeof win.get_meta_window === 'function'
        ) {

            let [w, h] = win.get_size();
            let [wx, wy] = win.get_position();

            return wx <= x && wy <= y && wx + w >= x && wy + h >= y;
        } else {
            return false;
        }
    });

    filtered.sort((a, b) => {
        return (
            a.get_meta_window().get_layer() <= b.get_meta_window().get_layer()
        );
    });

    return filtered[0];
}
