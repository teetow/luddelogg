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
Router.map(function() {
    this.route("/", function() {
        this.render('dashboard');
    });
    this.route('dashboard');
    this.route('sleep', {
        waitOn: function() {
            return IRLibLoader.load('https://www.google.com/jsapi', {
                success: function() {
                    console.log('API loaded.');
                    loadChartPackages(["timeline"]);
                }
            });
        }
    });
    this.route('sleepchart');
    this.route('lastlog');
    this.route('input');
    this.route('db');
    this.route('status');
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
