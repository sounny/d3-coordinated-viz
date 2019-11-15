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
        console.log(csvData); //correctly reads csvData here
        
    //create graticule function. Style in .css
    setGraticule(map, path);   
    
        //translate europe TopoJSON.  
    var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),
            franceRegions = topojson.feature(france, france.objects.FranceRegions).features;
        console.log(franceRegions) //reads data correctly here

    var countries = map.append("path")
        .datum(europeCountries)
        .attr("class", "countries")
        .attr("d", path);
        console.log(europeCountries); //reads data correctly here
        
    //join csv data to geoJSON enumeration units
    FranceRegions = joinData(franceRegions, csvData);  
    
    //create the color scale
    var colorScale = makeColorScaleNB(csvData);
        
    //add enumeration units to the map
    setEnumerationUnits(franceRegions, map, path, colorScale);
  
        //don't forget to add the chart viz here!
    setChart(csvData, colorScale);
    
        //create dropdown using data
    createDropdown(csvData);
        
    };  //end of callback function
    
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
    console.log(franceRegions, csvData);  //correctly reads here
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
 /*       .on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);*/
    
     var desc = regions.append("desc")
    .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};   //end of setEnumerationUnits 

//function to create bar chart. Ex. 2.1 through 2.3 from 2.3 LEsson 2
function setChart(csvData, colorScale){
    //code from 2.3 Lesson 2; modified in 2-4 as pseudo global variables and declared starting at line 11 so commented out here
/*    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";*/
    
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
    
    //create scale to size bars proportionally to frame; these are now defined as pseudo globals
/*    var csvmax = d3.max(csvData, function(d) { return parseFloat(d[expressed]); });
    console.log(csvmax);
    var yScale = d3.scaleLinear()
        .range ([chartHeight - 10, 0])
        .domain([0, csvmax + 20]);*/
    
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
        .attr("width", chartInnerWidth / csvData.length - 1)
    //comment out next 3 lines until I get the setChart function, moveLabel and highlight/dehighlight figured out.
/*        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);*/
    
    //example 2.4; adjusting size of bars based on data; commented out as these are now called as pseudo global variables
 /*       .attr("width", chartInnerWidth / csvData.length - 1)  
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
    */
    
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
    
    //create text element for chart title; 
    
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
    
    //set bar positions, height and color, 2-4, lesson 2
    updateChart(bars, csvData.length, colorScale);
    
};  //end of setChart
    
//create dropdown menu for attribute selection interaction. ex 1.1 from 2-4 Lesson 1
//dropdown styled in CSS - DONT FORGET    
function createDropdown(csvData){
    var dropdown = d3.select("body")
    .append("select")
    .attr("class", "dropdown")
    //on event listner from ex 1.4 to listen for interaction on selected elements
    .on("change", function(){
        changeAttribute(this.value, csvData)
    });

    //add initial option in dropdown
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");  //visual affordance so people know what to do
    
    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)  //pseudo global variable that holds array of attribute names
        .enter()
        .append("option")
        .attr("value", function(d){return d})
        .text(function(d){return d});
    
}; //end of createDropdown
    
 //dropdown event listner handler    
function changeAttribute(attribute, csvData){
    expressed = attribute;
    
    //change the yscale dynamically
    csvmax = d3.max(csvData, function(d){return parseFloat(d[expressed]); });
    yScale = d3.scaleLinear()
        .range([chartHeight -10, 0])
        .domain([0, csvmax*1.1]);
    
    //update vertical axis
    d3.select(".axis").remove();
    var yAxis = d3.axisLeft()
        .scale(yScale);
    
    //place axis
    var axis = d3.select(".chart")
        .append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
    
    //recreate the color scale; ex 1.4, 1.5 and 1.9 (transitions) from 2-4 Lesson 1
    var colorScale = makeColorScaleNB(csvData);
    
    //recolor enumeration untis
    var regions = d3.selectAll(".regions")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });
    
    //resort, resize and recolor bars usig ex 1.7 from 2-4 Lesson 1adds global pseudo variables
    var bars = d3.selectAll(".bar")
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
    
    //transition added per ex 1.10
        .transition()
        .delay(function(d, i){
            return i*20
        })
        .duration(500);
    
    updateChart(bars, csvData.length, colorScale);
    
//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    
    //add text to chart title
    var chartTitle = d3.select(".chartTitle")
        .text("Number of Variable " + expressed[3] + " in each region");
};

//function to highlight enumeration units and bars
/*
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.adm1_code)
        .style("stroke", "blue")
        .style("stroke-width", "2");
    
    setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.adm1_code)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
    
    //below Example 2.4 line 21...remove info label
    d3.select(".infolabel")
        .remove();

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
};
*/

//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.adm1_code + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};

//function to move info label with mouse
//Example 2.8 line 1...function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};
    
}  // end of changeAttribute   
    
    
})(); //last line of main.js