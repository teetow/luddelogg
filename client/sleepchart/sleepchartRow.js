import moment from "moment";

Template.sleepchartRow.helpers({
    shortdate: function(date) {
        var date = moment(date, "YYYY-MM-DD");
        return date.format("YYYY-MM-DD");
    },
    isWeekend: function() {
        var ts = moment(this.date, "YYYY-MM-DD");
        return (ts.day() === 0 || ts.day() === 6);
    },
    sleepchartEventTemplate: function() {
        if (this.data.activity == "sleep") {
            if (this.estimate) {
                return "sleepchartEventEstimate";
            }
            return "sleepchartEvent";
        }
        return "sleepchartGenericEvent";
    },
    isToday: function() {
        return isToday(this);
    },
    timeindicatorPos: function() {
        var nowMoment = moment(Session.get("now"));
        var rowMidnight = moment(this.date, "YYYY-MM-DD");
        var nowTimeOfDay = nowMoment.diff(rowMidnight);
        return ((nowTimeOfDay - this.chartdata.lowerBound) / this.chartdata.range) * 100;
    },
    now: function() {
        return moment(Session.get("now")).format("HH:mm");
    },
    rowtooltip: function() { 
        let instance = this;

        let totalSleep = moment.duration(0, "hours");
        _.each(this.sleepchartEvents, function(event) {
            if (event.data.activity == "sleep") {
                totalSleep.add(event.data.duration);
            }
        });
        return `Sleep: ${totalSleep.hours()}h${totalSleep.minutes()}m`;
    },
});
