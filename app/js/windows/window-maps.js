
var MapsWindow = function(id, parentNode, data) {

	parentNode.css({position: 'relative'});

	var now = new Date(),
		//id = 'maps_' + now.getYear() + '_' + (now.getMonth()+1) + '_' + now.getDate() + '_' + now.getHours() + '_' + now.getMinutes() + '_' + now.getSeconds(),
		loadMapFunctionName = 'loadMap_' + id,
		//header = $('<div id="map-header" style="height: 40px; background: #ddd; padding: 9px;"><input type="text" style="width:100%;" /</div>').appendTo(parentNode),
		
		
		inputMargin = 15,		
		mapSearchInput = $('<input placeholder="Search..." type="text" style="height: 35px; background: #fff; border: solid 0px #333; padding: 8px; position: absolute; top: ' + inputMargin + 'px; left: ' + inputMargin + 'px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); z-index: 2; font-size: 14px;" />').appendTo(parentNode),
		
		//mapSearchInput = header.find('input'),
		
		mapContainer = $('<div class="window-maps" id="' + id + '"></div>').appendTo(parentNode),
		map = null,
		geocoder = null,
		infowindow = null,
		locationData = null;
		

	// bind init method to window object
	window[loadMapFunctionName] = function() {
		var mapOptions = {
			zoom: 8,
			disableDefaultUI: true,
			center: new google.maps.LatLng(data.latitude, data.longitude),
			//mapTypeId: google.maps.MapTypeId.ROADMAP,
			
			mapTypeId: google.maps.MapTypeId.HYBRID,
			mapTypeControl: false,
			mapTypeControlOptions: {
				style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
				position: google.maps.ControlPosition.BOTTOM_CENTER
			},
			panControl: false,
				panControlOptions: {
				position: google.maps.ControlPosition.TOP_RIGHT
			},
			zoomControl: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.LARGE,
				position: google.maps.ControlPosition.LEFT_CENTER
			},
			scaleControl: false,
				scaleControlOptions: {
				position: google.maps.ControlPosition.TOP_LEFT
			},
			streetViewControl: false,
				streetViewControlOptions: {
				position: google.maps.ControlPosition.LEFT_TOP
			}			
		};
		
		map = new google.maps.Map(document.getElementById(id), mapOptions);
			
		google.maps.event.addListener(map, 'center_changed', function() {
		
			var center = map.getCenter();
		
			ext.trigger('settingschange', {
						type:'settingschange', 
						target: this, 
						data: {
							latitude: center.lat(), 
							longitude: center.lng(), 
							label: 'Map: ' + center.lat().toFixed(3) +', ' + center.lng().toFixed(3)
						}
					});
		
		});			
		
			
		geocoder = new google.maps.Geocoder();	
		
		infowindow = new google.maps.InfoWindow({
			content: 'Empty for now'
		});		
		
		
		loadPins();
	}
	
	mapSearchInput.on('keypress', function(e) {
		if (map != null && e.which == 13) {
			
			var search_value = mapSearchInput.val();
			
			
			// find a marker!
			for (var i=0, il=locationData.length; i<il; i++) {
				var location = locationData[i];
				
				if (location.name.toLowerCase().indexOf(search_value.toLowerCase()) > -1) {
					
					openLocation(location);
					
					break;
				}
					
					
			}
			
		
			//console.log('search', search_value);
			/*
			geocoder.geocode( { 'address': search_value}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					map.setCenter(results[0].geometry.location);
					
					var marker = new google.maps.Marker({
						map: map,
						position: results[0].geometry.location
					});									
				}
			});	
			*/		
			
		}
	});
	
	mapContainer.on('click', '.verse', function() {
		var link = $(this),
			sectionid = link.attr('data-sectionid'),
			fragmentid = link.attr('data-fragmentid');
			
		ext.trigger('globalmessage', {
									type: 'globalmessage', 
									target: this, 
									data: {
										messagetype: 'nav', 
										type: 'bible',
										locationInfo: {
											sectionid: sectionid, 
											fragmentid: fragmentid
										}
									}
								});
	
		console.log('clicked', this);
	
	});
	
	// dynamically load map
	if (typeof window.google == 'undefined' ||
		typeof window.google.maps == 'undefined' ||
		typeof window.google.maps.Map == 'undefined') {
		
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=' + loadMapFunctionName;			
		
		document.body.appendChild(script);
	} else {
		// load now!
		window[loadMapFunctionName]
	}
	
	
	function loadPins() {
		
		console.log('MAP: loading pins');
	
		$.ajax({
			url: 'content/maps/maps.json',
			success: function(data) {
			
				locationData = data;
			
				for (var i=0, il=locationData.length; i<il; i++) {
					var location = locationData[i];
					
					(function(location) {
						
						var marker = new google.maps.Marker({
							position: new google.maps.LatLng(location.coordinates[1], location.coordinates[0]),
							map: map,
							title: location.name
						});		
				
						location.marker = marker;
						
						google.maps.event.addListener(marker, 'click', function() {
						
							openLocation(location);
							
						});											
							
					
					})(location);
					
				}			
			}
		});	
	}
	
	function openLocation(location) {
		var verses_html = $.map(location.verses, function(a) {
			var bible_ref = new bible.Reference(a),
				sectionid = bible_ref.bookid + bible_ref.chapter,
				fragmentid = sectionid + '_' + bible_ref.verse1;
		
			return '<span class="verse" style="text-decoration:underline; cursor: pointer" data-sectionid="' + sectionid + '" data-fragmentid="' + fragmentid + '">' + a + '</span>';
		});
		
	
	
	
		infowindow.setContent(
							'<div style="width: 200px; height: 150px; overflow: auto;">' + 
								'<h2>' + location.name + '</h2>' + 
								'<p>' + 
								verses_html.join('; ') + 
								'</p>' + 
							'</div>');						
		infowindow.open(map, location.marker);	
	}
	
	function size(width, height) {
		
		mapSearchInput.outerWidth(width - (inputMargin*2));
	
		mapContainer
				.width(width)
				.height(height); // - header.outerHeight());
	}
	
	function getData() {
		var center = map.getCenter(),
			data = {
				latitude: center.lat(),
				longitude: center.lng()
			};
		
		return data
	}	

	var ext = {
		size: size,
		getData: getData,
		sendMessage: function() {}
	};	
	
	ext = $.extend(true, ext, EventEmitter);
	
	return ext;
}