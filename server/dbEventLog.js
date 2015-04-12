Meteor.reactivePublish("dbEventLog", function() {
    return EventLog.find();
});
