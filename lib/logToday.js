getToday = function(cursor, now) {
	let nowTime = moment(now).toDate();
	var cutoffTime = moment(now).subtract(36, "hours").toDate();
	var lastNightSleepEvent = cursor.findOne({
		activity: "sleep",
		label: "night",
		timestamp: {
			$lte: nowTime,
			$gt: cutoffTime,
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
			$lte: nowTime,
			$gt: cutoffTime
		}
	}, {
		sort: {
			timestamp: -1
		}
	});
};
