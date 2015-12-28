Template.sleepchart.onCreated(function() {
    var instance = this;
    instance.chartdata = new ReactiveVar({});
    instance.sleepData = function() {
        var chartdata = instance.chartdata.get();
        var sleepEvents = instance.events().fetch();
        var groupedSleepEvents = _.groupBy(sleepEvents, "date");
        _.each(groupedSleepEvents, function(events) {
            _.each(events, function(event) {
                var timestamp = moment(event.timestamp);
                var startOfDay = moment(event.date, "YYYY-MM-DD");
                var elapsedTime = +timestamp.diff(startOfDay);
                if (!chartdata.lowerBound || elapsedTime < chartdata.lowerBound) {
                    chartdata.lowerBound = elapsedTime;
                }
                if (!event.endtimestamp) return;
                var endtimestamp = moment(event.endtimestamp);
                var elapsedEndTime = +endtimestamp.diff(startOfDay);
                if (!chartdata.upperBound || elapsedEndTime > chartdata.upperBound) {
                    chartdata.upperBound = elapsedEndTime;
                }
            });
        });
        chartdata.range = chartdata.upperBound - chartdata.lowerBound;
        var sleepRows = [];
        _.each(groupedSleepEvents, function(dateGroup, date) {
            var sleepRow = [];
            _.each(dateGroup, function(dateEvent) {
                var startOfDay = moment(dateEvent.date, "YYYY-MM-DD");
                var start = +moment(dateEvent.timestamp).diff(startOfDay);
                var duration;
                var isEstimate;
                if (dateEvent.duration) {
                    duration = moment.duration(dateEvent.duration, "HH:mm");
                } else {
                    duration = moment.duration(instance.chartPrefs.getPref(dateEvent.activity, dateEvent.label, "estimate"), "HH:mm");
                    isEstimate = true;
                }
                var positionPercentage = ((start - +chartdata.lowerBound) / chartdata.range) * 100;
                var widthPercentage = (duration) ? (duration.asMilliseconds() / chartdata.range) * 100 : undefined;
                var row = {
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
            console.log("subscribe");
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
    this.options = new ReactiveVar({
        showstarttimes: {
            label: "Starts",
            type: "checkbox",
            value: true,
        },
        showdurations: {
            label: "Durations",
            type: "checkbox",
            value: false,
        },
        showendtimes: {
            label: "Ends",
            type: "checkbox",
            value: true,
        },
    });
    instance.chartPrefs = {
        getPref: function(activity, label, pref) {
            var foundPref = this["default"][pref];
            if (this[activity]) {
                foundPref = this[activity]["default"][pref];
                if (this[activity][label]) {
                    foundPref = this[activity][label][pref];
                }
            }
            return foundPref;
        },
        "default": {
            colorClass: "color-default",
            estimate: "00:30",
        },
        "sleep": {
            "default": {
                colorClass: "color-sleep-default",
                estimate: "01:00",
            },
            "nap 1": {
                colorClass: "color-sleep-nap1",
                estimate: "02:00",
            },
            "nap 2": {
                colorClass: "color-sleep-nap2",
                estimate: "01:30",
            },
            "night": {
                colorClass: "color-sleep-night",
                estimate: "10:30",
            },
        },
    };
});
Template.sleepchart.onRendered(function() {
    var instance = this;
    Session.set("now", moment().toISOString());
    instance.secondTimer = Meteor.setInterval(function() {
        Session.set("now", moment().toISOString());
    }, 30000);
});
Template.sleepchart.onDestroyed(function() {
    var instance = this;
    if (instance.secondTimer) instance.clearInterval(instance.secondTimer);
});
Template.sleepchart.helpers({
    options: function() {
        var options = Template.instance().options.get();
        var keys = _.keys(options);
        var optionsArray = [];
        keys.forEach(function(item, index, array) {
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
        var instance = Template.instance();
        return instance.sleepData();
    },
    loadMore: function() {
        var instance = Template.instance();
        return instance.events().count() >= instance.numFetched.get();
    }
});
Template.sleepchart.events({
    "mouseenter .sleepchart-row-event": function(e, tpl) {
        $(e.currentTarget).addClass("mod-hilight");
        var targetDiv = $(e.currentTarget);
        Session.set("tooltipInfo", {
            pos: {
                left: (targetDiv.offset().left - $(window).scrollLeft()) + (targetDiv.outerWidth() / 2) - 18 + "px",
                top: targetDiv.offset().top - $(window).scrollTop() - 18 + "px"
            },
            data: this.data,
        });
    },
    "mouseleave .sleepchart-row-event": function(e, tpl) {
        $(e.currentTarget).removeClass("mod-hilight");
        Session.set("tooltipInfo", undefined);
    },
    "click .js-loadmore": function() {
        var instance = Template.instance();
        var limit = instance.limit.get() + instance.numDays;
        instance.limit.set(limit);
    },
    "click .js-loadall": function() {
        Template.instance().limit.set(0);
    },
});
