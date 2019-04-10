const routes = ["2","3","6","9","11","17","21","33","35","39","41","45","47","54","62","72","200","201","205","209","213","217","218","220","223","227","228","232","240","248","307","313","320","354","451","453","454","455","456","460","461","462","463","470","471","472","473","477","500","509","513","516","519","520","525","526","551","603","604","606","608","612","613","616","625","626","627","630","640","645","650","664","665","667","674","675","701","703","704","720","750","805","806","807","811","821","822","830","831","832","833","834","835","836","838","840","841","842","850","862","863","880","901","902","919","920","951","952","953","954","960","962","990","992","2X","35M","F400","F401","F402","F504","F514","F518","F522","F534","F546","F547","F556","F570","F578","F590","F618","F638","F94"]
let ajaxQueue = [];
let ajaxQueueTime = 100;
let count = 0;

var map = L.map('mapid', {preferCanvas: true}).setView([40.862247, -111.909935], 9);
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
	maxZoom: 18,
	id: 'mapbox.streets',
	accessToken: 'pk.eyJ1IjoibWlzYmFjaCIsImEiOiJjamZpcnZ0bXUwMHpyMzNwZmw3NzlzaGR1In0.I5SDAbWV7lnkaK_jCPNLQQ'
}).addTo(map);

// Show Specifict Route
$('.getroute').click(function() {
	getRouteVehicles($('#route').val(), function(vehicles) {
		for (var i = 0; i < vehicles.length; i++) {
			let lat = vehicles[i].vehiclelocation.latitude;
			let lon = vehicles[i].vehiclelocation.longitude;
			let line = vehicles[i].lineref;
			let lineName = vehicles[i].publishedlinename;
			let direction = vehicles[i].directionref;
			L.circleMarker([lat, lon], {color: '#3388ff', radius: 3}).addTo(map).bindPopup(line+' '+lineName+' -> '+direction);
		}
	});
});

// Get ALL active vehicles for ALL routes
$('.getAll').click(function() {
	for (var i = 0; i < routes.length; i++) {
		getRouteVehicles(routes[i], function(vehicles) {
			for (var i = 0; i < vehicles.length; i++) {
				let lat = vehicles[i].vehiclelocation.latitude;
				let lon = vehicles[i].vehiclelocation.longitude;
				let line = vehicles[i].lineref;
				let lineName = vehicles[i].publishedlinename;
				let direction = vehicles[i].directionref;
				L.circleMarker([lat, lon], {color: '#33cc33', radius: 2}).addTo(map).bindPopup(line+' '+lineName+' -> '+direction);
			}
		});
	}
});

// Get ALL vehicle stops
$('.getStops').click(function() {
	$.get('https://raw.githubusercontent.com/misbach/uta/master/misc/uta_20160331/stops.txt', function(rsp) {
		var stops = $.csv.toObjects(rsp);
		$('.count').text(stops.length);
		for (var i = 0; i < stops.length; i++) {
			L.circleMarker([stops[i].stop_lat, stops[i].stop_lon], {color: '#ff9999', radius: 1}).addTo(map).bindPopup(stops[i].stop_name);
		}
	});
});

// Get active vehicles for a route
function getRouteVehicles(id, callback) {
	// let proxy = 'https://crossorigin.me/http://api.rideuta.com/SIRI/SIRI.svc/VehicleMonitor/ByRoute?route='+id+'&onwardcalls=true&usertoken=UNBJGBQBXCW'; 
	// let proxy = 'http://cors-proxy.htmldriven.com/?url='+encodeURIComponent('http://api.rideuta.com/SIRI/SIRI.svc/VehicleMonitor/ByRoute?route='+id+'&onwardcalls=true&usertoken=UNBJGBQBXCW'); 
	let proxy = 'https://cors-anywhere.herokuapp.com/http://api.rideuta.com/SIRI/SIRI.svc/VehicleMonitor/ByRoute?route='+id+'&onwardcalls=true&usertoken=UNBJGBQBXCW'; 
	let url = proxy;
	ajaxQueue.push(function() {
		$.get(url, function(rsp) {
			let uta = JXON.build(rsp);
			let vehicles = uta.siri.vehiclemonitoringdelivery.vehicleactivity.monitoredvehiclejourney;
			// Create an empty array for no active vehicles
			if (!vehicles) vehicles = [];
			// Create an array if only ONE active vehicle
			if (vehicles.vehicleref) vehicles = [vehicles];

			console.log(vehicles.length, vehicles);

			count += vehicles.length;
			$('.count').text(count);
			callback(vehicles);
		});
	});
}

// Throttle ajax calls
(function throttleAjax() {
	if (ajaxQueue.length > 0) ajaxQueue.pop()();
	setTimeout(throttleAjax, ajaxQueueTime);
})();

// Remove all markers
$('.clearMarkers').click(function() {
	$('.count').text(0);
	map.eachLayer(function (layer) {
		if (!layer._container) map.removeLayer(layer);
	});
});