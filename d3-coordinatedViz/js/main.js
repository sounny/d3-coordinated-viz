//Using D3 to create a choropleth map 
//A Fritz GEOG 575  Lab 2 - October 2019

(function(){

//pseudo global variables, attArray variable are 1st row in stateOilStaff.csv
var attrArray = [
    //"State",
    "FIPS codes",
    "2008", 
    "Production Rank in 2008",
    "2009", 
    "2010", 
    "Production Rank in 2010",
    "2010", 
    "2011", 
    "2012", 
    "Production Rank in 2012",
    "2013", 
    "2014", 
    "2015",
    "2016", 
    "2017",
    "Production Rank in 2017",
    "Number of Staff responding to oil releases",
    "Percent of staff per barrels oil produced"
];
    
var expressed = attrArray[0];  //initial attribute

//execute script when window is loaded and style block
window.onload = setMap();

function setMap(){
    var width = 960,  
        height = 600;
    
    //creates container for map; 
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
   // .defer(d3.csv, "data/stateOilStaff_noRanks.csv")
    .defer(d3.json, "data/states.topojson")
    .await(callback); 
    
    function callback(error, csvData, stateData){
        console.log(csvData, stateData); //correctly reads csvData as array, and stateData as object; in csvData: numbers are text and need to be converted to numbers, stateData is type:collection
     
    //translate states topojson  
    var stateData = topojson.feature(stateData, stateData.objects.collection).features;
        console.log(stateData);  //reads correctly where stateData is object. [52].properties.NAME, where [52]is ID of stateData geojson
        
    //add state to map
    var stateRegions = map.selectAll(".stateRegions")
        .data(stateData)
        .enter()
        .append("path")
        .attr("class", function(d) {
            return "FIPS "+ d.properties.STATEFP; //This was .properties.NAME.  but does this need to be .properties.STATEFP if I'm going to join the data by the FIPS codes rather than the state name? Let's try it out and see
        })
        .attr("d", path);
  
    var stateRegions = joinData(stateRegions, csvData);         
    var colorScale = makeColorScale(csvData);       
 
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

//create a joinData function  
//  [].properties.STATEFP and [].FID from csvData are primary keys.  Somehow this function is being skpped?
//How would I implement this fix to surrmount the string problem I'm having: 
//    Solution on stackOverflow: You could map the data before you bind it:
//.data(dataset.map(function(d) { return +d; }))  // but where would this line go??
    
function joinData(stateRegions, csvData){
        
    for (var i=0; i<csvData.length; i++) {
          var csvRegion = csvData[i];
          var csvKey = parseFloat(csvRegion.FID);
        console.log(csvRegion);

          for (var a=0; a<stateRegions.length; a++){
              
              var geojsonProps = stateRegions[a].properties;
              var geojsonKey = geojsonProps.stateRegions;
              
              if (geojsonKey == csvKey) {
                  
                  attrArray.forEach(function(attr){
                     var val = parseFloat(csvRegion[attr]);
                    geojsonProps[attr] = val; 
                      
                  });
            };
        };     
    }; 
    return stateRegions;
    console.log("geojsonProps", geojsonProps);
    console.log("csvData", csvData);
    
};    //end of joinData      
    
//create dropdown    
function createDropdown(csvData){
    var dropdown = d3.select("body")
        .append("div")
        .attr("class", "dropdown")
        .html("<h4>Data Selection:</h3>")
        .append("select")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });
 
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("class", "true")
        .text("Select Attribute");
    
    var attrOptions = dropdown.selectAll("options")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d})
        .text(function(d){return d});

};  //end of create dropDown
 
    
function makeColorScale(data) {
     var colorClasses = [
        "#edf8e9",
        "#bae4b3",
        "#74c476",
        "#31a354",
        "#006d2c",
    ];
    
    //create color scale generator IS scale threshold the right one to use?
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    
    //build array of all values of the expressed attributes
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        
        var val = parseFloat(data[i][expressed]);
        console.log("val from makeColorScale function: ", val);
        domainArray.push(val);
    };
    console.log(domainArray);
    
    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    console.log(clusters);  //this returns NaN
    
    //set cluster domains to mins
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove 1st value of array to create breakpoint
    domainArray.shift();
    
    //assign array of last 4 cluster mins as domain
    colorScale.domain(domainArray);
    
    return colorScale;
    
    console.log("test1"); //this is not printing to console
    
};  //returns colorScale; end of makeColorScale 
 
function setEnumerationUnits(stateRegions, map, path, colorScale) {
    var regions = map.selectAll(".regions")
        .data(stateRegions)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.stateRegions;
        })
        .attr("d", path)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
        .on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
        
    var desc = stateRegions.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
    console.log("test");
}; //end of setEnumerationUnits
    
    
    
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
    
    
})(); //last line of main.js