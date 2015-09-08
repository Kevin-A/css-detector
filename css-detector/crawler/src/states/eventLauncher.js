
var EventLauncher = function () {

	this.keyCodes = {
		"0": 48,
		"1": 49,
		"2": 50,
		"3": 51,
		"4": 52,
		"5": 53,
		"6": 54,
		"7": 55,
		"8": 56,
		"9": 57,
		"backspace": 8,
		"tab": 9,
		"enter": 13,
		"shift": 16,
		"ctrl": 17,
		"alt": 18,
		"pause": 19,
		"break": 19,
		"caps lock": 20,
		"escape": 27,
		"page up": 33,
		"page down": 34,
		"end": 35,
		"home": 36,
		"left arrow": 37,
		"up arrow": 38,
		"right arrow": 39,
		"down arrow": 40,
		"insert": 45,
		"delete": 46,
		"a": 65,
		"b": 66,
		"c": 67,
		"d": 68,
		"e": 69,
		"f": 70,
		"g": 71,
		"h": 72,
		"i": 73,
		"j": 74,
		"k": 75,
		"l": 76,
		"m": 77,
		"n": 78,
		"o": 79,
		"p": 80,
		"q": 81,
		"r": 82,
		"s": 83,
		"t": 84,
		"u": 85,
		"v": 86,
		"w": 87,
		"x": 88,
		"y": 89,
		"z": 90,
		"left window key": 91,
		"right window key": 92,
		"select key": 93,
		"numpad 0": 96,
		"numpad 1": 97,
		"numpad 2": 98,
		"numpad 3": 99,
		"numpad 4": 100,
		"numpad 5": 101,
		"numpad 6": 102,
		"numpad 7": 103,
		"numpad 8": 104,
		"numpad 9": 105,
		"multiply": 106,
		"add": 107,
		"subtract": 109,
		"decimal point": 110,
		"divide": 111,
		"f1": 112,
		"f2": 113,
		"f3": 114,
		"f4": 115,
		"f5": 116,
		"f6": 117,
		"f7": 118,
		"f8": 119,
		"f9": 120,
		"f10": 121,
		"f11": 122,
		"f12": 123,
		"num lock": 144,
		"scroll lock": 145,
		"semicolon": 186,
		"equal sign": 187,
		"comma": 188,
		"dash": 189,
		"period": 190,
		"forward slash": 191,
		"grave accent": 192,
		"open bracket": 219,
		"back slash": 220,
		"close bracket": 221,
		"single quote": 222
	};

	this.fire = function (selector, eventType) {
		console.log('Attempting to fire "' + eventType + '" at "' + selector + '"');
		var targetObject = document.querySelector(selector);

		// Don't do anything with non existing or hidden objects
		if (!targetObject || (targetObject.style && targetObject.style.display === "none")) {
			console.log('Could not find "' + selector + '"');
			return false;
		}

		targetObject.value = 'something';

		var evt;

		switch (eventType) {
			case "keyup":
			case "keydown":
			case "keypress":
				evt = this.createKeyboardEvent(eventType, 'enter'); // allow setting it
				break;
			case "click":
				evt = this.createMouseEvent(eventType);
				break;
		}

		if (!evt) {
			console.log('No event created, "' + eventType + '" is probably not yet supported');
			return false;
		}

		targetObject.dispatchEvent ? targetObject.dispatchEvent(evt) :
			targetObject.fireEvent("on" + eventType, evt);
		return true;
	};


	this.createKeyboardEvent = function (eventType, keyString) {

		var keyboardEvent = document.createEventObject ?
			document.createEventObject() : document.createEvent("Events");

		if (keyboardEvent.initEvent) {
			keyboardEvent.initEvent(eventType, true, true);
		}

		var keyCode = this.getKeyCode(keyString);

		keyboardEvent.keyCode = keyCode;
		keyboardEvent.which = keyCode;

		return keyboardEvent;
	};

	this.createMouseEvent = function (eventType) {
		try {
			// DOM lvl 3
			return new MouseEvent(eventType, {
				bubbles: true,
				cancelable: true,
				view: window
			});
		}
		catch (err) {
			if (document.createEvent) {
				// DOM lvl 2
				var evt = document.createEvent('MouseEvents');
				evt.initMouseEvent(eventType,
					true,
					true,
					window);

				return evt;
			}
		}
	}

	this.getKeyCode = function (keyString) {
		if (this.keyCodes.hasOwnProperty(keyString)) {
			return this.keyCodes[keyString];
		}
		return 0;
	};
};

var eventLauncher = new EventLauncher();

if (window !== undefined) {
	window.eventLauncher = eventLauncher;
}
