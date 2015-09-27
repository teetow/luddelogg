LogIconTable = {
    oatmeal: "logicon-food-oatmeal",
    sandwich: "logicon-food-sandwich",
    bottle: "logicon-food-bottle",
    fruit: "logicon-food-fruit",
    meal: "logicon-food-meal",
    nap: "logicon-sleep-nap",
    night: "logicon-sleep-night",
    drops: "logicon-drops",
    toothbrush: "logicon-toothbrush",
};
InputReady = new ReactiveVar(false);
Template.registerHelper("makeDuration", function(duration) {
    return makeDuration(duration);
});
/* beautify preserve:start */
FlowRouter.route("/",           {action: function(params) {BlazeLayout.render("mainLayout", {content: "dashboard" }); } });
FlowRouter.route("/dashboard",  {action: function(params) {BlazeLayout.render("mainLayout", {content: "dashboard" }); } });
FlowRouter.route("/sleepchart", {action: function(params) {BlazeLayout.render("mainLayout", {content: "sleepchart"}); } });
FlowRouter.route("/lastlog",    {action: function(params) {BlazeLayout.render("mainLayout", {content: "lastlog"   }); } });
FlowRouter.route("/input",      {action: function(params) {BlazeLayout.render("mainLayout", {content: "input"     }); } });
FlowRouter.route("/db",         {action: function(params) {BlazeLayout.render("mainLayout", {content: "db"        }); } });
FlowRouter.route("/status",     {action: function(params) {BlazeLayout.render("mainLayout", {content: "status"    }); } });
/* beautify preserve:end */
Meteor.methods({
    addMessage: function(message) {
        AddMessage(message, "addMessage Meteor method");
    },
    clearMessages: function() {},
    dbLoadSheet: function() {},
    dbStartSyncSheet: function() {},
    dbStopSyncSheet: function() {},
    dbIsSyncing: function() {},
    dbClearData: function() {
        EventLog.remove({});
    },
    dbGetData: function() {},
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

function loadChartPackages(packages) {
    Session.set('googleLoaded', false);
    google.load('visualization', '1', {
        packages: packages,
        callback: function() {
            var s = (packages.length > 1) ? "s" : "";
            console.log("package" + s + " loaded: " + packages.toString());
            Session.set('googleLoaded', true);
        }
    });
}
// extend Blaze.View prototype to mimick jQuery's closest for views
_.extend(Blaze.View.prototype, {
    closest: function(viewName) {
        var view = this;
        while (view) {
            if (view.name == "Template." + viewName) {
                return view;
            }
            view = view.parentView;
        }
        return null;
    }
});
// extend Blaze.TemplateInstance to expose added Blaze.View functionalities
_.extend(Blaze.TemplateInstance.prototype, {
    closestInstance: function(viewName) {
        var view = this.view.closest(viewName);
        return view ? view.templateInstance() : null;
    }
});
Template.registerHelper("prettyDate", function(date) {
    if (!date) return "";
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
});
