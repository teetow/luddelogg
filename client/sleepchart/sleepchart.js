var colors = {
    "nap 1": "#ffa000",
    "nap 2": "#5C6BC0",
    "night": "#4CAF50",
};
var defaultSleepTimes = {
    "nap 1": "02:00",
    "nap 2": "01:30",
    "night": "10:00"
};
Template.sleepchart.onCreated(function() {
    this.subscribe("logSleep");
    Session.set("now", moment().toISOString());
    Meteor.setInterval(function() {
        Session.set("now", moment().toISOString());
    }, 30000);
    this.chartdata = {};
});
Template.sleepchart.helpers({
    sleeprows: function() {
        var chartdata = Template.instance().chartdata;
        var sleepEvents = EventLog.find({
            activity: "sleep"
        }, {
            sort: {
                timestamp: -1
            }
        }).fetch();
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
                if (!chartdata.upperBound || elapsedEndTime > chartdata.upperBound) chartdata.upperBound = elapsedEndTime;
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
                var end = dateEvent.end;
                var duration;
                var isEstimate;
                if (dateEvent.duration) {
                    duration = moment.duration(dateEvent.duration, "HH:mm");
                } else {
                    duration = moment.duration(defaultSleepTimes[dateEvent.label], "HH:mm");
                    end = moment(start).clone().add(duration).format("HH:mm");
                    isEstimate = true;
                }
                var positionPercentage = ((start - +chartdata.lowerBound) / chartdata.range) * 100;
                var widthPercentage = (duration.asMilliseconds() / chartdata.range) * 100;
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
                    width: widthPercentage,
                    color: colors[dateEvent.label],
                    duration: duration.hours() + "h" + duration.minutes() + "m",
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
                left: targetDiv.offset().left + (targetDiv.outerWidth() / 2) - 18 + "px",
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
