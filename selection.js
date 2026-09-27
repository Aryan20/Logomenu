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
Edits primarily involves removing graphical feedback and logging, and adding
guards so that GNOME Shell itself, its UI and desktop/dock windows can't be killed.

[1]: https://github.com/meghprkh/force-quit/blob/753a4e4/selection.js
*/

'use strict';

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Signals from 'resource:///org/gnome/shell/misc/signals.js';

// Windows that are part of the desktop rather than an app
const PROTECTED_WINDOW_TYPES = [
    Meta.WindowType.DESKTOP,
    Meta.WindowType.DOCK,
];

/**
 * @type {Capture}
 */
class Capture extends Signals.EventEmitter {

    constructor() {
        super();

        this._stopped = false;

        this._areaSelection = new St.Widget({
            name: 'area-selection',
            style_class: 'area-selection',
            visible: 'true',
            reactive: 'true',
            x: -10,
            y: -10,
        });

        Main.uiGroup.add_child(this._areaSelection);

        this._grab = Main.pushModal(this._areaSelection);

        // Any error while holding the grab would leave the whole session unresponsive, so release it
        try {
            this._signalCapturedEvent = this._areaSelection.connect(
                'captured-event',
                this._onCaptureEvent.bind(this)
            );

            this._setCursor('CROSSHAIR');
        } catch (e) {
            this._stop();
            throw e;
        }
    }

    /**
     * @param {string} name cursor name, shared by Clutter.CursorType and Meta.Cursor
     * @private
     */
    _setCursor(name) {
        // The cursor is cosmetic, never let it break the capture
        try {
            // GNOME 50+ sets cursors per actor, older versions on the display
            if (this._areaSelection.set_cursor_type)
                this._areaSelection.set_cursor_type(Clutter.CursorType[name]);
            else
                global.display.set_cursor(Meta.Cursor[name]);
        } catch (e) {
            console.error(`Logo Menu: failed to set cursor: ${e}`);
        }
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
        if (this._stopped)
            return;
        this._stopped = true;

        if (this._signalCapturedEvent)
            this._areaSelection.disconnect(this._signalCapturedEvent);
        this._setCursor('DEFAULT');
        Main.popModal(this._grab);
        this._areaSelection.destroy();
        this._areaSelection = null;
        this.emit('stop');
        this.disconnectAll();
    }

    toString() {
        return this.GTypeName;
    }
}

class SelectionWindow extends Signals.EventEmitter {
    constructor() {
        super();

        this._shellPid = _getShellPid();
        this._capture = new Capture();
        this._capture.connect('captured-event', this._onEvent.bind(this));
        this._capture.connect('stop', () => {
            this.emit('stop');
            this.disconnectAll();
        });
    }

    /**
     * Aborts the selection and releases the grab
     */
    stop() {
        this._capture._stop();
    }

    /**
     * @param {Clutter.Actor} capture the actor the captured the event
     * @param {Clutter.Event} event a Clutter.Event
     * @private
     */
    _onEvent(capture, event) {
        if (event.type() !== Clutter.EventType.BUTTON_PRESS)
            return;

        if (event.get_button() === Clutter.BUTTON_SECONDARY) {
            this._capture._stop();
            return;
        }

        let [x, y] = event.get_coords();
        let metaWindow = _windowActorAt(x, y)?.get_meta_window();

        // Clicks on shell UI, the desktop or protected windows keep the selection going
        if (!_isKillable(metaWindow, this._shellPid))
            return;

        // Release the grab first so a failing kill can't leave the shell stuck in a modal
        this._capture._stop();
        try {
            metaWindow.kill();
        } catch (e) {
            console.error(`Logo Menu: failed to force quit window: ${e}`);
        }
    }

    toString() {
        return this.GTypeName;
    }
}

/**
 * @returns {number} the PID of the GNOME Shell process, or -1 if unknown
 */
function _getShellPid() {
    try {
        return Gio.Credentials.new().get_unix_pid();
    } catch (e) {
        return -1;
    }
}

/**
 * Finds the window actually under the pointer, so shell UI covering a window
 * (panel, notifications, overview) doesn't select the window behind it.
 *
 * @param {number} x left position
 * @param {number} y top position
 * @returns {Meta.WindowActor|null}
 */
function _windowActorAt(x, y) {
    let actor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);

    while (actor && !(actor instanceof Meta.WindowActor))
        actor = actor.get_parent();

    return actor;
}

/**
 * kill() SIGKILLs the process owning the window (or XKillClient's it), so a window
 * owned by the shell, or one whose owner is unknown, would take the session down.
 *
 * @param {Meta.Window|undefined} metaWindow the window to check
 * @param {number} shellPid the PID of GNOME Shell
 * @returns {boolean}
 */
function _isKillable(metaWindow, shellPid) {
    if (!metaWindow || metaWindow.is_override_redirect())
        return false;

    if (PROTECTED_WINDOW_TYPES.includes(metaWindow.get_window_type()))
        return false;

    let pid = metaWindow.get_pid();
    return shellPid > 0 && pid > 0 && pid !== shellPid;
}

export {SelectionWindow};
