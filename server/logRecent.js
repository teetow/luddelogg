Meteor.publish("logRecent", function() {
	return getRecent(EventLog);
});
