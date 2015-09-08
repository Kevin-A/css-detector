var staticClasses = [
	':target', ':valid', ':invalid', ':indeterminate', ':default',
	':hover', ':active', ':visited', ':link', ':any-link', ':focus',
	':after', ':before', ':first-letter', ':first-line', ':selection', ':backdrop',
	':marker', ':in-range', ':out-of-range'];

exports.searchRules = function searchRules(page, sheetManager) {

	var fromTo = [];

	page.activeSheets.forEach(function (signature) {
		var sheet = sheetManager.stylesheets[signature];

		for (var i in sheet.rules) {
			// casper.echo('checking: ' + sheet.rules[i].selector);

			var origRule = sheet.rules[i].selector;

			var prefixRule = fixPrefix(origRule);
			var strippedRule = stripStaticClasses(prefixRule);


			if (strippedRule.indexOf(':checked') > -1) {
				if (detectChecked(strippedRule)) {
					fromTo.push({
						RuleId: sheet.rules[i].id,
						PageId: page.id
					});
					sheet.rules[i].addPage(page);
					continue;
				}
			}

			if (casper.exists(strippedRule)) {
				sheet.rules[i].addPage(page);
				fromTo.push({
					RuleId: sheet.rules[i].id,
					PageId: page.id
				});
				// console.log('Found rule: ' + sheet.rules[i].selector);
			}
		}
	});

	var res = casper.POST('/websites/' + page.website.id + '/ruleusages', { connections: fromTo });
};

function fixPrefix (rule) {
	return rule
		// :dir() cannot be searched directly, so translate to attribute selector
		.replace(/:dir\((.*?)\)/ig, '[dir="$1"]')

		// placeholder cannot be detected directly, so translate to attribute selector
		.replace(/:placeholder-shown|::-webkit-input-placeholder|::-moz-placeholder|:-ms-input-placeholder/ig, '[placeholder]')

		// phantomjs can only detect the -webkit-any version, so convert the rest
		.replace(/(:matches|:-moz-any)\((.*?)\)/ig, ':-webkit-any($2)')

		// convert prefix selection to selection
		.replace('-moz-selection', 'selection');
}

function stripStaticClasses (origRule) {
	origRule = origRule.replace('::', ':'); // colon edge case

	staticClasses.forEach(function (cls) {

		// Cases like `:focus`, `:selection` (universal selectors)
		origRule = origRule.replace(' ' + cls, ' *');
		// normal cases
		origRule = origRule.replace(cls, '');

		// Universal selector
		if (origRule.length === 0) {
			origRule += '*';
		}
	});

	return origRule;
}

function detectChecked(rule) {
	var rexp = /([\w=\"\[\]]*?):checked/g;
	var res = rexp.exec(rule);

	var ruleRadio = /input\[type="?radio"?\]/i;
	var ruleRadioString = 'input[type="radio"]';
	var ruleCheckbox = /input\[type="?checkbox"?\]/i;
	var ruleCheckboxString = 'input[type="checkbox"]';

	if (res.length > 1) {
		if (res[1] === '') {
			// Missing element (so it is *)

		}
		else if (res[1] === 'option') {
			if (casper.exists(rule)) {
				return true;
			}
		}
		else if (ruleRadio.test(res[1]) || ruleCheckbox.test(res[1])) {
			if (casper.exists(res[1])) {
				setBoxes(res[1], true);
			}

			if (casper.exists(rule)) {
				setBoxes(res[1], false);
				return true;
			}
		}
		else if (res[1] === 'input') {

			if (casper.exists(ruleRadioString)) {
				setBoxes(ruleRadioString, true);
			}
			else if (casper.exists(ruleCheckboxString)) {
				setBoxes(ruleCheckboxString, true);
			}

			if (casper.exists(rule)) {
				setBoxes(ruleRadioString, false);
				setBoxes(ruleCheckboxString, false);
				return true;
			}
		}
	}

	return false;
}

function setBoxes(rule, value) {
	casper.evaluate(function(rule, value) {
		var list = document.querySelectorAll(rule);
		Array.prototype.slice.call(list).map(function (e) {
			e.checked = value;
		});
	}, rule, value);
}
