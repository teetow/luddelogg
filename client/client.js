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
Meteor.startup(function() {
    loadGoogleFonts();
});
InputReady = new ReactiveVar(false);
Router.map(function() {
    this.route("/", function() {
        this.render('dashboard');
    });
    this.route('dashboard', {
        waitOn: function() {
            return IRLibLoader.load('https://www.google.com/jsapi', {
                success: function() {
                    console.log('API loaded.');
                    loadChartPackages(["timeline"]);
                }
            });
        }
    });
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

function loadGoogleFonts() {
    WebFontConfig = {
        google: {
            families: ['Roboto:400,300:latin']
        }
    };
    (function() {
        var wf = document.createElement('script');
        wf.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
        wf.type = 'text/javascript';
        wf.async = 'true';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(wf, s);
    })();
}

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
