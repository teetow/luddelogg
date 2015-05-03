Meteor.reactivePublish("logRecent", function() {
	return getRecent(EventLog);
});
