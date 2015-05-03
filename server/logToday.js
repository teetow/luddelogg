Meteor.reactivePublish("logToday", function() {
    return getToday(EventLog);
});
