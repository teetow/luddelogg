Meteor.publish("dbEventLog", function(limit) {
	if (typeof limit !== "number") {
		AddMessage("Warning! No limit specified for dbLogEvent subscription. Check your code.");
		return EventLog.find();
	}
	return EventLog.find({}, {
		sort: {
			id: -1
		},
		limit: limit
	});
});
Meteor.publish('eventLogCount', function() {
	var sub = this;
	Meteor.defer(function() {
		Counts.publish(sub, 'eventLog', EventLog.find());
	});
});
