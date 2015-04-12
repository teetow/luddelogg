Meteor.startup(function() {
    Meteor.reactivePublish("logRecent", function() {
        return EventLog.find({}, {
            sort: {
                timestamp: -1
            },
            limit: 50
        });
    });
});