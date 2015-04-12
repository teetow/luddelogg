Template.status.created = function() {
    var state = this.state = new ReactiveVar();
    Meteor.setInterval(function() {
        Session.set("now", moment().toDate());
    }, 1000);

    Meteor.subscribe("logToday", {
        onReady: function() {
            Tracker.autorun(function() {
                state.set(getStatus(EventLog.find()));
            });
        },
        onError: function() {
            console.log("Error subscribing to TodayLog.");
        }
    })
}

function getStatus(eventLogCursor) {
    var logentries = eventLogCursor.fetch();
    var state = {};

    // total sleep
    var totalSleep = moment.duration(0);
    var totalFood = 0;
    logentries.forEach(function(item) {
        if (item.activity == "sleep") {
            if (item.endtimestamp) {
                var start = moment.utc(item.timestamp);
                var end = moment.utc(item.endtimestamp);
                var duration = moment.duration(end.diff(start));
                totalSleep += duration;
            }
        } else if (item.activity == "food") {
            totalFood++;
        }
    });
    state.totalSleep = totalSleep;
    state.totalFood = totalFood;

    // last sleep
    var lastSleepEntry = EventLog.findOne({
        activity: "sleep",
    }, {
        sort: {
            timestamp: -1
        },
        limit: 1
    });
    if (lastSleepEntry) {
        state.lastState = "asleep";
        state.lastTransition = lastSleepEntry.timestamp;
        state.lastSleep = lastSleepEntry.timestamp;
        state.lastAwake = undefined;
        if (lastSleepEntry.end) {
            state.lastState = "awake";
            state.lastTransition = lastSleepEntry.endtimestamp;
            state.lastAwake = lastSleepEntry.endtimestamp;
        }
    }

    // food data
    var lastFoodEntry = EventLog.findOne({
        activity: "food",
    }, {
        sort: {
            timestamp: -1
        },
        limit: 20
    });
    state.lastFood = lastFoodEntry ? lastFoodEntry.timestamp : undefined;
    return state;
}

var stateIconLookup = {
    awake: "status-state-icon-awake",
    asleep: "status-state-icon-asleep"
}

Template.status.helpers({
    stateIconClass: function() {
        if (Template.instance() && Template.instance().state) {
            var state = Template.instance().state.get();
            if (state) {
                return stateIconLookup[state.lastState];
            }
        }
    },
    stateTextTimer: function() {
        if (Template.instance() && Template.instance().state) {
            var state = Template.instance().state.get();
            if (state) {
                var now = Session.get("now");
                var then = state.lastTransition;
                var timer = moment(now).diff(moment(then));
                return moment.utc(timer).format("HH:mm:ss");
            }
        }
    },
    stateText: function() {
        if (Template.instance() && Template.instance().state) {
            var state = Template.instance().state.get();
            if (state) {
                var outputText;
                if (state.lastState == "awake")
                    outputText = "Awake since ";
                else
                    outputText = "Asleep since ";

                return outputText + moment(state.lastTransition).format("HH:mm");
            }
        }
    },
    stateTextDuration: function() {
        if (Template.instance() && Template.instance().state) {
            var state = Template.instance().state.get();
            if (state) {
                var timeSince = moment(state.lastTransition).from(Session.get('now'));

                if (timeSince)
                    return "(About " + timeSince + ")";
            }
        }
    },
    totalSleep: function() {
        if (Template.instance() && Template.instance().state) {
            var state = Template.instance().state.get();
            if (state && state.totalSleep)
                return "Slept " + moment.utc(state.totalSleep).format("HH:mm") + " today";
        }
    },
    totalFood: function() {
        if (Template.instance() && Template.instance().state) {
            var state = Template.instance().state.get();
            if (state && state.totalSleep)
                return "Eaten " + state.totalFood + " times";
        }
    },
    lastFood: function() {
        if (Template.instance() && Template.instance().state) {
            var state = Template.instance().state.get();
            if (state && state.lastFood)
                return "Last ate " + moment.utc(state.lastFood).from(Session.get('now'));
        }
    },
    foodIcons: function() {
        if (Template.instance() && Template.instance().state) {
            foodIcons = [];
            var foodEvents = EventLog.find({
                activity: "food"
            }, {
                sort: {
                    timestamp: -1
                }
            }).fetch();
            foodEvents.forEach(function(foodEvent) {
                foodWords = foodEvent.label.split(" ");
                foodWords.forEach(function(foodWord) {
                    var foodIconClass = LogIconTable[foodWord];
                    if (foodIconClass)
                        foodIcons.push({
                            iconclass: foodIconClass
                        });
                })
            })
        }
        return foodIcons;
    }
});
