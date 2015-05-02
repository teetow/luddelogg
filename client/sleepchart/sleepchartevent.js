Template.sleepchartEventEstimate.helpers({
    estimate: function() {
        var nowMoment = moment(Session.get("now"));
        var chartStart = moment(this.chartinfo.startOfDay);
        var nowTimeOfDay = nowMoment.diff(chartStart);
        var nowPercentage = ((nowTimeOfDay - this.chartinfo.lowerBound) / this.chartinfo.range) * 100;
        return {
            elapsedpos: this.left,
            elapsedwidth: nowPercentage - this.left,
            color: this.color,
            timelinepos: nowPercentage,
            left: nowPercentage,
            width: this.width - (nowPercentage - this.left),
        };
    },
});
Template.sleepchartEvent.helpers({
    options: function() {
        var sleepchartTemplate = Template.instance().closestInstance("sleepchart");
        var optionsObject = sleepchartTemplate.options.get();
        return optionsObject;
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
    iconclass: function() {
        switch (this.data.label) {
            case "bottle":
                return "event-icon-bottle";
            case "meal":
                return "event-icon-meal";
            case "oatmeal":
                return "event-icon-oatmeal";
            case "sandwich":
                return "event-icon-sandwich";
            case "fruit":
                return "event-icon-fruit";
            case "drops":
                return "event-icon-drops";
        }
        return "event-icon-generic";
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
