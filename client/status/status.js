Template.status.onCreated(function() {
    var instance = this;
    Session.set("now", moment().toDate());
    Meteor.setInterval(function getNow() {
        Session.set("now", moment().toDate());
    }, 1000);
    instance.subscribe("logToday", Session.get("now"), function() {
        instance.state = new ReactiveVar();
        instance.state.set(getState(instance.todayEvents()));
    });
    instance.todayEvents = function() {
        return getToday(EventLog, Session.get("now"));
    };
});
Template.status.onDestroyed(function() {
    Meteor.clearInterval(getNow);
});

function getState(todayCollection) {
    var todayEvents = todayCollection.fetch();
    var state = {};
    state.foodEvents = [];
    state.totalSleep = moment.duration(0);
    todayEvents.forEach(function(item) {
        if (item.activity == "sleep") {
            if (!state.lastSleep || item.timestamp > state.lastSleep.timestamp) {
                state.lastSleep = item;
            }
            if (item.endtimestamp) {
                var start = moment.utc(item.timestamp);
                var end = moment.utc(item.endtimestamp);
                var duration = moment.duration(end.diff(start));
                state.totalSleep += duration;
            }
        } else if (item.activity == "food") {
            state.foodEvents.push(item);
            if (!state.lastFood || item.timestamp > state.lastFood.timestamp) {
                state.lastFood = item;
            }
        }
    });
    if (state.lastSleep) {
        state.lastState = "asleep";
        state.lastTransition = state.lastSleep.timestamp;
        state.lastAwake = undefined;
        if (state.lastSleep.endtimestamp) {
            state.lastState = "awake";
            state.lastTransition = state.lastSleep.endtimestamp;
            state.lastAwake = state.lastSleep.endtimestamp;
        }
    }
    return state;
}
var stateIconLookup = {
    awake: "status-state-icon-awake",
    asleep: "status-state-icon-asleep"
};
Template.status.helpers({
    stateIconClass: function() {
        var state = Template.instance().state.get();
        if (state && state.lastState) {
            return stateIconLookup[state.lastState];
        }
    },
    stateTextTimer: function() {
        var state = Template.instance().state.get();
        if (state) {
            var now = Session.get("now");
            var then = state.lastTransition;
            var timer = moment(now).diff(moment(then));
            return moment.utc(timer).format("HH:mm:ss");
        }
    },
    stateText: function() {
        var state = Template.instance().state.get();
        if (state) {
            var outputText;
            if (state.lastState == "awake") outputText = "Awake since ";
            else outputText = "Asleep since ";
            return outputText + moment(state.lastTransition).format("HH:mm");
        }
    },
    stateTextDuration: function() {
        var state = Template.instance().state.get();
        if (state) {
            var timeSince = moment(state.lastTransition).from(Session.get('now'));
            if (timeSince) return "(About " + timeSince + ")";
        }
    },
    totalSleep: function() {
        var state = Template.instance().state.get();
        if (state && state.totalSleep) return "Slept " + moment.utc(state.totalSleep).format("HH:mm") + " today";
    },
    totalFood: function() {
        var state = Template.instance().state.get();
        if (state && state.totalSleep) return "Eaten " + state.foodEvents.length + " times";
    },
    lastFood: function() {
        var state = Template.instance().state.get();
        if (state && state.lastFood) return "Last ate " + moment.utc(state.lastFood.timestamp).from(Session.get('now'));
    },
    foodIcons: function() {
        var state = Template.instance().state.get();
        if (!state || !state.foodEvents) {
            return;
        }
        foodIcons = [];
        state.foodEvents.forEach(function(foodEvent) {
            foodWords = foodEvent.label.split(" ");
            foodWords.forEach(function(foodWord) {
                var foodIconClass = LogIconTable[foodWord];
                if (foodIconClass) foodIcons.push({
                    iconclass: foodIconClass
                });
            });
        });
        return foodIcons;
    }
});
