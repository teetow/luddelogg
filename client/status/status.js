Template.status.onCreated(function() {
    let instance = this;
    instance.state = new ReactiveVar();
    instance.todayEvents = function() {
        return getToday(EventLog, Session.get("now"));
    };
    instance.timer = Meteor.setInterval(function() {
        Session.set("now", moment().toDate());
    }, 1000);
    instance.subscribe("logToday", Session.get("now"));
    instance.autorun(function() {
        instance.state.set(getState(instance.todayEvents()));
    });
    instance.stateText = new ReactiveVar();
    instance.autorun(() => {
        let state = instance.state.get();
        let stateText = {};
        if (state.lastState) {
            stateText = `Ludvig is ${state.lastState}`;
            if (state.lastState == SleepState.awake) 
                stateText = `${stateText}!`;
        } else {
            stateText = "Ludvig is...";
        }
        instance.stateText.set(stateText);
    });
    instance.autorun(() => {
        // reactive doc title
        if (instance.stateText.get()) SetDocTitle(`${instance.stateText.get()} - Luddelogg`, "Status - Luddelogg");
    });
});
Template.status.onDestroyed(function() {
    var instance = this;
    Meteor.clearInterval(instance.timer);
});
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
        let instance = Template.instance();
        return instance.stateText.get();
    },
    stateTextTransition: function() {
        var state = Template.instance().state.get();
        if (state) {
            var outputText;
            if (state.lastState == SleepState.awake) outputText = "Awake since ";
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
        if (state && state.totalSleep) return "Slept " + makeDuration(state.totalSleep) + " today";
    },
    totalFood: function() {
        var state = Template.instance().state.get();
        if (state && state.totalSleep) return "Eaten " + state.foodEvents.length + " times";
    },
    lastFoodIconClass: function() {
        var state = Template.instance().state.get();
        if (state && state.lastFood) {
            var iconClass = LogIconTable[state.lastFood.label];
            return iconClass;
        }
    },
    lastFood: function() {
        var state = Template.instance().state.get();
        if (state && state.lastFood) {
            return moment.utc(state.lastFood.timestamp).from(Session.get('now'));
        }
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
        state.lastState = SleepState.asleep;
        state.lastTransition = state.lastSleep.timestamp;
        state.lastAwake = undefined;
        if (state.lastSleep.endtimestamp) {
            state.lastState = SleepState.awake;
            state.lastTransition = state.lastSleep.endtimestamp;
            state.lastAwake = state.lastSleep.endtimestamp;
        }
    }
    return state;
}
var SleepState = {
    "undefined": undefined,
    "awake": "awake",
    "asleep": "asleep",
}
var stateIconLookup = {
    awake: "status-state-icon-awake",
    asleep: "status-state-icon-asleep"
};
