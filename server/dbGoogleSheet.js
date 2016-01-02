Meteor.startup(function() {
    ClearMessages();
    AddMessage("Starting up.................................", "Meteor.startup");
    init();
    if (SheetLoaderHandle)
        startSyncLoop("latest");
    else {
        AddMessage("Failed to initialize.", "startup");
    }
    EventLog._ensureIndex({
        id: 1
    }, {
        unique: true
    });
});
Meteor.methods({
    dbSyncSheet: (sheetName) => {
        performSync(sheetName);
    },
    dbClearData: () => {
        AddMessage("Clearing eventlog.", "dbClearData");
        EventLog.remove({});
    },
});

let SheetLoaderHandle;
let SheetCredentials;
let SheetLoginTimer;
let SheetSyncTimer;

function init() {
    AddMessage("Initializing...", "initSheetLoader");
    SheetLoaderHandle = Meteor.npmRequire('edit-google-spreadsheet');
    SheetCredentials = JSON.parse(Assets.getText("luddelogg-auth.json")); // could be a collection in the future
}

function performSync(sheetName) {
    let localOptions = SheetCredentials[sheetName];
    if (!localOptions)
        return;
    let sheetHandle = getSheetHandle(localOptions);
    let sheetData = getSheetData(sheetHandle);
    importAndParseSheetData(sheetData);
}

function startSyncLoop(sheetName) {
    let localOptions = SheetCredentials[sheetName];
    if (!localOptions)
        return;
    let sheetHandle = getSheetHandle(localOptions);
    performLoopedSync(sheetHandle);
    if (!SheetLoginTimer)
        SheetLoginTimer = Meteor.setInterval(getSheetHandle, 3000000); // login every 50 minutes
}

function performLoopedSync(sheetHandle) {
    let sheetData = getSheetData(sheetHandle);
    importAndParseSheetData(sheetData);
    SheetSyncTimer = Meteor.setTimeout(() => {
        performLoopedSync(sheetHandle);
    }, 30000); // sync after 30s
}

function getSheetHandle(loaderOptions) {
    AddMessage("Loading...", "getSheetHandle");
    let loadSpreadsheetSync = Meteor.wrapAsync(SheetLoaderHandle.load, SheetLoaderHandle);
    return loadSpreadsheetSync(loaderOptions);
}

function getSheetData(sheetHandle) {
    if (!sheetHandle) {
        throw "Cannot fetch Google sheet -- Sheet not loaded.";
    }
    if (isSyncing("getSheetData")) {
        let message = "Aborted fetch -- already syncing.";
        AddMessage(message, "getSheetData");
        throw message;
    }
    AddMessage("Requesting sheet data...", "getSheetData");
    startSync("getSheetData");
    let importSheetDataFunc = Meteor.wrapAsync(sheetHandle.receive, sheetHandle);
    return importSheetDataFunc({
        getValues: true
    });
}

function importAndParseSheetData(sheetData) {
    AddMessage("Importing sheet data...", "importAndParseSheetData");
    try {
        parseSheetData(sheetData);
    } catch (e) {
        AddMessage(JSON.stringify(e), "importAndParseSheetData");
    }
    stopSync("importAndParseSheetData");
}

function parseSheetData(sheetData) {
    var data = _.values(sheetData);
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
