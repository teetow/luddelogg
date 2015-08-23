Template.db.onCreated(function() {
    this.subscribe("dbEventLog");
});
Template.dbOps.events({
    'click .button-syncnow': function() {
        Meteor.call("dbGetData");
    },
    'click .button-clear': function() {
        Meteor.call("dbClearData");
    },
});
Template.dbLog.helpers({
    dbLogEntries: function() {
        return EventLog.find({}, {
            sort: {
                id: -1
            }
        });
    },
});
Template.dbLogEntry.helpers({
    prettyDate: function(date) {
        if (!date) return "";
        return moment(date).format("YYYY-MM-DD HH:mm:ss");
    }
});
Template.dbInfo.helpers({
    numSheetRows: function() {
        return SheetData.find().count();
    },
    numEventRows: function() {
        return EventLog.find().count();
    },
});
