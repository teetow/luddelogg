Meteor.publish("logToday", function(now) {
	return getToday(EventLog, now);
});
