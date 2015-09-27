var sheetHandle;
var sheetIsLoading;
var sheetLoadHandle;
var sheetPollHandle;
var isSyncing;
Meteor.startup(function() {
    ClearMessages();
    Meteor.call("dbLoadSheet");
    Meteor.call("dbStartSyncSheet");
});
Meteor.methods({
    dbLoadSheet: function() {
        AddMessage("loading sheet...", "dbLoadSheet");
        loadSheet();
    },
    IsSheetReady: function() {
        return (sheetHandle === undefined);
    },
    dbStartSyncSheet: function() {
        AddMessage("Starting sync...", "dbStartSyncSheet");
        if (!sheetLoadHandle) sheetLoadHandle = Meteor.setInterval(loadSheet, 3000000); // login every 50 minutes
        if (!sheetPollHandle) sheetPollHandle = Meteor.setInterval(fetchSheetData, 30000); // get sheet every 30 seconds
    },
    dbStopSyncSheet: function() {
        AddMessage("Stopping sync...", "dbStopSyncSheet");
        if (sheetPollHandle) {
            Meteor.clearInterval(sheetPollHandle);
            sheetPollHandle = undefined;
        }
    },
    dbIsSyncing: function() {
        if (sheetPollHandle) {
            return true;
        }
        return false;
    },
    dbClearData: function() {
        AddMessage("Clearing eventlog.", "dbClearData");
        EventLog.remove({});
    },
    dbGetData: function() {
        if (!sheetHandle) {
            AddMessage("Loading sheet before getting data.", "dbGetData");
            Meteor.call("dbLoadSheet");
        }
        try {
            AddMessage("Getting sheet data...", "dbGetData");
            fetchSheetData();
        } catch (err) {
            AddMessage(err, "dbGetData");
        }
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
            AddMessage(err, "loadSheet");
            throw err;
        } else {
            AddMessage("sheet loaded.", "loadSheet");
            sheetHandle = spreadsheet;
            sheetIsLoading = false;
        }
    });
}

function fetchSheetData() {
    if (!sheetHandle) {
        throw "Cannot fetch Google sheet -- Sheet not loaded.";
    }
    if (isSyncing) {
        throw "Already syncing -- aborting fetch.";
    }
    var importSheetDataFunc = Meteor.wrapAsync(sheetHandle.receive, sheetHandle);
    importSheetDataFunc({
        getValues: true
    }, importAndParseSheetData);
}

function importAndParseSheetData(err, row, info) {
    importSheetData(err, row, info);
    parseSheetData();
}

function importSheetData(err, rows, info) {
    if (err) {
        AddMessage(err, "importSheetData");
        throw err;
    }
    if (isSyncing) {
        AddMessage("Aborted import -- already syncing.", "importSheetData");
        throw "Already syncing -- aborting import.";
    }
    isSyncing = true;
    SheetData.remove({});
    var data = _.values(rows);
    var numRows = data.length;
    var reportEvery = 100;
    data.forEach(function(rowitem, rowindex, rowarray) {
        var numRowsImported = rowindex + 1;
        if (numRowsImported % reportEvery == 0 || numRowsImported == numRows) {
            AddMessage("Imported " + (numRowsImported) + " of " + numRows + " rows.", "importSheetData");
            reportEvery = reportEvery * 3;
        }
        var rowObject = {
            time: rowitem[1],
            end: rowitem[2],
            activity: rowitem[3],
            label: rowitem[4],
            amount: rowitem[5],
            score: rowitem[6],
            date: rowitem[7],
            timestamp: rowitem[8],
            endtimestamp: rowitem[9],
            id: rowitem[10],
        };
        SheetData.insert(rowObject);
    });
    isSyncing = false;
}

function parseSheetData() {
    if (isSyncing) {
        AddMessage("Aborted parse -- already syncing.", "parseSheetData");
        throw "Already syncing -- aborting parse.";
    }
    isSyncing = true;
    var data = SheetData.find({}, {
        sort: {
            id: 1
        }
    }).fetch();
    var numRows = data.length;
    var reportEvery = 100;
    data.forEach(function(rowitem, rowindex, rowarray) {
        var numRowsImported = rowindex + 1;
        if (numRowsImported % reportEvery == 0 || numRowsImported == numRows) {
            AddMessage("Processed " + numRowsImported + " of " + numRows + " rows.", "parseSheetData");
            reportEvery = reportEvery * 3;
        }
        // skip on incomplete data
        if (!rowitem.activity || !rowitem.time || !rowitem.date) {
            isSyncing = false;
            return;
        }
        // stupid validity checking
        var dateSanityCheck = Date.parse(rowitem.timestamp);
        if (isNaN(dateSanityCheck)) return;
        var parsedTimestamp = moment.tz(rowitem.timestamp, "Europe/Stockholm");
        if (!parsedTimestamp.isValid()) {
            AddMessage("Skipped row " + rowitem.id + " -- " + parsedTimestamp + " is an invalid timestamp.", "parseSheetData");
            isSyncing = false;
            return;
        }
        var timestampDate = new Date(parsedTimestamp);
        var logEntry = {
            activity: rowitem.activity,
            label: rowitem.label,
            amount: rowitem.amount,
            score: rowitem.score,
            time: rowitem.time,
            end: rowitem.end,
            date: rowitem.date,
            timestamp: timestampDate,
            timestampformatted: moment(timestampDate).format("ddd MMM DD, YYYY"),
            id: rowitem.id,
        };
        if (rowitem.endtimestamp) {
            var parsedEndTimestamp = moment.tz(rowitem.endtimestamp, "Europe/Stockholm");
            if (parsedEndTimestamp.isValid()) {
                logEntry.endtimestamp = new Date(parsedEndTimestamp);
                logEntry.duration = moment.utc(logEntry.endtimestamp - logEntry.timestamp).format("HH:mm");
            }
        }
        EventLog.upsert({
            id: logEntry.id
        }, logEntry, {
            upsert: true
        });
    });
    isSyncing = false;
    AddMessage("Finished!", "parseSheetData");
}

function sendLogEntry(row, newLogEntry) {
    var newLogEntryBuilder = {};
    newLogEntryBuilder[row] = newLogEntry;
    sheetHandle.add(newLogEntryBuilder);
    console.log(newLogEntryBuilder);
    sheetHandle.send({
        autoSize: true
    }, function(err) {
        if (err) {
            AddMessage(err, "sendLogEntry");
            throw err;
        }
    });
}
