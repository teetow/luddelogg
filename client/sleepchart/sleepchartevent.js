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
Template.sleepchartEvent.onRendered(function() {
    var $parentDiv = $(this.$(".sleepchart-row-event")[0]);
});
Template.sleepchartTooltip.helpers({
    tooltipinfo: function() {
        var tooltipinfo = Session.get("tooltipInfo");
        if (tooltipinfo) {
            return tooltipinfo;
        }
    },
});
