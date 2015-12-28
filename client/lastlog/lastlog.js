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
Template.lastlog.onCreated(function() {
    var instance = this;
    instance.lastlogData = new ReactiveVar({});
    instance.getEntries = () => {
        return renderEntries(instance.lastlogData.get().fetch());
    };
    instance.autorun(function() {
        var logSub = instance.subscribe("logToday", moment().toDate(), function() {
            instance.lastlogData.set(getToday(EventLog, moment().toDate()));
            console.log("today fetched");
        });
    });
});
Template.lastlog.helpers({
    logEntryGroups: function() {
        let instance = Template.instance();
        return instance.getEntries();
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
