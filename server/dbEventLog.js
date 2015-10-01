Meteor.publish("dbEventLog", function(userOptions) {
	var queryFilter = {};
	var queryOptions = {
		sort: {
			id: -1
		},
		limit: 0
	};
	if (userOptions.days && userOptions.days > 0) {
		var cutoffdate = moment();
		cutoffdate.subtract(userOptions.days, "days");
		var cutoff = moment(cutoffdate.format("YYYY-MM-DD"));
		queryFilter.timestamp = {
			$gte: cutoff.toDate()
		};
	}
	if (userOptions.limit) {
		queryOptions.limit = userOptions.limit;
	}
	return EventLog.find(queryFilter, queryOptions);
});
Meteor.publish('eventLogCount', function() {
	var sub = this;
	Meteor.defer(function() {
		Counts.publish(sub, 'eventLog', EventLog.find());
	});
});
