/* beautify preserve:start */
let optionsDefaults = {
    showstarttimes: { label: "Starts",    type: "checkbox", value: true,  },
    showdurations:  { label: "Durations", type: "checkbox", value: false, },
    showendtimes:   { label: "Ends",      type: "checkbox", value: true,  },
};
/* beautify preserve:end */
Template.sleepchart.onCreated(function() {
    var instance = this;
    instance.options = new ReactiveVar(optionsDefaults);
    instance.chartPrefs = {
        getPref: function(activity, label, pref) {
            let foundPref = this["default"][pref];
            if (this[activity]) {
                foundPref = this[activity]["default"][pref];
                if (this[activity][label]) {
                    foundPref = this[activity][label][pref];
                }
            }
            return foundPref;
        },
        /* beautify preserve:start */
        "default": {    colorClass: "color-default",        estimate: "00:30", },
        "sleep": {
            "default": {colorClass: "color-sleep-default",  estimate: "01:00", },
            "nap 1":   {colorClass: "color-sleep-nap1",     estimate: "02:00", },
            "nap 2":   {colorClass: "color-sleep-nap2",     estimate: "01:30", },
            "night":   {colorClass: "color-sleep-night",    estimate: "10:30", },
        },
        /* beautify preserve:end */
    };
    instance.chartdata = new ReactiveVar({});
    instance.sleepData = function() {
        return getSleepData(instance);
    };
    instance.numDays = 7;
    instance.limit = new ReactiveVar(instance.numDays);
    instance.numFetched = new ReactiveVar(0);
    instance.autorun(function() {
        var limit = instance.limit.get();
        instance.subscribe("dbEventLog", {
            days: limit
        }, function() {
            instance.numFetched.set(EventLog.find().count());
        });
    })
    instance.events = function() {
        return EventLog.find({}, {
            sort: {
                timestamp: -1
            },
            limit: instance.numFetched.get()
        });
    };
    SetDocTitle("Sleepchart - Luddelogg");
});
Template.sleepchart.onRendered(function() {
    let instance = this;
    Session.set("now", moment().toISOString());
    instance.secondTimer = Meteor.setInterval(() => {
        Session.set("now", moment().toISOString());
    }, 30000);
    instance.$("sleepchart").tooltip({
        position: {
            my: "bottom",
            at: "center",
            collision: "flipfit",
        },
        tooltipClass: "ui__tooltip-sleepchart"
    });
});
Template.sleepchart.onDestroyed(function() {
    let instance = this;
    if (instance.secondTimer) {
        instance.clearInterval(instance.secondTimer);
    }
});
Template.sleepchart.helpers({
    options: function() {
        let options = Template.instance().options.get();
        let keys = _.keys(options);
        let optionsArray = [];
        keys.forEach((item, index, array) => {
            optionsArray.push({
                name: item,
                label: options[item].label,
                type: options[item].type,
                value: options[item].value
            });
        });
        return optionsArray;
    },
    sleepchartOptionTemplate: function() {
        switch (this.type) {
            case "checkbox":
                return "sleepchartOptionCheckbox";
        }
        return "sleepchartOptionGeneric";
    },
    sleepRows: function() {
        let instance = Template.instance();
        return instance.sleepData();
    },
    loadMore: function() {
        let instance = Template.instance();
        return instance.events().count() >= instance.numFetched.get();
    }
});
Template.sleepchart.events({
    "click .js-loadmore": function() {
        let instance = Template.instance();
        let limit = instance.limit.get() + instance.numDays;
        instance.limit.set(limit);
    },
    "click .js-loadall": function() {
        Template.instance().limit.set(0);
    },
});

function getSleepData(instance) {
    let chartdata = instance.chartdata.get();
    let sleepEvents = instance.events().fetch();
    let groupedSleepEvents = _.groupBy(sleepEvents, "date");
    _.each(groupedSleepEvents, function(events) {
        _.each(events, function(event) {
            let timestamp = moment(event.timestamp);
            let startOfDay = moment(event.date, "YYYY-MM-DD");
            let elapsedTime = +timestamp.diff(startOfDay);
            if (!chartdata.lowerBound || elapsedTime < chartdata.lowerBound) {
                chartdata.lowerBound = elapsedTime;
            }
            if (!event.endtimestamp) return;
            let endtimestamp = moment(event.endtimestamp);
            let elapsedEndTime = +endtimestamp.diff(startOfDay);
            if (!chartdata.upperBound || elapsedEndTime > chartdata.upperBound) {
                chartdata.upperBound = elapsedEndTime;
            }
        });
    });
    chartdata.range = chartdata.upperBound - chartdata.lowerBound;
    let sleepRows = [];
    _.each(groupedSleepEvents, function(dateGroup, date) {
        let sleepRow = [];
        _.each(dateGroup, function(dateEvent) {
            let startOfDay = moment(dateEvent.date, "YYYY-MM-DD");
            let start = +moment(dateEvent.timestamp).diff(startOfDay);
            let duration;
            let isEstimate;
            if (dateEvent.duration) {
                duration = moment.duration(dateEvent.duration, "HH:mm");
            } else {
                duration = moment.duration(instance.chartPrefs.getPref(dateEvent.activity, dateEvent.label, "estimate"), "HH:mm");
                isEstimate = true;
            }
            let positionPercentage = ((start - +chartdata.lowerBound) / chartdata.range) * 100;
            let widthPercentage = (duration) ? (duration.asMilliseconds() / chartdata.range) * 100 : undefined;
            let row = {
                // stupid, but I'm lazy
                chartinfo: {
                    startOfDay: startOfDay,
                    lowerBound: chartdata.lowerBound,
                    upperBound: chartdata.upperBound,
                    range: chartdata.range,
                },
                data: dateEvent,
                left: positionPercentage,
                width: widthPercentage ? widthPercentage : undefined,
                colorClass: instance.chartPrefs.getPref(dateEvent.activity, dateEvent.label, "colorClass"),
                duration: (duration) ? duration.hours() + "h" + duration.minutes() + "m" : undefined,
                estimate: (isEstimate) ? true : undefined
            };
            sleepRow.push(row);
        });
        sleepRows.push({
            date: date,
            chartdata: chartdata,
            sleepchartEvents: sleepRow,
        });
    });
    return sleepRows;
}
