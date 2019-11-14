//Using D3 to create a choropleth map
//A Fritz GEOG 575  Lab 2 - October 2019

(function(){

//pseudo global variables
var attrArray = ["varA", "varB", "varC", "varD", "varE"];
var expressed = attrArray[0];  //initial attribute

//chart frame dimensions and scale to size bars proportionally as outlined in ex 1.6, 2-4 Lesson 1
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
//create a scale to size bars proportionally to frame and for axis. 
//Note csv first column max is 88; check data for max
var yScale = d3.scaleLinear()
    .range([chartHeight - 10, 0])
    .domain([0, 88*1.1]);     
    
//execute script when window is loaded and style block
window.onload = setMap();

// set up choropleth map
function setMap(){
    var width = window.innerWidth * 0.5,  
        height = 460;
    
    //creates container for body of map; example 2.1
    var map = d3.select("body")
        .append("svg")
        .attr("class", map)
        .attr("width", width)
        .attr("height", height);
    
    //creates Albers projection
    var projection = d3.geoAlbers()
        .center([0, 46.2])
        .rotate([-2, 0])
        .parallels([43, 62]) 
        .scale(2500)
        .translate([width /2, height / 2]);
    
    var path = d3.geoPath()
        .projection(projection);
    
    //example 1.4 use d3.queue to load data
    d3.queue()
    .defer(d3.csv, "data/unitsData.csv")
    .defer(d3.json, "data/Euromap.topojson")
    .defer(d3.json, "data/france.topojson")
    .await(callback); 
    
    function callback(error, csvData, europe, france){
        console.log(csvData); //reads csvData here
        
    //create graticule function. Style in .css
    setGraticule(map, path);   
    
        //translate europe TopoJSON.  Q: Why would changing FranceRegions to franceRegions create an error and cause my map not to draw?  I don't call it FranceRegions anywhere else?
    var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),
            franceRegions = topojson.feature(france, france.objects.FranceRegions).features;
        console.log(franceRegions) //reads data correctly here

    var countries = map.append("path")
        .datum(europeCountries)
        .attr("class", "countries")
        .attr("d", path);
        console.log(europeCountries); //reads data correctly here
        
    //join csv data to geoJSON enumeration units
    FranceRegions = joinData(franceRegions, csvData);  //reference error, csvData is not defined???
    
    //create the color scale
    var colorScale = makeColorScaleNB(csvData);
        
    //add enumeration units to the map
    setEnumerationUnits(franceRegions, map, path, colorScale);
  
        //don't forget to add the chart viz here!
    setChart(csvData, colorScale);
    };
    
}; //end of setMap

    //ex 2.5 and 2.6 from 2-2 Lesson 2, Drawing Graticules
function setGraticule(map, path){
   var graticule = d3.geoGraticule()
        .step([5, 5]);
    
    var gratBackground = map.append("path")
        .datum(graticule.outline()) 
        .attr("class", "gratBackground") 
        .attr("d", path);
    
    var gratLines = map.selectAll(".gratLines") 
            .data(graticule.lines()) 
            .enter() 
            .append("path") 
            .attr("class", "gratLines") 
            .attr("d", path); 
};  //end of setGraticule (works)
    
//2-3 Lesson 1, example 1.1 (page 2 of 14) Looping throught the csv and asign each set of csv attributes
//    values to geojson region.  Put callback into separate functions per ex 1.3 
function joinData(franceRegions, csvData){
    console.log(franceRegions, csvData);
 for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i];  // the current region
        var csvKey = csvRegion.adm1_code;   //the csv primary key is adm1_code
        
        //loop through regions to find correct region
        for (var a=0; a<franceRegions.length; a++){
            var geojsonProps = franceRegions[a].properties;  //current regions geojson properties
            var geojsonKey = geojsonProps.adm1_code;  //geojson primary key
            if (geojsonKey == csvKey){
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]);  //get csv attr value
                    geojsonProps[attr] = val  //asign attr and val to geojson properties

                });
             };
        }; 
    };
    return franceRegions; 
}; //end of joinData  (Works)

//2-3 Lesson 1, example 1.6 Natural Breaks Color scale; returns colorScale for other functions
function makeColorScaleNB(data){    
    var colorClasses = [
        "#D489DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043",
    ];
    
    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);
    
    //build array of all values of the expressed attributes
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };
    
    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    
    //set cluster domains to mins
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove 1st value of array to create breakpoint
    domainArray.shift();
    
    //assign array of last 4 cluster mins as domain
    colorScale.domain(domainArray);
    
    return colorScale;
};  //end of makeColorScaleNB (works)
    
//function to test data value and return color.  Choropleth accepts props from each enumeration unit in later function
function choropleth(props, colorScale){
        //make sure each attribute value is a number
        var val = parseFloat(props[expressed]);
        if (typeof val == 'number' && !isNaN(val)){
            return colorScale(val);
        } else {
            return '#CCC';
        };
    }; //end of choropleth (works)
  
    //function to set enumeration units for the regions, ex 2.3 from 2.2 Lesson 2, drawing geometries from spatial data.  
function setEnumerationUnits(franceRegions, map, path, colorScale){
    //adds france regions to the map
     var regions = map.selectAll(".regions")
        .data(franceRegions)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.adm1_code;
        })
        .attr("d", path)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale); 
        })
         //add lines for mouseover and mouseoff and style descriptors to each path per example 2.2 in 2-4 Lesson 2
        .on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
    
     var desc = regions.append("desc")
    .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};   //end of setEnumerationUnits 

//function to create bar chart. Ex. 2.1 through 2.3 from 2.3 LEsson 2
function setChart(csvData, colorScale){
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
    // create svg element to hold chart; chart class is styled in .css
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
    
//create chart background DONT' FORGET TO STYLE IN CSS
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
    //create scale to size bars proportionally to frame
    var csvmax = d3.max(csvData, function(d) { return parseFloat(d[expressed]); });
    console.log(csvmax);
    var yScale = d3.scaleLinear()
        .range ([chartHeight - 10, 0])
        .domain([0, csvmax + 20]);
    
    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed] - a[expressed]  //sort from largest to smallest with b-a
        })
        .attr("class", function(d){
            return "bar " + d.adm1_code;
        })
    //example 2.4; adjusting size of bars based on data
        .attr("width", chartInnerWidth / csvData.length - 1)  
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return chartHeight - 10 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d,i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    
    //create text element for chart title; DONT FORGET TO ADD CSS STYLE
    
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of Variable " + expressed[3] + " in each region");
        
    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);
        
    //place axis
    var axis = chart.append("g")
        .attr("class", axis)
        .attr("transform", translate)
        .call(yAxis);
    
    // create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
};  //end of setChart
    
    
})(); //last line of main.js