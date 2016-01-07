Template.sleeplog.onCreated(function() {
	moment.duration.fn.format.defaults.trim = false;
	let instance = this;
	instance.sleepData = new ReactiveDict([]);
	instance.getData = function() {
		return SleepRows.get();
	}
	instance.autorun(() => {
		instance.subscribe("sleeplog");
		let sleepRows = getSleepRows(EventLog);
		let sleepGroups = calcSleep(sleepRows);
		let totalSleep = [];
		let napSleep = [];
		let nightSleep = [];
		_(sleepGroups).each((item) => {
			let frmDate = Date.UTC(item.date.year(), item.date.month(), item.date.date());
			totalSleep.push([frmDate, item.totalSleep.asMilliseconds()]);
			napSleep.push([frmDate, item.napSleep.asMilliseconds()]);
			nightSleep.push([frmDate, item.nightSleep.asMilliseconds()]);
		});
		instance.sleepData.set("totalSleep", totalSleep);
		instance.sleepData.set("napSleep", napSleep);
		instance.sleepData.set("nightSleep", nightSleep);
	});
});

Template.sleeplog.onRendered(function() {
	let instance = this;
	instance.chart = new Highcharts.Chart("chart_id", {
		chart: {
			type: "areaspline",
			zoomType: "x",
		},
		legend: {
			align: 'left',
			verticalAlign: 'top',
			floating: true
		},
		rangeSelector: {
			enabled: true
		},
		title: {
			text: 'Total sleep hours',
		},
		tooltip: {
			shared: true,
			formatter: formatTooltip,
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
		yAxis: [{
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
			//offset: 0,
		}],
		plotOptions: {
			areaspline: {
				stacking: "normal",
			},
			series: {
				turboThreshold: 0,
			}
		},
		series: [{
			name: "Total sleep",
			id: "totalSleep",
			data: [],
			type: "spline",
			enableMouseTracking: false,
			color: "hsl(37, 100%, 50%)",
		}, {
			name: "Nap sleep",
			id: "napSleep",
			data: [],
			color: "hsl(37, 100%, 50%)",
			lineWidth: 0,
		}, {
			name: "Night sleep",
			id: "nightSleep",
			data: [],
			color: "hsl(122, 39%, 49%)",
			lineWidth: 0,
		}, {
			name: "Average sleep",
			id: "avgSleep",
			type: "trendline",
			linkedTo: "totalSleep",
			algorithm: "SMA",
			yAxis: 0,
			periods: 30,
		}]
	});
	instance.autorun(() => {
		if (instance.subscriptionsReady()) {
			_(instance.chart.series).each((series) => {
				if (series.options.id == "totalSleep")
					series.setData(instance.sleepData.get("totalSleep"));
				else if (series.options.id == "napSleep")
					series.setData(instance.sleepData.get("napSleep"));
				else if (series.options.id == "nightSleep")
					series.setData(instance.sleepData.get("nightSleep"));
			});
		}
	});
    SetDocTitle("Sleeplog - Luddelogg");
});

function formatTooltip() {
	let dateFmt = moment(this.x).format("YYYY-MM-DD");
	let napSleep, nightSleep, totalSleep, avgSleep;

	_(this.points).each((point) => {
		if (point.series.options.id == "napSleep")
			napSleep = moment.duration(point.y);
		else if (point.series.options.id == "nightSleep")
			nightSleep = moment.duration(point.y);
		else if (point.series.options.id == "totalSleep")
			totalSleep = moment.duration(point.y);
		else if (point.series.options.id == "avgSleep")
			avgSleep = moment.duration(point.y);
	});

	if (!totalSleep) {
		totalSleep = moment.duration(nightSleep);
		totalSleep.add(napSleep);
	}

	let out = `<b>${dateFmt}</b>`;
	if (napSleep)
		out += `<br/>Nap: ${napSleep.format("HH:mm")}`;
	if (nightSleep)
		out += `<br/>Night: ${nightSleep.format("HH:mm")}`;
	if (totalSleep)
		out += `<br/>Total: ${totalSleep.format("HH:mm")}`;
	if (avgSleep)
		out += `<br/>Average: ${avgSleep.format("HH:mm")}`;
	return out;
}

function calcSleep(cursor) {
	let sleepData = cursor.fetch();
	let sleepGroups = [];
	let groupedSleepData = _(sleepData).groupBy("date");
	let summedSleepData = _(groupedSleepData).map(function(dateGroup, date) {
		let dateMmt = moment.utc(date);
		let sumSleep = moment.duration(0);
		let sumNap = moment.duration(0);
		let sumNight = moment.duration(0);
		_(dateGroup).map((item) => {
			if (item.label == "night") {
				sumNight.add(moment.duration(item.duration));
			} else {
				sumNap.add(moment.duration(item.duration));
			}
			sumSleep.add(moment.duration(item.duration));
		});
		return {
			date: dateMmt,
			totalSleep: sumSleep,
			nightSleep: sumNight,
			napSleep: sumNap,
		}
	});
	return summedSleepData;
}
