//Using D3 to create a choropleth map
//A Fritz GEOG 575  Lab 2 - October 2019

(function(){

//pseudo global variables
var attrArray = ["varA", "varB", "varC", "varD", "varE"];
var expressed = attrArray[0];  //initial attribute


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
    
    function callback(data){
    [csvData, europe, france] = data;
    
    //create graticule function. Style in .css
    setGraticule(map, path);   
    
        //translate europe TopoJSON
    var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),
            franceRegions = topojson.feature(france, france.objects.FranceRegions).features;

    var countries = map.append("path")
        .datum(europeCountries)
        .attr("class", "countries")
        .attr("d", path);
    
    //join csv data to geoJSON enumeration units
    franceRegions = joinData(franceRegions, csvData);
    
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
};  
    
//2-3 Lesson 1, example 2.3 (page 2 of 14) Looping throught the csv and asign each set of csv attributes
//    values to geojson region
function joinData(franceRegions, csvData);
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i];
        var csvKey = csvRegion.adm1_code;
        
        //loop through regions to find correct region
        for (var a=0; a<franceRegions.length; a++){
            var geojsonProps = franceRegions[a].properties;
            var geojsonKey = geojsonProps.adm1_code;
            if (geojsonKey == csvKey){
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]);
                    geojsonProps[attr] = val
                });
            };
        };
    };
    
    return franceRegions;

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
};
    
//function to test data value and return color.  Choropleth accepts props from each enumeration unit in later function
function choropleth(props, colorScale){
        //make sure each attribute value is a number
        var val = parseFloat(props[expressed]);
        if (typeof val == 'number' && !isNaN(val)){
            return colorScale(val);
        } else {
            return '#CCC';
        };
    };
  
    //function to set enumeration units for the regions, ex 2.3 from 2.2 Lesson 2, drawing geomeetries from spatial data
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
        });
};    

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
    
//create chart background
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
    
    //create text element for chart title
    
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of Variable " + expressed[3] + " in each region");
        
    //create vertical axis generator
    
    
    //place axis
    
    // create frame for chart border
    
};
    
    
})(); //last line of main.js