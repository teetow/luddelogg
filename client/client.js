LogIconTable = {
    oatmeal: "logicon-food-oatmeal",
    sandwich: "logicon-food-sandwich",
    bottle: "logicon-food-bottle",
    meal: "logicon-food-meal",
    nap: "logicon-sleep-nap",
    night: "logicon-sleep-night",
    drops: "logicon-drops",
    toothbrush: "logicon-toothbrush",
};

InputReady = new ReactiveVar(false);

Router.map(function() {
    this.route("/", function(){
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

