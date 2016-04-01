import moment from "moment";

Meteor.publish("dbEventLog", function(userOptions) {
	let localUserOptions = {};
	_.extend(localUserOptions, {
		days: 0,
	}, userOptions);
	this.autorun(function(computation) {
		let queryFilter = {};
		let queryOptions = {
			sort: {
				id: -1
			},
			limit: 0
		};
		if (localUserOptions.days && localUserOptions.days > 0) {
			let cutoffdate = moment();
			cutoffdate.subtract(localUserOptions.days, "days");
			let cutoff = moment(cutoffdate.format("YYYY-MM-DD"));
			queryFilter.timestamp = {
				$gte: cutoff.toDate()
			};
		}
		if (localUserOptions.limit) {
			queryOptions.limit = localUserOptions.limit;
		}
		return EventLog.find(queryFilter, queryOptions);
	});
});
Meteor.publish('eventLogCount', function() {
	let sub = this;
	Meteor.defer(function() {
		Counts.publish(sub, 'eventLog', EventLog.find());
	});
});
