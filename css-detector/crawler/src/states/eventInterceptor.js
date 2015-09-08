/**
 *               __                         _____ _______
 * .-----.---.-.|  |.--------.-----.-----._|     |     __|
 * |__ --|  _  ||  ||        |  _  |     |       |__     |
 * |_____|___._||__||__|__|__|_____|__|__|_______|_______|
 *
 * salmonJS v0.4.0
 *
 * Copyright (C) 2014 Fabio Cicerchia <info@fabiocicerchia.it>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Event Container Class
 *
 * Override the Event handler to intercept and collect all the events that will
 * be bound to the DOM elements.
 *
 * @class EventContainer
 */
var eventHandlers = ["onclick","oncontextmenu","ondblclick",
    "onmousedown","onmouseenter","onmouseleave","onmousemove",
    "onmouseover","onmouseout","onmouseup","onkeydown","onkeypress",
    "onkeyup","onabort","onbeforeunload","onerror","onhashchange",
    "onload","onpageshow","onpagehide","onresize","onscroll","onunload",
    "onblur","onchange","onfocus","onfocusin","onfocusout","oninput",
    "oninvalid","onreset","onsearch","onselect","onsubmit","ondrag",
    "ondragend","ondragenter","ondragleave","ondragover","ondragstart",
    "ondrop","oncopy","oncut","onpaste","onafterprint","onbeforeprint",
    "onabort","oncanplay","oncanplaythrough","ondurationchange","onended",
    "onerror","onloadeddata","onloadedmetadata","onloadstart","onpause","onplay",
    "onplaying","onprogress","onratechange","onseeked","onseeking","onstalled",
    "onsuspend","ontimeupdate","onvolumechange","onwaiting","onerror","onmessage",
    "onopen","onwheel","ononline","onoffline","onshow","ontoggle","onwheel"];

