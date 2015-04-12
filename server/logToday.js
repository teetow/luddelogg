Meteor.startup(function() {
    Meteor.reactivePublish("logToday", function() {

        // nope, he's up. get today's events.
        var lastNightSleepEvents = EventLog.find({
            activity: "sleep",
            label: "night",
            timestamp: {
                $gt: moment().subtract(48, "hours").toDate()
            },
            endtimestamp: {
                $ne: null
            },
        }, {
            sort: {
                timestamp: -1
            }
        });

        var toBedEvent = lastNightSleepEvents.fetch()[0];
        var dayLog = EventLog.find({
            timestamp: {
                $gte: toBedEvent.timestamp
            }
        });
        console.log("publishing " + dayLog.count() + " daylog records");
        return dayLog;
    });
});
