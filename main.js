//Using D3 to create a choropleth map
//A Fritz GEOG 575  Lab 2 - October 2019

//wrap in an anonymous function
(function(){
  
//define pseudo-global variables
//add chart variables and initial attribute
    var attrArray = ["varA", "varB", "varC", "varD", "varE"];
    var expressed = attrArray[0];
        
  //script begins when window loads  
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
    
 //set graticule on map
    setGraticule(map, path);
    
        //translate europe TopoJSON
    var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),
        franceRegions = topojson.feature(france, france.objects.FranceRegions).features;

 //add European Countries to map
    var countries = map.append("path")
        .datum(europeCountries)
        .attr("class", "countries")
        .attr("d", path);
  
// join csv data to geoJSON enumeration units
        franceRegions = joinData(franceRegions, csvData)
    
//add enumeration units to map
        setEnumerationUnits(franceRegions, map, path);
    };
     
}; //end of setMap
    
    function setGraticule(map, path){
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
        };
    
    function joinData(franceRegions, csvData){
        //loop through variables
        for (var i=0; i<csvData.length; i++){

            //current region and csv primary key variables
            var csvRegion = csvData[i];
            var csvKey = csvRegion.adm1_code;

            for (var a=0; a<franceRegions.length; a++) {
                var geojsonProps = franceRegions[a].properties;
                var geojsonKey = geojsonProps.adm1_code;
                if (geojsonKey == csvKey) {
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvRegion[attr]);
                        geojsonProps[attr] = val;
                    });
                };
            };
        };
        return franceRegions;
    };
    
    function setEnumerationUnits(franceRegions, map, path) {
         var regions = map.selectAll(".regions")
        .data(franceRegions)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.adm1_code;
        })
        .attr("d", path); 
    };
  
    
})(); //end of anony

    