var EventContainer = function () {
    /**
     * The Event Container.
     *
     * @property container
     * @type {Object}
     * @default {}
     */
    this.container = {};

    /**
     * Current instance.
     *
     * @property currentEventContainer
     * @type {Object}
     * @default this
     */
    var currentEventContainer = this;

    /**
     * Hash a string with SHA1 (if exists).
     *
     * @method hashString
     * @param {String} string The string to be converted to hash
     * @return {String}
     */
    this.hashString = function (string) {
        if (typeof SHA1 !== 'undefined') {
            return SHA1(string);
        }

        return string.replace(/[^a-zA-Z0-9]/g, '_');
    };

    /**
     * Retrieve a list of DOM elements based on their attributes.
     *
     * @method getElementsByAttribute
     * @param {DOMElement} element The root element.
     * @param {String}     attr    The attribute name ('*' is a wildcard).
     * @return {Array}
     */
    this.getElementsByAttribute = function (element, attribute) {
        var arr_elms = element.getElementsByTagName('*'),
            elements = [],
            wildcard = attribute.substr(-1, 1) === '*',
            curr_attr,
            attrs,
            i,
            l,
            j;

        if (wildcard) {
            attribute = attribute.substr(0, attribute.length - 1);
        }

        for (i = 0; i < arr_elms.length; i++) {
            for (j = 0, attrs = arr_elms[i].attributes, l = attrs.length; j < l; j++) {
                curr_attr = attrs.item(j).nodeName;
                if ((!wildcard && curr_attr === attribute) || (wildcard && curr_attr.substr(0, attribute.length) === attribute)) {
                    elements.push(arr_elms[i]);
                }
            }
        }

        return elements;
    };

    /**
     * Add the element's event to the container.
     *
     * @method pushEvent
     * @param {String}     type      The event type
     * @param {String}     signature The signature of the event (sha1 of the function)
     * @param {DOMElement} element   The DOM element
     * @return Add the
     */
    this.pushEvent = function (type, signature, element) {
        currentEventContainer.container[type] = currentEventContainer.container[type] || {};
        currentEventContainer.container[type][signature] = currentEventContainer.container[type][signature] || [];

        var identifier = currentEventContainer.getDOMPath(element);
        if (identifier === '') {
            identifier = element.identifier;
        }

        if (currentEventContainer.container[type][signature].indexOf(identifier) === -1) {
            currentEventContainer.container[type][signature].push(identifier);
        }
    };

    /**
     * Override the native function "addEventListener".
     *
     * @method customAddEventListener
     * @return undefined
     */
    this.customAddEventListener = function (type, listener, useCapture, wantsUntrusted) {
        var signature = currentEventContainer.hashString(listener.toString());
        currentEventContainer.pushEvent(type, signature, this);

        this._origAddEventListener(type, listener, useCapture, wantsUntrusted);
    };

    /**
     * Override the native function "removeEventListener".
     *
     * @method customRemoveEventListener
     * @param {String}   type       A string representing the event type being removed.
     * @param {Function} listener   The listener parameter indicates the EventListener function to be removed.
     * @param {Boolean}  useCapture Specifies whether the EventListener being removed was registered as a capturing listener or not. If not specified, useCapture defaults to false.
     * @return undefined
     */
    this.customRemoveEventListener = function (type, listener, useCapture) {
        var signature = currentEventContainer.hashString(listener.toString());
        if (currentEventContainer.container[type][signature] !== undefined) {
            currentEventContainer.container[type][signature] = undefined;
        }

        this._origRemoveEventListener(type, listener, useCapture);
    };

    /**
     * Override the native function "setAttribute".
     *
     * @method customSetAttribute
     * @param {String} name  The name of the attribute as a string.
     * @param {String} value The desired new value of the attribute.
     * @return undefined
     */
    this.customSetAttribute = function (name, value) {
        var type, signature;

        if (name.indexOf('on') === 0) {
            type = name.substr(2);
            signature = currentEventContainer.hashString(value.toString());
            currentEventContainer.pushEvent(type, signature, this);
        }

        this._origSetAttribute(name, value);
    };

    /**
     * Override the native function "removeAttribute".
     *
     * @method customRemoveAttribute
     * @param {String} attrName The attribute to be removed from element.
     * @return undefined
     */
    this.customRemoveAttribute = function (attrName) {
        var type, signature;

        if (attrName.indexOf('on') === 0) {
            type = attrName.substr(2);

            currentEventContainer.container[type] = currentEventContainer.container[type] || {};

            signature = currentEventContainer.hashString(this.getAttribute(attrName).toString());
            if (currentEventContainer.container[type][signature] !== undefined) {
                currentEventContainer.container[type][signature] = undefined;
            }
        }

        this._origRemoveAttribute(name);
    };

    /**
     * Override the event listener for a certain object (e.g.: document, window,
     * element).
     *
     * @method overrideEventListener
     * @param {Object} object The object that will be changed
     * @return undefined
     */
    this.overrideEventListener = function (object) {
        var prototype = object.prototype === undefined ? object : object.prototype;

        prototype._origAddEventListener    = prototype.addEventListener;
        prototype.addEventListener         = currentEventContainer.customAddEventListener;
        prototype._origRemoveEventListener = prototype.removeEventListener;
        prototype.removeEventListener      = currentEventContainer.customRemoveEventListener;
    };

    /**
     * Override the attribute handler for a certain object (e.g.: document,
     * window, element).
     *
     * @method overrideAttributeHandler
     * @param {Object} object The object that will be changed
     * @return undefined
     */
    this.overrideAttributeHandler = function (object) {
        var prototype = object.prototype === undefined ? object : object.prototype;

        prototype._origSetAttribute    = prototype.setAttribute;
        prototype.setAttribute         = currentEventContainer.customSetAttribute;
        prototype._origRemoveAttribute = prototype.removeAttribute;
        prototype.removeAttribute      = currentEventContainer.customRemoveAttribute;
    };

    this.getEvents = function (element) {
        this.getDynamicEvents(element);
        this.getPrefixHandlers(element);

        return currentEventContainer.container;
    }

    this.getDynamicEvents = function (element) {
        var elements = element.getElementsByTagName('*');
            elements = [].slice.call(elements);
        var signature;

        elements.forEach(function (element) {
            eventHandlers.forEach(function (attribute) {
                if (element[attribute] != null) {
                    signature = currentEventContainer.hashString(element[attribute].toString());

                    currentEventContainer.pushEvent(attribute.substring(2), signature, element);
                }
            });
        });
    };

    this.getPrefixHandlers = function (element) {
        var elements = element.querySelectorAll('[href^="javascript:"]');
            elements = [].slice.call(elements);

        elements.forEach(function (element) {
            signature = currentEventContainer.hashString(element.href.replace('javascript:', ''));

            currentEventContainer.pushEvent('click', signature, element)
        });
    };

    this.getDOMPath = function (element) {
        var parents = [],
            entry;

        while (element && element.tagName) {
            entry = element.tagName.toLowerCase();

            if (entry === 'html') {
                break;
            }

            var sibIndex = 0;
            var sibCount = element.parentElement.children.length;
            for (var i = 0; i < sibCount; i++) {
                var sibling = element.parentElement.children[i];
                if (sibling === element) {
                    sibIndex = i;
                }
            }

            if (element.hasAttribute('id') && element.id !== '') {
                entry = entry + '#' + element.id;
            }
            else if (sibCount > 1) {
                entry = entry + ':nth-child(' + (sibIndex + 1) + ')';
            }
            parents.push(entry);
            element = element.parentNode;
        }
        parents.reverse();
        return parents.join(" > ");
    }
};

var eventContainer = new EventContainer();

if (Element !== undefined) {
    eventContainer.overrideEventListener(Element);
    eventContainer.overrideAttributeHandler(Element);
}

if (document !== undefined) {
    document.identifier = 'document';
    eventContainer.overrideEventListener(document);
    eventContainer.overrideAttributeHandler(document);
}

if (window !== undefined) {
    window.identifier = 'window';
    eventContainer.overrideEventListener(window);
    eventContainer.overrideAttributeHandler(window);

    window.eventContainer = eventContainer;
}
