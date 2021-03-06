var formatTime = function(date) {return moment.utc(date).format('HH:mm')};
var parseIsoTime = moment.utc

function getWidth() {
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
}


var stationDistance = function(stations, station_code) {
  matched_station = stations.find(function(station) { return station.name === station_code } );
  return matched_station.distance
}

var drawGraph = function(data, stations, services, newTimetable, domainStart, domainEnd) {
var topAxis = !newTimetable;
  if (topAxis) {
    var topMargin = 30;
  } else {
    var topMargin = 5;
  }

  var pageWidth = getWidth();
  var margin = {top: topMargin, right: 30, bottom: 20, left:50},
      width = pageWidth - margin.left*2 - margin.right*2;

  width = Math.max(width, 600);
  width = Math.min(width, 900);

  var height = (width / 3) - margin.top - margin.bottom;

  var x = d3.time.scale()
      .domain([parseIsoTime(domainStart), parseIsoTime(domainEnd)])
      .range([0, width]);

  var y = d3.scale.linear()
      .range([0, height]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .ticks(8)
      .tickFormat(formatTime);

  var svg = d3.select(".chart-container").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("text")
   .attr("text-anchor", "middle")
   .attr("transform", `translate(-20,${height/2}) rotate(-90)`)  // centre below axis
   .text(newTimetable ? "New" : "Current")
   .style("font-size", '16px')
   .style('font-weight', 'bold');

  svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("y", -margin.top)
      .attr("x", '-5px')
      .attr("width", width + 10)
      .attr("height", height + margin.top + margin.bottom + 10);

  svg.append("g")
    .attr("class", "grid")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.svg.axis()
        .scale(x)
        .ticks(8).tickSize(-height, 0, 0).tickFormat(""))

  y.domain(d3.extent(stations, function(d) { return d.distance; }));

  var station = svg.append("g")
      .attr("class", "station")
    .selectAll("g")
      .data(stations)
    .enter().append("g")
      .attr("transform", function(d) { return "translate(0," + y(d.distance) + ")"; })
      .style("font-size", '14px');

  station.append("text")
      .attr("x", -6)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

  station.append("line")
      .attr("x2", width);

  if (topAxis) {
    svg.append("g")
        .attr("class", "x top axis")
        .call(xAxis.orient("top"));
  } else {
    var ticks = d3.svg.axis()
      .scale(x)
      .ticks(8)
      .tickFormat('');

    svg.append("g")
        .attr("class", "x top axis")
        .call(ticks.orient("top"));
  }

  svg.append("g")
      .attr("class", "x bottom axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis.orient("bottom"));

  var train = svg.append("g")
      .attr("class", "train")
      .attr("clip-path", "url(#clip)")
    .selectAll("g")
      .data(services)
    .enter().append("g")

  var services = train.selectAll("line")
      .data(function(d) {
        console.log(d.departure)
        console.log(parseIsoTime(d.departure))
        d.departureX = x(parseIsoTime(d.departure))
        d.departureY = y(stationDistance(stations, d.from))
        d.arrivalX = x(parseIsoTime(d.arrival));
        d.arrivalY = y(stationDistance(stations, d.to));
        d.midX = d.departureX + (d.arrivalX - d.departureX) / 2
        d.midY = d.departureY + (d.arrivalY - d.departureY) / 2
        d.rotation = Math.atan((d.arrivalY - d.departureY) / (d.arrivalX - d.departureX)) * 180 / Math.PI
        return [d]
      })
    .enter()

  services.append('path')
    .attr('d', function(d) { return `M ${d.departureX} ${d.departureY} L ${d.arrivalX} ${d.arrivalY}`})
    .attr('id', function(d) { return `${d.departure}-${d.arrival}`})
    .style("stroke", function(d) { return d.new_timetable ? '#984EA3' : '#377EB8' })
    .style("stroke-width", '4px')
    .style("opacity", function(d) { return d.overtaken ? '0.2' : '1' })
    .style('stroke-linecap', "round")

  services.append('text')
    .text(function(d) { return d.length + 'm'} )
    .attr('x', function(d) { return d.midX })
    .attr('y', function(d) { return d.midY })
    .attr('transform', function(d) { return `rotate(${d.rotation}, ${d.midX}, ${d.midY})`})
    .attr('text-anchor', 'middle')
    .style("opacity", function(d) { return d.overtaken ? '0.2' : '1' })
    .style('font-weight', 'bold')
    .attr('baseline-shift', '4px');
}

d3.json(d3.select(".chart-container").attr('data-url'), function(error, data) {
  if (data.error) {
    d3.select("body").insert("div", 'footer').attr('class', 'alert').text('Error: Please check your 3-letter station codes are correct and try again.')
  } else {
    d3.select(".loading").remove();
    drawGraph(data, data.stations, data.services.filter(service => !service.new_timetable), false, data.current_start, data.current_end);
    drawGraph(data, data.stations, data.services.filter(service => service.new_timetable), true, data.new_start, data.new_end);
  }
});
