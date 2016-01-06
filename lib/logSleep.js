getSleepRows = (cursor) => {
	return cursor.find({
		activity: "sleep"
	}, {
		sort: {
			id: 1
		}
	});
}