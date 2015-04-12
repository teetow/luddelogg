Template.sleepchartRow.helpers({
    weekendclass: function() {
        var ts = moment(this.date, "YYYY-MM-DD");
        if (ts.day() == 5 || ts.day() == 6) return "mod-weekend";
    },
    todayclass: function() {
        return isToday(this) ? "mod-today" : "";
    },
    sleepchartEventTemplate: function() {
        if (this.estimate) return "sleepchartEventEstimate";
        return "sleepchartEvent";
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
});
