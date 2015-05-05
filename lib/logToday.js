getToday = function(cursor, now) {
	var cutoff = moment(now).clone().subtract(36, "hours").toDate();
	var lastNightSleepEvent = cursor.findOne({
		activity: "sleep",
		label: "night",
		timestamp: {
			$gt: cutoff
		},
		endtimestamp: {
			$ne: null
		},
	}, {
		sort: {
			timestamp: -1
		}
	});
	if (lastNightSleepEvent) {
		// find all night sleep blocks from that date, not just one
		var actualNightSleepEvent = cursor.findOne({
			date: lastNightSleepEvent.date,
			activity: "sleep",
			label: "night",
		}, {
			sort: {
				timestamp: 1
			}
		});
		var dayLog = cursor.find({
			timestamp: {
				$gte: actualNightSleepEvent.timestamp
			}
		}, {
			sort: {
				timestamp: -1
			}
		});
		return dayLog;
	}
	return cursor.find({
		timestamp: {
			$gt: cutoff
		}
	}, {
		sort: {
			timestamp: -1
		}
	});
};
