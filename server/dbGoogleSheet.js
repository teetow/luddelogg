var sheetHandle;
var sheetIsLoading;
var sheetLoadHandle;
var sheetPollHandle;
var isSyncing;
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
        if (!sheetPollHandle) sheetPollHandle = Meteor.setInterval(fetchSheetData, 30000); // get sheet every 30 seconds
    },
    dbStopSyncSheet: function() {
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
        EventLog.remove({});
    },
    dbGetData: function() {
        if (!sheetHandle) {
            Meteor.call("dbLoadSheet");
        }
        try {
            fetchSheetData();
        } catch (err) {
            throw new Meteor.Error("404", err);
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
            throw err;
        } else {
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
        throw err;
    }
    if (isSyncing) {
        throw "Already syncing -- aborting import.";
    }
    isSyncing = true;
    SheetData.remove({});
    var data = _.values(rows);
    data.forEach(function(rowitem, rowindex, rowarray) {
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
        throw "Already syncing -- aborting parse.";
    }
    isSyncing = true;
    var data = SheetData.find({}, {
        sort: {
            id: 1
        }
    }).fetch();
    data.forEach(function(rowitem, rowindex, rowarray) {
        // skip on incomplete data
        if (!rowitem.activity || !rowitem.time || !rowitem.date) {
            //console.log("no activity, time or date");
            isSyncing = false;
            return;
        }
        // stupid validity checking
        var dateSanityCheck = Date.parse(rowitem.timestamp);
        if (isNaN(dateSanityCheck)) return;
        var parsedTimestamp = moment.tz(rowitem.timestamp, "Europe/Stockholm");
        if (!parsedTimestamp.isValid()) {
            console.log(parsedTimestamp + " is an invalid timestamp.");
            isSyncing = false;
            return;
        }
        var timestampDate = new Date(parsedTimestamp);
        var logEntry = {
            activity: rowitem.activity,
            label: rowitem.label,
            time: rowitem.time,
            end: rowitem.end,
            date: rowitem.date,
            timestamp: timestampDate,
            timestampformatted: moment(timestampDate).format("ddd MMM DD, YYYY"),
        };
        if (rowitem.endtimestamp) {
            var parsedEndTimestamp = moment.tz(rowitem.endtimestamp, "Europe/Stockholm");
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
    isSyncing = false;
    /*
        var calendarDate, fileDate;
        var data = SheetData.find({}, {
            sort: {
                id: 1
            }
        }).fetch();
        data.forEach(function(rowObject, rowindex, rowarray) {
            var prevRowObject;
            if (rowindex >= 1) {
                prevRowObject = rowarray[rowindex - 1];
            }
            if (isNaN(rowObject.id) || !rowObject.activity || !rowObject.time) { // skip on incomplete data
                console.log("skipping", rowObject._id, "because incomplete.");
                isSyncing = false;
                return;
            }
            var timeParsed = moment.tz(rowObject.time, "HH:mm", "Europe/Stockholm");
            var isContinuation = false;
            if (rowObject.date) { // read date directly
                // console.log(rowObject.id, "has a date");
                calendarDate = moment(rowObject.date, "YYYY-MM-DD");
                fileDate = calendarDate.clone();
            } else { // infer from previous
                // console.log(rowObject.id, "has no date");
                if (calendarDate && prevRowObject.time) {
                    prevTimeParsed = moment.tz(prevRowObject.time, "HH:mm", "Europe/Stockholm");
                    if (timeParsed.toDate() < prevTimeParsed.toDate()) {
                        // console.log(rowObject.id, "day skip detected");
                        calendarDate.add(1, "day");
                        if (rowObject.activity == "sleep") {
                            isContinuation = true;
                        }
                    }
                } else {
                    // console.log("no calendardate or prevRowObject.time");
                    isSyncing = false;
                    return;
                }
                if (rowObject.activity == "sleep" && prevRowObject.activity && prevRowObject.activity == rowObject.activity) {
                    isContinuation = true;
                }
                if (!isContinuation) {
                    fileDate = calendarDate.clone();
                }
            }
            var startTimestamp = calendarDate.clone().add(timeParsed);
            var logEntry = {
                activity: rowObject.activity,
                label: rowObject.label,
                time: rowObject.time,
                end: rowObject.end,
                date: fileDate.format("YYYY-MM-DD"),
                timestamp: startTimestamp.toDate(),
                timestampformatted: startTimestamp.format("ddd MMM DD, YYYY"),
                id: rowObject.id,
            };
            if (rowObject.end) {
                var endTimeParsed = moment.tz(rowObject.end, "HH:mm", "Europe/Stockholm");
                var endTimestamp = calendarDate.clone().add(endTimeParsed);
                if (endTimeParsed < timeParsed) { // after midnight
                    endTimestamp.add(1, "day");
                }
                logEntry.endtimestamp = endTimestamp.toDate();
                logEntry.duration = moment.utc(endTimestamp - startTimestamp).format("HH:mm");
            }
            EventLog.upsert({
                timestamp: logEntry.timestamp
            }, logEntry, {
                upsert: true
            });
        });
        isSyncing = false;
        */
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
