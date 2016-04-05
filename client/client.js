import moment from "moment";

LogIconTable = {
    oatmeal: "logicon-food-oatmeal",
    sandwich: "logicon-food-sandwich",
    bottle: "logicon-food-bottle",
    fruit: "logicon-food-fruit",
    meal: "logicon-food-meal",
    snack: "logicon-food-snack",
    nap: "logicon-sleep-nap",
    night: "logicon-sleep-night",
    drops: "logicon-drops",
    toothbrush: "logicon-toothbrush",
};
InputReady = new ReactiveVar(false);
Template.registerHelper("makeDuration", function(duration) {
    return makeDuration(duration);
});

SetDocTitle("Luddelogg");
DocHead.addMeta({name: "apple-mobile-web-app-capable",          content:"yes"});
DocHead.addMeta({name: "apple-mobile-web-app-status-bar-style", content:"default"});
DocHead.addMeta({name: "viewport",                              content:"width=device-width, initial-scale=1"});

DocHead.addLink({rel: "stylesheet", href: "https://fonts.googleapis.com/css?family=Lato", type: "text/css"});
DocHead.addLink({rel: "shortcut icon", href: "favicon/favicon.ico"});

BlazeLayout.setRoot('body');
/* beautify preserve:start */
FlowRouter.route("/",           {action: function(params) {BlazeLayout.render("mainLayout", {content: "dashboard" }); } });
FlowRouter.route("/dashboard",  {action: function(params) {BlazeLayout.render("mainLayout", {content: "dashboard" }); } });
FlowRouter.route("/sleepchart", {action: function(params) {BlazeLayout.render("mainLayout", {content: "sleepchart"}); } });
FlowRouter.route("/sleeplog",   {action: function(params) {BlazeLayout.render("mainLayout", {content: "sleeplog"  }); } });
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
    dbClearData: function() {
        EventLog.remove({});
    },
    dbSyncSheet: function() {},
    dbAddEntry: function(newLogInfo) {},
});

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
