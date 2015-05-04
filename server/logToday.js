Meteor.reactivePublish("logToday", function(now) {
	return getToday(EventLog, now);
});
