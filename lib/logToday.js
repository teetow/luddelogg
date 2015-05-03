getToday = function(cursor) {
	var cutoff = moment().subtract(36, "hours").toDate();
	var lastNightSleepEvents = cursor.findOne({
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
	if (!lastNightSleepEvents) {
		return cursor.find({
			timestamp: {
				$gt: cutoff
			}
		}, {
			sort: {
				timestamp: -1
			}
		});
	}
	var dayLog = cursor.find({
		timestamp: {
			$gte: lastNightSleepEvents.timestamp
		}
	}, {
		sort: {
			timestamp: -1
		}
	});
	return dayLog;
};
