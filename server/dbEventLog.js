Meteor.publish("dbEventLog", function(limit) {
	var filter = {};
	var options = {
		sort: {
			id: -1
		}
	};
	if (limit.days) {
		if (limit.days != 0) {
			var cutoffdate = moment();
			cutoffdate.subtract(limit.days, "days");
			var cutoff = moment(cutoffdate.format("YYYY-MM-DD"));
			filter = {
				timestamp: {
					$gte: cutoff.toDate()
				}
			};
		} else {
			options.limit = 0;
		}
	}
	if (limit.number) {
		options.limit = limit;
	}
	return EventLog.find(filter, options);
});
Meteor.publish('eventLogCount', function() {
	var sub = this;
	Meteor.defer(function() {
		Counts.publish(sub, 'eventLog', EventLog.find());
	});
});
