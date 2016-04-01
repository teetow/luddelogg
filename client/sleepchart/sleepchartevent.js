import moment from "moment";

var EventiconTable = {
    bottle: "event-icon-bottle",
    meal: "event-icon-meal",
    oatmeal: "event-icon-oatmeal",
    sandwich: "event-icon-sandwich",
    fruit: "event-icon-fruit",
    drops: "event-icon-drops",
    toothbrush: "event-icon-toothbrush",
};
Template.sleepchartEvent.helpers({
    options: function() {
        var sleepchartTemplate = Template.instance().closestInstance("sleepchart");
        var optionsObject = sleepchartTemplate.options.get();
        return optionsObject;
    },
});
Template.sleepchartEventEstimate.helpers({
    estimate: function() {
        var nowMoment = moment(Session.get("now"));
        var chartStart = moment(this.chartinfo.startOfDay);
        var nowTimeOfDay = nowMoment.diff(chartStart);
        var nowPercentage = ((nowTimeOfDay - this.chartinfo.lowerBound) / this.chartinfo.range) * 100;
        return {
            elapsedpos: this.left,
            elapsedwidth: nowPercentage - this.left,
            colorClass: this.colorClass,
            timelinepos: nowPercentage,
            left: nowPercentage,
            width: this.width - (nowPercentage - this.left),
        };
    },
});
Template.sleepchartGenericEvent.helpers({
    eventclass: function() {
        switch (this.data.activity) {
            case "sleep":
                return "event-sleep";
            case "food":
                return "event-food";
            case "medicine":
                return "event-medicine";
        }
        return "event-generic";
    },
    icons: function() {
        var eventicons = [];
        var eventlabelwords = this.data.label.split(" ");
        eventlabelwords.forEach(function(word, wordindex, wordarray) {
            var iconentry = EventiconTable[word];
            if (iconentry !== undefined) eventicons.push({
                iconclass: iconentry
            });
        });
        return eventicons;
    },
    labelclass: function() {
        switch (this.data.activity) {
            case "sleep":
                return "label-sleep";
            case "food":
                return "label-food";
            case "medicine":
                return "label-medicine";
        }
        return "label-generic";
    },
});
