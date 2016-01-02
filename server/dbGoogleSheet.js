Meteor.startup(function() {
    ClearMessages();
    AddMessage("Starting up.---------------------------------------------------", "Meteor.startup");
    initSheetLoader();
    EventLog._ensureIndex({
        id: 1
    }, {
        unique: true
    });
});
Meteor.methods({
    dbLoadSheetData: () => {
        loadSheetData();
    },
    dbClearData: () => {
        AddMessage("Clearing eventlog.", "dbClearData");
        EventLog.remove({});
    },
});

let SheetLoaderHandle;
let SheetHandle;
let spreadsheetLoaderOptions;
let SheetLoginHandle;
let SheetLoginTimer;
let SheetSyncTimer;

function initSheetLoader() {
    AddMessage("Initializing sheet loader.", "initSheetLoader");
    SheetLoaderHandle = Meteor.npmRequire('edit-google-spreadsheet');
    spreadsheetLoaderOptions = JSON.parse(Assets.getText("luddelogg-auth.json"));
    loadSheetData();
    if (!SheetLoginTimer)
        SheetLoginTimer = Meteor.setInterval(loadSheetData, 3000000); // login every 50 minutes
}

function loadSheetData() {
    AddMessage("Loading...", "loadSheetData");
    let wrapSpreadsheetLoad = Meteor.wrapAsync(SheetLoaderHandle.load, SheetLoaderHandle);
    wrapSpreadsheetLoad(spreadsheetLoaderOptions, function(err, sheetHandle) {
        if (err) {
            AddMessage(err, "loadSheet");
            throw err;
        }
        SheetHandle = sheetHandle;
        if (!SheetSyncTimer)
            SheetSyncTimer = Meteor.setTimeout(fetchSheetData, 3000);
    });
}

function fetchSheetData() {
    if (!SheetHandle) {
        throw "Cannot fetch Google sheet -- Sheet not loaded.";
    }
    if (isSyncing("fetchSheetData")) {
        let message = "Aborted fetch -- already syncing.";
        AddMessage(message, "fetchSheetData");
        throw message;
    }
    AddMessage("Requesting sheet data...", "fetchSheetData");
    startSync("fetchSheetData");
    var importSheetDataFunc = Meteor.wrapAsync(SheetHandle.receive, SheetHandle);
    importSheetDataFunc({
        getValues: true
    }, importAndParseSheetData);
}

function importAndParseSheetData(err, row, info) {
    AddMessage("Importing sheet data...", "importAndParseSheetData");
    try {
        parseSheetData(err, row, info);
    } catch (e) {
        AddMessage(JSON.stringify(e), "importAndParseSheetData");
    }
    stopSync("importAndParseSheetData");
}

function parseSheetData(err, rows, info) {
    if (err) {
        throw err;
    }
    var data = _.values(rows);
    var numRows = data.length;
    var reportEvery = 100;
    data.forEach(function(sheetRow, rowindex, rowarray) {
        var numRowsImported = rowindex + 1;
        if (numRowsImported % reportEvery == 0 || numRowsImported == numRows) {
            AddMessage("Imported " + (numRowsImported) + " of " + numRows + " rows.", "parseSheetData");
            reportEvery = reportEvery * 3;
        }
        var rowObject = {
            time: sheetRow[1],
            end: sheetRow[2],
            activity: sheetRow[3],
            label: sheetRow[4],
            amount: sheetRow[5],
            score: sheetRow[6],
            date: sheetRow[7],
            timestamp: sheetRow[8],
            endtimestamp: sheetRow[9],
            id: sheetRow[10],
        };
        // skip on incomplete data
        if (!rowObject.activity || !rowObject.time || !rowObject.date) {
            return;
        }
        // stupid validity checking
        var dateSanityCheck = Date.parse(rowObject.timestamp);
        if (isNaN(dateSanityCheck)) return;
        var parsedTimestamp = moment.tz(rowObject.timestamp, "Europe/Stockholm");
        if (!parsedTimestamp.isValid()) {
            AddMessage("Skipped row " + rowObject.id + " -- " + parsedTimestamp + " is an invalid timestamp.", "parseSheetData");
            return;
        }
        var timestampDate = new Date(parsedTimestamp);
        var logEntry = {
            activity: rowObject.activity,
            label: rowObject.label,
            amount: rowObject.amount,
            score: rowObject.score,
            time: rowObject.time,
            end: rowObject.end,
            date: rowObject.date,
            timestamp: timestampDate,
            timestampformatted: moment(timestampDate).format("ddd MMM DD, YYYY"),
            id: rowObject.id,
        };
        if (rowObject.endtimestamp) {
            var parsedEndTimestamp = moment.tz(rowObject.endtimestamp, "Europe/Stockholm");
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
    SheetSyncTimer = Meteor.setTimeout(fetchSheetData, 60000); // sync every 30s
}
let syncStatus = new ReactiveVar(false);

function startSync(origin) {
    syncStatus.set(true);
}

function stopSync(origin) {
    syncStatus.set(false);
}

function isSyncing(origin) {
    let rslt = syncStatus.get();
    return rslt;
}
