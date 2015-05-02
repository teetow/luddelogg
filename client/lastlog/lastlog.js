Template.lastlog.onCreated(function() {
    this.subscribe("logRecent");
});
Template.lastlog.helpers({
    logentries: function() {
        return EventLog.find({}, {
            sort: {
                timestamp: -1
            },
            limit: 50
        }).fetch();
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
            if (iconentry != undefined) logicons.push({
                iconclass: iconentry
            });
        });
        return logicons;
    }
});
