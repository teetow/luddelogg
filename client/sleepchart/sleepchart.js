Template.sleepchart.onCreated(function() {
    var instance = this;
    instance.chartdata = new ReactiveVar();
    instance.subscribe("dbEventLog");
    instance.events = function(){
        return EventLog.find({}, {
            sort: {
                timestamp: -1
            }
        });
    };    
    this.options = new ReactiveVar({
        showstarttimes: {label: "Start times",  type: "checkbox", value: true, },
        showdurations:  {label: "Durations",    type: "checkbox", value: false, },
        showendtimes:   {label: "End times",    type: "checkbox", value: true, },
        showfood:       {label: "Food",         type: "checkbox", value: true, },
        showsleep:      {label: "Sleep",        type: "checkbox", value: true, },
    });
    this.chartPrefs = {
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
        "default": {color: "#999", estimate: "00:30", },
        "sleep": {
            "default":  {color: "#89f",     estimate: "01:00",},
            "nap 1":    {color: "#ffa000",  estimate: "02:00",},
            "nap 2":    {color: "#5C6BC0",  estimate: "01:30",},
            "night":    {color: "#4CAF50",  estimate: "10:30",},
        },
    };
});
Template.sleepchart.onRendered(function() {
    Session.set("now", moment().toISOString());
    Meteor.setInterval(function secondTimer() {
        Session.set("now", moment().toISOString());
    }, 30000);
});
Template.sleepchart.onDestroyed(function() {
    Meteor.clearInterval(secondTimer);
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
    sleeprows: function() {
        var chartdata = Template.instance().chartdata;
        var sleepEvents = Template.instance().events().fetch();
        var groupedSleepEvents = [];
        $.each(_.groupBy(sleepEvents, "date"), function(date, events) {
            $.each(events, function(index, event) {
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
            groupedSleepEvents.push({
                date: date,
                events: events
            });
        });
        chartdata.range = chartdata.upperBound - chartdata.lowerBound;
        var sleepRows = [];
        groupedSleepEvents.forEach(function(dateCollection) {
            var sleepRow = [];
            dateCollection.events.forEach(function(dateEvent) {
                var startOfDay = moment(dateEvent.date, "YYYY-MM-DD");
                var start = +moment(dateEvent.timestamp).diff(startOfDay);
                var duration;
                var isEstimate;
                if (dateEvent.duration) {
                    duration = moment.duration(dateEvent.duration, "HH:mm");
                } else {
                    duration = moment.duration(Template.instance().chartPrefs.getPref(dateEvent.activity, dateEvent.label, "estimate"), "HH:mm");
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
                    color: Template.instance().chartPrefs.getPref(dateEvent.activity, dateEvent.label, "color"),
                    duration: (duration) ? duration.hours() + "h" + duration.minutes() + "m" : undefined,
                    estimate: (isEstimate) ? true : undefined
                };
                sleepRow.push(row);
            });
            sleepRows.push({
                date: dateCollection.date,
                chartdata: chartdata,
                sleepchartEvents: sleepRow
            });
        });
        return sleepRows;
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
});
