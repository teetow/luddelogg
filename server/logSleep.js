Meteor.publish("logSleep", function() {
	return EventLog.find({
		activity: "sleep"
	}, {
		sort: {
			timestamp: -1
		},
	});
});
