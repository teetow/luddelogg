getRecent = function(cursor) {
	return cursor.find({}, {
		sort: {
			timestamp: -1
		},
		limit: 50
	});
};
