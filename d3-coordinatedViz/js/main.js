//Using D3 to create a choropleth map
//A Fritz GEOG 575  Lab 2 - October 2019

//execute script when window is loaded and style block

window.onload = setMap();

function setMap(){
    var width = 960;
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
    
    //create graticule and style (in .css)
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
    
    
        //translate europe TopoJSON
    var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),
            franceRegions = topojson.feature(france, france.objects.FranceRegions).features;

    var countries = map.append("path")
        .datum(europeCountries)
        .attr("class", "countries")
        .attr("d", path);
    
    var regions = map.selectAll(".regions")
        .data(franceRegions)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.adm1_code;
        })
        .attr("d", path);
    };
    

    
}; //end of setMap

    
