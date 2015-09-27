Meteor.publish("sheetData", function() {
	return SheetData.find();
});