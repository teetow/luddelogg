Meteor.startup(function() {
    Meteor.reactivePublish("logSleep", function() {
        return EventLog.find({
            activity: "sleep"
        }, {
            sort: {
                timestamp: -1
            },
        });
    });
});
