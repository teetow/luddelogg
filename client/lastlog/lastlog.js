import moment from "moment";

Template.lastlog.onCreated(function() {
    var instance = this;
    instance.subscribe("logToday");
    instance.renderedEntries = new ReactiveVar();
    instance.autorun(() => {
        let events = getToday(EventLog, moment().toDate()).fetch();
        instance.renderedEntries.set(renderEntries(events));
    });
});
Template.lastlog.helpers({
    logEntryGroups: function() {
        let instance = Template.instance();
        return instance.renderedEntries.get();
    },
    logEntryTemplate: function() {
        switch (this.activity) {
            case "food":
                return 'logFood';
            case "sleep":
                if (this.label == "night") return 'logSleep';
                return "logNap";
        }
        return "logDefault";
    },
    logicons: function() {
        var logicons = [];
        var eventlabelwords = this.label.split(" ");
        eventlabelwords.forEach(function(word, wordindex, wordarray) {
            var iconentry = LogIconTable[word];
            if (iconentry !== undefined) logicons.push({
                iconclass: iconentry
            });
        });
        return logicons;
    }
});

function renderEntries(logEntries) {
    var groupedEntries = [];
    $.each(_.groupBy(logEntries, "date"), function(date, entries) {
        var fmtDate = moment(date).format("MMMM Do YYYY");
        var fmtWeekday = moment(date).format("dddd");
        groupedEntries.push({
            date: fmtDate,
            dateWeekday: fmtWeekday,
            logentries: entries
        });
    });
    return groupedEntries;
}
