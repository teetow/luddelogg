Template.db.created = function() {
    var isSyncing = this.isSyncing = new ReactiveVar("isSyncing");
    Session.set("dataLoaded", false);

    Meteor.subscribe("dbEventLog", function() {
        console.log("subscription received.");
        Session.set("dataLoaded", true);
    })

    Meteor.call("dbLoadSheet", function() {
        Meteor.call("dbStartSyncSheet");
    });
};

Template.db.helpers({
    dataLoaded: function() {
        return Session.get("dataLoaded");
    },
    isSyncing: function() {
        return Template.instance().isSyncing.get();
    },
});

Template.dbOps.events({
    'click .button-reinit': function() {
        Meteor.call("dbClearData");
        Meteor.call("dbLoadSheet", function() {
            Meteor.call("dbGetData");
        });
    },
    'click .button-syncnow': function() {
        Meteor.call("dbGetData");
    }
});

Template.dbLog.helpers({
    dbLogEntries: function() {
        return EventLog.find({}, {
            sort: {
                timestamp: -1
            }
        });
    },
});
