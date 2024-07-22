/*
This file has been copied from EasyScreenCast/display_module.js [1], with no
edits. We primarily need the set_cursor method as it is used in selection.js

[1]: https://github.com/EasyScreenCast/EasyScreenCast/blob/e2ec24d/display_module.js
*/

'use strict';

/**
 * @type {{_display(): Meta_Display, number_of_displays(): int}}
 */
const DisplayApi = {
    /**
     * Returns the Wayland display or screen
     *
     * @returns {Meta.Display}
     */
    _display() {
        return global.display || global.screen;
    },

    /**
     * @returns {int}
     * @public
     */
    number_displays() {
        return this._display().get_n_monitors();
    },

    /**
     * @param {number} displayIndex the monitor number
     * @returns {Meta.Rectangle}
     */
    display_geometry_for_index(displayIndex) {
        return this._display().get_monitor_geometry(displayIndex);
    },

    /**
     * @param {Meta.Cursor} cursor the new cursor to set
     */
    set_cursor(cursor) {
        this._display().set_cursor(cursor);
    },
};

export {DisplayApi};