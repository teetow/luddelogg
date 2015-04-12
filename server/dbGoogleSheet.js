var sheetHandle;
var sheetIsLoading;
var sheetLoadHandle;
var sheetPollHandle;
Meteor.startup(function() {
    Meteor.call("dbLoadSheet");
    Meteor.call("dbStartSyncSheet");
});
Meteor.methods({
    dbLoadSheet: function() {
        loadSheet();
    },
    IsSheetReady: function() {
        return (sheetHandle === undefined);
    },
    dbStartSyncSheet: function() {
        if (!sheetLoadHandle) sheetLoadHandle = Meteor.setInterval(loadSheet, 3000000); // login every 50 minutes
        if (!sheetPollHandle) sheetPollHandle = Meteor.setInterval(pollSheet, 30000); // get sheet every 30 seconds
    },
    dbStopSyncSheet: function() {
        if (sheetPollHandle) {
            Meteor.clearInterval(sheetPollHandle);
            sheetPollHandle = undefined;
        }
    },
    dbIsSyncing: function() {
        if (sheetPollHandle) return true;
        return false;
    },
    dbClearData: function() {
        EventLog.remove({});
    },
    dbGetData: function() {
        if (!sheetHandle) Meteor.call("dbLoadSheet");
        pollSheet();
    },
    dbSyncData: function() {
        Meteor.call("dbLoadSheet");
        pollSheet();
    },
    dbAddEntry: function(newLogInfo) {
        // not enabled yet
        /*
                if (!sheetHandle)
                    throw "Cannot sync to sheet -- sheet not loaded.";
                sheetHandle.metadata(function(err, metadata) {
                    if (err) throw err;

                    var newLogEntry = {
                        1: newLogInfo.activity, //activity
                        2: newLogInfo.label, // label
                        3: moment().format("HH:mm:ss"), // start
                        4: newLogInfo.end ? newLogInfo.end : "", // end
                        5: moment().format("YYYY-MM-DD") // date
                    };

                    sendLogEntry(metadata.rowCount + 1, newLogEntry);
                });
        */
    },
});

function loadSheet() {
    sheetIsLoading = true;
    var spreadsheet = Meteor.npmRequire('edit-google-spreadsheet');
    var spreadsheetLoaderOptions = JSON.parse(Assets.getText("luddelogg-auth.json"));
    var spreadsheetLoader = Meteor.wrapAsync(spreadsheet.load, spreadsheet);
    spreadsheetLoader(spreadsheetLoaderOptions, function(err, spreadsheet) {
        if (err) {
            throw err;
        } else {
            sheetHandle = spreadsheet;
        }
    });
}

function pollSheet() {
    if (!sheetHandle) throw "Cannot poll Google sheet -- Sheet not loaded.";
    var syncFromSheetFunc = Meteor.wrapAsync(sheetHandle.receive, sheetHandle);
    syncFromSheetFunc({
        getValues: true
    }, syncFromSheet);
}

function syncFromSheet(err, rows, info) {
    if (err) throw err;
    var data = _.values(rows);
    data.forEach(function(rowitem, rowindex, rowarray) {
        var rowObject = {
            activity: rowitem[1],
            label: rowitem[2],
            time: rowitem[3],
            end: rowitem[4],
            date: rowitem[5],
            timestamp: rowitem[6],
            endtimestamp: rowitem[7],
        };
        // skip on incomplete data
        if (!rowObject.activity || !rowObject.time || !rowObject.date) return;
        // stupid validity checking
        var dateSanityCheck = Date.parse(rowObject.timestamp);
        if (isNaN(dateSanityCheck)) return;
        // var parsedTimestamp = moment(rowObject.timestamp + "+0100", "YYYY-MM-DD HH:mm:ssZZ");
        var parsedTimestamp = moment.tz(rowObject.timestamp, "Europe/Stockholm");
        if (!parsedTimestamp.isValid()) {
            console.log(parsedTimestamp + " is an invalid timestamp.");
            return;
        }
        var timestampDate = new Date(parsedTimestamp);
        var logEntry = {
            activity: rowObject.activity,
            label: rowObject.label,
            time: rowObject.time,
            end: rowObject.end,
            date: rowObject.date,
            timestamp: timestampDate,
            timestampformatted: moment(timestampDate).format("ddd MMM DD, YYYY"),
        };
        if (rowObject.endtimestamp) {
            // var parsedEndTimestamp = moment(rowObject.endtimestamp + "+0100", "YYYY-MM-DD HH:mm:ssZZ");
            var parsedEndTimestamp = moment.tz(rowObject.endtimestamp, "Europe/Stockholm");
            if (parsedEndTimestamp.isValid()) {
                logEntry.endtimestamp = new Date(parsedEndTimestamp);
                logEntry.duration = moment.utc(logEntry.endtimestamp - logEntry.timestamp).format("HH:mm");
            }
        }
        EventLog.upsert({
            timestamp: logEntry.timestamp
        }, logEntry, {
            upsert: true
        });
    });
}

function sendLogEntry(row, newLogEntry) {
    var newLogEntryBuilder = {};
    newLogEntryBuilder[row] = newLogEntry;
    sheetHandle.add(newLogEntryBuilder);
    console.log(newLogEntryBuilder);
    sheetHandle.send({
        autoSize: true
    }, function(err) {
        if (err) throw err;
    });
}
