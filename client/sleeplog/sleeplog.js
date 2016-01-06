Template.sleeplog.onCreated(function() {
	let instance = this;
	instance.sleepData = new ReactiveVar([]);
	instance.getData = function() {
		return SleepRows.get();
	}
	instance.autorun(() => {
		instance.subscribe("sleeplog");
		let sleepRows = getSleepRows(EventLog);
		let sleepGroups = renderSleepRows(sleepRows);
		let sleepData = [];
		_(sleepGroups).each((item) => {
			let frmDate = Date.UTC(item.date.year(), item.date.month(), item.date.date());
			sleepData.push([frmDate, item.sleep.asMilliseconds()]);
		});
		instance.sleepData.set(sleepData);
	});
});

Template.sleeplog.onRendered(function() {
	let instance = this;
	instance.chart = new Highcharts.Chart("chart_id", {
		chart: {
			type: "spline",
			zoomType: "xy",
		},
		legend: {
			align: 'left',
			verticalAlign: 'top',
			floating: true
		},
		title: {
			text: 'Total sleep hours',
		},
		tooltip: {
			formatter: function() {
				let dateFmt = moment(this.x).format("YYYY-MM-DD");
				let sleepFmt = moment.duration(this.y).format("HH:mm");
				return `<b>${this.series.name}<br/>Date: ${dateFmt}<br/>Sleep: ${sleepFmt}`;
			}
		},

		xAxis: {
			type: "datetime",
			title: {
				text: "Date",
			},
			dateTimeLabelFormats: { // don't display the dummy year
				month: '%Y-%m-%d',
				year: '%Y'
			},
		},
		yAxis: {
			type: "datetime",
			title: {
				text: "Hours",
			},
			labels: {
				formatter: function() {
					let dateMmt = moment.duration(this.value);
					return dateMmt.format("HH:mm");
				},
			},
		},
		plotOptions: {
			series: {
				turboThreshold: 0,
			}
		},
		series: [{
			name: "Sleep",
			data: [],
			id: "sleepdata",
		}, {
			name: "Average sleep",
			type: "trendline",
			linkedTo: "sleepdata",
			algorithm: "SMA",
			periods: 30,
		}]
	});
	instance.autorun(() => {
		if (instance.subscriptionsReady()) {
			let newData = instance.sleepData.get();
			if (instance.chart.series.length == 0)
				instance.chart.addSeries(newData);
			else
				instance.chart.series[0].setData(newData);
		}
	});
});

function renderSleepRows(cursor) {
	let sleepData = cursor.fetch();
	let sleepGroups = [];
	let groupedSleepData = _(sleepData).groupBy("date");
	let summedSleepData = _(groupedSleepData).map(function(dateGroup, date) {
		let dateMmt = moment.utc(date);
		return {
			date: dateMmt,
			sleep: _(dateGroup).reduce(function(sum, dateRow) {
				let newSum = moment.duration(sum);
				let sleep = moment.duration(dateRow.duration, "HH:mm");
				newSum.add(sleep);
				return newSum;
			}, moment.duration(0))
		}
	});
	return summedSleepData;
}
