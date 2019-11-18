//Using D3 to create a choropleth map 
//A Fritz GEOG 575  Lab 2 - October 2019

(function(){

//pseudo global variables, attArray variable are 1st row in stateOilProduction.csv
var attrArray = [
    "STATE",
    "rank_2008",
    "Yr_2008", 
    "Yr_2009", 
    "Yr_2010", 
    "Yr_2010", 
    "Yr_2011", 
    "Yr_2012", 
    "Yr_2013", 
    "Yr_2014", 
    "Yr_2015",
    "Yr_2016", 
    "Yr_2017",
    "rank_2017",
    "STAFF",
    "StaffDIVBarrels"
];
    
var expressed = attrArray[0];  //initial attribute

//execute script when window is loaded and style block
window.onload = setMap();

// set up choropleth map of US
function setMap(){
    var width = 960,  
        height = 600;
    
    //creates container for body of map; 
    var map = d3.select("body")
        .append("svg")
        .attr("class", map)
        .attr("width", width)
        .attr("height", height);
    
    //creates US Albers equal area projection
    var projection = d3.geoAlbersUsa()
        .scale(1100)  //scale factor so Florida doesn't escape off the screen
        .translate([width/2, height/ 2]);
    
    var path = d3.geoPath()
        .projection(projection);
   
//call graticule function. Style in .css 
    setGraticule(map, path); 
    
//use d3.queue to load data
    d3.queue()
    .defer(d3.csv, "data/stateOilStaff.csv")
    .defer(d3.json, "data/states.topojson")
    .await(callback); 
    
    function callback(error, csvData, stateData){
        console.log(csvData, stateData); //correctly reads csvData as array, numbers are text and need to be converted to numbers, and stateData is collection
     
    //translate states topojson  
    var stateData = topojson.feature(stateData, stateData.objects.collection).features;
        console.log(stateData);  //reads correctly
        
    //add state features to map WORKS
    var stateRegions = map.selectAll(".stateRegions")
        .data(stateData)
        .enter()
        .append("path")
        .attr("class", function(d) {
            return "NAME "+ d.properties.state;
        })
        .attr("d", path);
        
//color map when selection made
    var reColor = makeColorScale(csvData);  //doesn't work because csvData is read as text
        
     
    for (var i=0; i<csvData.length; i++) {
          var csvRegion = csvData[i];
          var csvStateN = csvRegion.STATE;
    console.log('csvStateN: ', csvStateN); //reads correctly here 
          
      //loop thru stateRegions and get state names
          for (var a=0; a<stateRegions.length; a++){
              
              if (stateRegions[a].properties.NAME == csvStateN){
                  for (var key in attrArray){
                      var attr = attrArray[key];
                      var val = parseFloat(csvRegion[attr]);
                      stateRegions[a].properties[attr]=val;
                  };
                  
                  stateRegions[a].properties.name = csvRegion.name;
              };
          };
       };
    
    //This block doesn't quite work as anticipated; 
    var states = map.selectAll(".states")
        .enter()
        .append("path")
        .attr("class", "states") 
        .attr("id", function(d){ return d.properties.NAME})
        .attr("d", path) 
        .style("fill", function(d) {
            return choropleth(d, reColor);
        })
        .on("mouseover", highlight)  // doesn't works
        .on("mouseoff", dehighlight) //doesn't work
        .on("mousemove", moveLabel) //doesn't work
        .append("desc").text(function(d) {
            return choropleth(d, reColor);
        });
        console.log(states);  //this creates an array with path to #StateNames and ID = States' names
        
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

//create dropdown using html and combining elements    
function createDropdown(){
    var dropdown = d3.select("body")
        .append("div")
        .attr("class", "dropdown")
        .html("<h3>Data Selection:</h3>")
        .append("select")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });
    
    dropdown.selectAll("options")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d) { return d})
        .text(function(d) {
            d = d[0].toUpperCase() + d.substring(1,3) + " " + d.substring(3);
        return d
    });
}; //end of createDropdown    
    
/*function createDropdown(){
   // add select Element
    var dropdown = d3.select("body")
        .append("body")
        .attr("class", "dropdown");
    
    // add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");
    
    //add attribute options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d})
        .text(function(d) {return d});
    
};  // end of createDropdown  (this version doesn't work)*/
    
function makeColorScale(csvData) {
     var colorClasses = [
        "#edf8e9",
        "#bae4b3",
        "#74c476",
        "#31a354",
        "#006d2c",
    ];
    
    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);
    
    //build array of all values of the expressed attributes
    var domainArray = [];
    for (var i=0; i<csvData.length; i++){
        var val = parseFloat(csvData[i][expressed]);
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
};  //returns colorScale; end of makeColorScale (doesnt' work)
    
function choropleth(d, reColor) {
    var value = d.properties[expressed];
    if(value) {
        return reColor(value);
    } else {
        return "#aaa";
    };
};  //end of choropleth (doesn't quite work yet?)
    
function changeAttribute(expressed, csvData){
    d3.selectAll(".states")
        .style("fill", function(d) {
        return choropleth(d, makeColorScale(csvData));
    });
};  //end changeAttribute    
    
function highlight(data) {
    var prop = data.properties;
    d3.select("#"+prop.NAME)
        .style("fill", "#ff0");
    
    var labelAttribute = "<h1>"+prop[expressed]+"</h1>"+expressed;
    var labelName = prop.NAME;
    
    var infoLabel = d3.select("body")
        .append("div")
        .attr("class", "infoLabel")
        .attr("id", prop.NAME+"label")
        .html(labelAttribute)
        .append("div")
        .attr("class", "labelname")
        .html(labelName);
}; //end of function hightlight (works) 
 
//dehighlight the state when mouseoff - DOESEN"T WORK 
function dehighlight(data){
    var prop = data.properties;
    var region = d3.select("#"+prop.NAME)
    var fillcolor = region.select("desc").text();
    region.style("fill", fillcolor);
    
    d3.select("#"+prop.NAME+"label").remove();
    
}; //end of dehighlight
    
function moveLabel() {
    var x = d3.event.clientX+10;
    var y = d3.event.clientY-75;
    d3.select(".infolabel")
        .style("margin-left", x+"px")
        .style("margin-top", y+"px");
};  //end of moveLabel (doesn't work)
    
})(); //last line of main.js