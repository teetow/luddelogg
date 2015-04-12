Template.sleep.helpers({
    googleLoaded: function() {
        return Session.equals('googleLoaded', true);
    },
});

Template.sleepchart_gvis.helpers({
    sleepchartready: function() {
        if (Template.instance() && Template.instance().sleepData && Template.instance().sleepData.get()) {
            return true;
        }
        return false;
    },
    sleepchart_gvis: function() {
        var sleepDataTable = Template.instance().sleepData.get();
        if (sleepDataTable)
            drawSleepChart(sleepDataTable);
    }
});

Template.sleepchart_gvis.created = function() {
    var sleepData = this.sleepData = new ReactiveVar();
    var querystring = 'https://docs.google.com/spreadsheets/d/1Hwu_DVFvcNDnuiSPryRuCO4rgmD9k91tn7XuVZ0Zk6E/edit#gid=0&range=A:G';
    var query = new google.visualization.Query(querystring);
    var qstr = "select * where A = 'sleep' order by F desc";
    query.setQuery(qstr);
    query.setRefreshInterval(120);
    query.send(function(response) {
        if (response.isError()) {
            console.log(response.getMessage());
        }
        sleepData.set(getSleepData(response));
    });
}

Template.sleepchart_gvis.rendered = function() {
    var sleepData = Template.instance().sleepData;
    $(window).resize(function() {
        drawSleepChart(sleepData.get());
    });
}

function getSleepData(response) {
    var dataTable = response.getDataTable();
    var dataView = new google.visualization.DataView(dataTable);

    // show only sleep events
    dataView.setRows(dataView.getFilteredRows(
        [{
            column: 0,
            value: "sleep"
        }, {
            column: 3,
            minValue: "0"
        }]));

    dataView.setColumns(
        [{
            calc: function(t, r) {
                return moment(t.getValue(r, 4)).format("YYYY-MM-DD");
            },
            type: 'string',
            label: 'Date'
        }, {
            calc: function(t, r) {
                return t.getValue(r, 1);
            },
            type: "string",
            label: "Activity"
        }, {
            calc: function(t, r) {
                return moment(moment(t.getValue(r, 5)).diff(moment(t.getValue(r, 4)))).toDate();
            },
            type: 'datetime',
            label: "Start"
        }, {
            calc: function(t, r) {
                return moment(moment(t.getValue(r, 6)).diff(moment(t.getValue(r, 4)))).toDate();
            },
            type: 'datetime',
            label: "End"
        }]);
    return dataView;
}

function drawSleepChart(dataView) {
    console.log('drawing chart...');
    var container = document.getElementById('chart-sleep');
    var chart = new google.visualization.Timeline(container);
    var options = {
        colors: ['#ffa000', '#5C6BC0', '#4CAF50'],
        avoidOverlappingGridLines: false,
        timeline: {
            showBarLabels: false,
            rowLabelStyle: {
                color: '#282828',
                fontName: 'Roboto',
                fontSize: '11px',
            }

        }
    };
    chart.draw(dataView, options);
} 