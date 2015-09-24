Meteor.publish("dbEventLog", function(limit) {
	if (typeof limit !== "number")
		return EventLog.find();
	return EventLog.find({}, {
		limit: limit
	});
});
Meteor.publish('eventLogCount', function() {
	Counts.publish(this, 'eventLog', EventLog.find());
});
