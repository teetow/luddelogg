Meteor.publish("sleeplog", function() {
	return getSleepRows(EventLog);
});
