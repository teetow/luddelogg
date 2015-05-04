Template.lastlog.onCreated(function() {
    var instance = this;
    instance.recentEvents = function() {
        return getToday(EventLog);
    };
    instance.subscribe("logToday", moment().toDate());
});
Template.lastlog.helpers({
    logEntryGroups: function() {
        var logEntries = Template.instance().recentEvents().fetch();
        var groupedEntries = [];
        $.each(_.groupBy(logEntries, "date"), function(date, entries) {
            groupedEntries.push({date: date, logentries: entries});
        });

        return groupedEntries;
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
