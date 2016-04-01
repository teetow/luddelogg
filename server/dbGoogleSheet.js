import moment from "moment";
import "moment-timezone";

Meteor.startup(function() {
    ClearMessages();
    AddMessage("Starting up.................................", "Meteor.startup");
    init();
    startSyncLoop("latest");
    EventLog._ensureIndex({
        id: 1
    }, {
        unique: true
    });
});
Meteor.methods({
    dbSyncSheet: (sheetName) => {
        try {
            AddMessage(`Syncing ${sheetName}`, "dbSyncSheet");
            performSync(sheetName);
        } catch (e) {
            AddMessage(JSON.stringify(e), "dbSyncSheet");
        }
    },
    dbClearData: () => {
        AddMessage("Clearing eventlog.", "dbClearData");
        EventLog.remove({});
    },
});

let LogSheetSyncer = new SheetSyncer();

function init() {
    AddMessage("Initializing...", "initSheetLoader");
    SheetCredentials = JSON.parse(Assets.getText("luddelogg-auth.json")); // could be a collection in the future

    let localOptions = SheetCredentials["latest"];
    if (!localOptions) {
        AddMessage("No valid credentials.", "performSync");
        return;
    }
}

function performSync(sheetName) {
    Meteor.defer(() => {
        LogSheetSyncer.requestData({
            callback: parseSheetData,
            credentials: SheetCredentials[sheetName],
        });
    });
}

function startSyncLoop(sheetName) {
    LogSheetSyncer.requestData({
        callback: parseSheetData,
        credentials: SheetCredentials[sheetName],
        loop: true,
    });
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
