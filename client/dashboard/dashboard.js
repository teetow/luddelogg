Template.sleeptimes.helpers({
	googleLoaded: function(){
		return Session.equals('googleLoaded', true);
	}
});

Template.charts.rendered = function() {
	if (Session.equals('googleLoaded', true))
	{
		console.log('drawing timeline chart.');
		drawTimeline();
	}
}

function drawTimeline(){
	console.log('requesting data...');
	var groupedLogData = Meteor.call('getGroupedLogData', function(error, result){
		drawTimelineChart(result);
	});
}

function drawTimelineChart(data){
	console.log('drawing chart...');
	var container = document.getElementById('chart-timeline');
	var chart = new google.visualization.Timeline(container);
	var dataTable = new google.visualization.DataTable();

	dataTable.addColumn({ type: 'string', id: 'Day' });
	dataTable.addColumn({ type: 'string', id: 'Activity'})
	dataTable.addColumn({ type: 'datetime', id: 'Start' });
	dataTable.addColumn({ type: 'datetime', id: 'End' });
	data.forEach(function(logitem, logintex, logarray) {
		var date = logitem;
		logitem.entries.forEach(function(entryitem, entryindex, entryarray){
			if (entryitem.event != 'sleep')
				return;
			var calendarDate = new Date(entryitem.calendarDate);
			var eventStart = new Date(entryitem.time);
			var eventEnd = new Date(entryitem.sleepEnd);
			var row = [
				moment(calendarDate).format("YYYY-MM-DD"), 
				entryitem.eventLabel, 
				eventStart, 
				eventEnd
			];
			dataTable.addRow(row);
		});
		var options = {
			
			colors: [
				'#FBC02D',
				'#5C6BC0',
				'#4CAF50'
			], 
			avoidOverlappingGridLines: false,
			timeline: {
				showBarLabels: false
			}
		};
		chart.draw(dataTable, options);
	});
}

function makeTimeOfDay(date){
	return [date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()];
}