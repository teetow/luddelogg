Meteor.publish("sheetData", function() {
	return SheetData.find();
});
Meteor.publish('sheetDataCount', function() {
	Counts.publish(this, 'sheetData', SheetData.find());
});
