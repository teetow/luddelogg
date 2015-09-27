Meteor.publish("sheetData", function() {
	return SheetData.find();
});
Meteor.publish('sheetDataCount', function() {
	var sub = this;
	Meteor.defer(function() {
		Counts.publish(sub, 'sheetData', SheetData.find(), {fastCount: true});
	});
});
