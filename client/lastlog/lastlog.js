Template.lastlog.created = function() {
    Meteor.subscribe("logRecent",
        function() {
            console.log("subscribing to lastlog");
        });
}

Template.lastlog.helpers({
    logentries: function() {
        return EventLog.find({}, {
            sort: {
                timestamp: -1
            },
            limit: 50
        }).fetch();
    },
    logdescription: function() {
        switch (this.activity) {
            case "food":
                return 'logFood';
            case "sleep":
                if (this.label == "night")
                    return 'logSleep';
                return "logNap";
        }
        return "logDefault";
    },
    logicons: function() {
        var logicons = [];
        var eventlabelwords = this.label.split(" ");
        eventlabelwords.forEach(function(word, wordindex, wordarray) {
            var iconentry = LogIconTable[word];
            if (iconentry != undefined)
                logicons.push({
                    iconclass: iconentry
                });
        });
        return logicons;
    }
});


/*Template.lastlog.created = function() {
    var logentries = this.logentries = new ReactiveVar();
    var querystring = 'https://docs.google.com/spreadsheets/d/1Hwu_DVFvcNDnuiSPryRuCO4rgmD9k91tn7XuVZ0Zk6E/edit#gid=0&range=A:J';
    var query = new google.visualization.Query(querystring);
    query.setRefreshInterval(120);
    var qstr = "select * order by F desc limit 20";
    query.setQuery(qstr);
    query.send(function(response) {
        if (response.isError()) {
            console.log("Error: " + response.getMessage());
        }
        var dataJson = response.getDataTable().toJSON();
        logentries.set(JSON.parse(dataJson));
    });
};

function parseGoogleDataTable(dataTable) {
    var formattedDataTable = [];
    dataTable.rows.forEach(function(rowitem, rowindex, rowarray) {
        var r = rowitem.c;
        var row = {
            activity: r[0] ? r[0].v : undefined,
            label: r[1] ? r[1].v : undefined,
            time: r[2] ? r[2].f : undefined,
            end: r[3] ? r[3].f : undefined,
            duration: r[6] ? moment(r[6].f).subtract(moment(r[5].f)).format("HH:mm"): undefined,
            timestamp: moment(r[5]),
            timestampformatted: r[5] ? moment(r[4].f).format("ddd, MMM D") : undefined,
            endtimestamp: r[6] ? moment(r[6].f) : undefined,
        };
        formattedDataTable.push(row);
    });
    return formattedDataTable;
}
*/
