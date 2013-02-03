var events = require('events');
var $u = require('util');

function SimpleXmlParser(targetElements, startFromLastMatch) {
	events.EventEmitter.call(this);

	if (targetElements.length === 0)
		throw new Error('cannot use a zero length array of target elements');

	this._startFromLastMatch = startFromLastMatch;
	this._targetElements = targetElements;	
}

$u.inherits(SimpleXmlParser, events.EventEmitter);

SimpleXmlParser.prototype.parseHttpRequest = function(request) {
	var self = this;

	var data = '';

	request.setEncoding('utf8');

	request.on('data', function(chunk) {	
		data += chunk;
	});

	var self = this;
	request.on('end', function() {		
		self.parseData(data);
	});
};

SimpleXmlParser.prototype.parseData = function(data) {
	var result = {};
	var lastMatch = 0;

	for (var i = 0; i < this._targetElements.length; i++) {
		var element = this._targetElements[i];

		var start = data.indexOf(element.start, lastMatch);

		// not found, proceed to next tag
		if (start === -1) {			
			continue;
		}

		var end = data.indexOf(element.end, start + 1);

		if (end === -1) {
			this.emit('error', element, 'missing closing tag', data);
			break;
		}

		start = start + element.start.length;

		result[element.name] = data.substr(start, end - start);

		if (this._startFromLastMatch)
			lastMatch = end + element.end.length;
	}	

	this.emit('done', result, data);	
};

SimpleXmlParser.createTargetElementsFromNames = function(targetElements) {
	var result = []
	for (var i = 0; i < targetElements.length; i++) {
		result.push({
			name: targetElements[i],
			start: '<' + targetElements[i] + '>',
			end: '</' + targetElements[i] + '>'
		});
	}	

	return result;
};

SimpleXmlParser.create = function(elementNames, startFromLastMatch) {
	return new SimpleXmlParser(SimpleXmlParser.createTargetElementsFromNames(elementNames), startFromLastMatch);
};

module.exports = SimpleXmlParser;