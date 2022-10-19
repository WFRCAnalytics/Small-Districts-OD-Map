// javascript for controlling OD WebMap
// written by Bill Hereth April 2022

var dChartX = [2019, 2030, 2040, 2050];

var dModes = [
  { label: "All Vehicles", value: "A"},
  { label: "Rail"        , value: "R"},
  { label: "Bus"         , value: "S"},
  { label: "Bicycle"     , value: "K"},
  { label: "Pedestrian"  , value: "P"},
  { label: "Trucks"      , value: "T"}
];

var dModesBasic = [
  { label: "All Vehicles", value: "A"},
  { label: "Trucks"      , value: "T"}
];

var dGeo = [
    { label: "Small Districts"           , value: "sd", file:"smalldist"         },
    { label: "Centers to Small Districts", value: "ct", file:"centerstosmalldist"}
  ];

var dVolumeOrPercent = [
    { label: "Average Trip Counts" , value: "V"},
    { label: "Percent of Trips"    , value: "P" }
];

var dDirections = [
    { label: "Selected District as Origin"         , value: "O", highlighted: "<mark>Selected District</mark> as Origin"     },
    { label: "Selected District as Destination"    , value: "D", highlighted: "<mark>Selected District</mark> as Destination"}
//    { label: "Both Origin/Destination", value: "B"}
];

var dDayPartColors = ["#0ea7b5","#e8702a","#ffbe4f"];

var dChartType = [
    { label: "Trips by Month"               , value: "MonVol"},
    { label: "Trips by Month by Mode"       , value: "MonMod"},
    { label: "Trips by Time of Day"         , value: "TODVol"},
    { label: "Trips by Time of Day by Mode" , value: "TODMod"}
];

var dChartTypeBasic = [
    { label: "Trips by Month"               , value: "MonVol"},
    { label: "Trips by Time of Day"         , value: "TODVol"}
];

// All Years
// monthly/hourly
// For the selected origin/destination
// labels... within polygons

var sGeo       =     "sd";
var iDayType   =        1; // 1:Weekdays
var iDayPart   =        0; // 1:All Day
var sSeason    =     "YR"; // 1:All Year
var sDirection =      "O";
var iCenter    =     2000;
var iYear      =     2019;
var sMode      =      "A";
var sVol_Per   =      "V";
var sTablVal   =      "V";
var iSmallDist =      321; // downtown SLC
var sChart     = "MonVol";

var wOD;

// ATO Variables
var curGeo      = sGeo;
var curMode     = sMode;
var curDayType  = iDayType;
var curSeason   = sSeason;
var curYear     = iYear;
var curDayPart  = iDayPart;
var curVol_Per  = sVol_Per;
var curTablVal  = sTablVal;
var curCenter   = iCenter;
var curDirection = sDirection;
var curSmallDist = iSmallDist;
var curChart     = sChart;
var lyrTAZ;
var lyrDispLayer;
var lyrCenters;
var lyrSmallDist;
var lyrSmallDistSelection;
var sDispLayer      = "Zone set WFSmallAnalysisDists"; // layer name for all display layers (filled programatically)
var sCenterLayer    = "Zone set WFSmallAnalysisDists CENTERS";
var sSmallDistLayer = "Zone set WFSmallAnalysisDists";
var sSmallDistLayerSelect = "Zone set WFSmallAnalysisDists-Selection";
var sTAZLayer   = "TAZ"     ; // layer name for TAZs
var sCDefaultGrey = "#CCCCCC"   ; // color of default line
var sFNSGTAZID  = "SA_TAZID"  ; // field name for TAZID
var chartkey    = []      ;
var chartdata   = []      ;

var specgen     = [];
var daypart     = [];
var daytype     = [];
var season      = [];
var labelpoints = [];

var minScaleForLabels = 87804;
var labelClassOn;
var labelClassOff;
var sCWhite     = "#FFFFFF";
var sCHighlight = "#FFB6C1";
var dHaloSize = 2.0;

var sSelectionColor = "#FF69B4";
var bindata;
var curOpacity = 0.35;

var iPixelSelectionTolerance = 5;

var WIDGETPOOLID_LEGEND = 0;

var customTheme;

var trenddata_Mon;
var trenddata_TOD;

define(['dojo/_base/declare',
    'jimu/BaseWidget',
    'jimu/LayerInfos/LayerInfos',
    'dijit/registry',
    'dojo/dom',
    'dojo/dom-style',
    'dijit/dijit',
    'jimu/PanelManager',
    'dijit/form/TextBox',
    'dijit/form/ToggleButton',
    'jimu/LayerInfos/LayerInfos',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/layers/FeatureLayer',
    'esri/dijit/FeatureTable',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/TextSymbol',
    'esri/symbols/Font',
    'esri/layers/LabelClass',
    'esri/InfoTemplate',
    'esri/Color',
    'esri/map',
    'esri/renderers/ClassBreaksRenderer',
    'esri/renderers/UniqueValueRenderer',
    'esri/geometry/Extent',
    'esri/geometry/Point',
    'dojo/store/Memory',
    'dojox/charting/StoreSeries',
    'dijit/Dialog',
    'dijit/form/Button',
    'dijit/form/RadioButton',
    'dijit/form/MultiSelect',
    'dojox/form/CheckedMultiSelect',
    'dijit/form/Select',
    'dijit/form/ComboBox',
    'dijit/form/CheckBox',
    'dijit/form/HorizontalSlider',
    'dojo/store/Observable',
    'dojo/data/ObjectStore',
    'dojox/charting/Chart',
    'dojox/charting/themes/Claro',
    'dojox/charting/SimpleTheme',
    "dojox/charting/axis2d/Default",
    "dojox/charting/plot2d/Lines",
    "dojox/charting/plot2d/Markers",
    "dojox/charting/plot2d/Columns",
    'dojox/charting/plot2d/ClusteredColumns',
    'dojox/charting/widget/Legend',
    'dojox/charting/widget/SelectableLegend',
    'dojox/charting/action2d/Tooltip',
    'esri/graphic',
    'esri/tasks/GeometryService',
    'dijit/Dialog',
    'dojo/domReady!'],
function(declare, BaseWidget, LayerInfos, registry, dom, domStyle, dijit, PanelManager, TextBox, ToggleButton, LayerInfos, Query, QueryTask, FeatureLayer, FeatureTable, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, TextSymbol, Font, LabelClass, InfoTemplate, Color, Map, ClassBreaksRenderer, UniqueValueRenderer, Extent, Point, Memory, StoreSeries, Dialog, Button, RadioButton, MutliSelect, CheckedMultiSelect, Select, ComboBox, CheckBox, HorizontalSlider, Observable, ObjectStore, Chart, Claro, SimpleTheme, Default, Lines, Markers, Columns, ClusteredColumns, Legend, SelectableLegend, Tooltip, Graphic, GeometryService, Dialog) {
  // To create a widget, you need to derive from BaseWidget.
  
  return declare([BaseWidget], {
    // DemoWidget code goes here

    // please note that this property is be set by the framework when widget is loaded.
    // templateString: template,

    baseClass: 'jimu-widget-demo',
    
    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {
        console.log('startup');
        
        this.inherited(arguments);
        this.map.setInfoWindowOnClick(false); // turn off info window (popup) when clicking a feature
        
        // Widen the widget panel to provide more space for charts
        // var panel = this.getPanel();
        // var pos = panel.position;
        // pos.width = 500;
        // panel.setPosition(pos);
        // panel.panelManager.normalizePanel(panel);
        
        wOD = this;

        //Initialize Layers
        console.log('Finding Layers...')
        var layerInfosObject = LayerInfos.getInstanceSync();
        for (var j=0, jl=layerInfosObject._layerInfos.length; j<jl; j++) {
            var currentLayerInfo = layerInfosObject._layerInfos[j];
            /*if (currentLayerInfo.title == sCenterLayer) { //must mach layer title
                lyrCenters = layerInfosObject._layerInfos[j].layerObject;
                console.log('Centers Layer Found: ' + sDispLayer);
            } else*/ if (currentLayerInfo.title == sSmallDistLayer) { //must mach layer title
                lyrSmallDist = layerInfosObject._layerInfos[j].layerObject;
                console.log('Small Districts Layer Found: ' + sDispLayer);
            } else if (currentLayerInfo.title == sSmallDistLayerSelect) { //must mach layer title
              lyrSmallDistSelection = layerInfosObject._layerInfos[j].layerObject;
              console.log('Small Districts Selection Layer Found: ' + sSmallDistLayerSelect);
          }
        }

        // when zoom finishes run changeZoom to update label display
        wOD.map.on("zoom-end", function (){  
            wOD._changeZoom();  
        });  

        // Setup CHarts
        var _cmbCharts = new Select({
            id: "selectChartAdvanced",
            name: "selectChartAdvancedName",
            options: dChartType,
            onChange: function(){
                curChart = this.value;
                wOD._showHideCharts_Mon();
                wOD._showHideCharts_TOD();
            }
        }, "cmbChart");
        _cmbCharts.startup();
        _cmbCharts.set("value",curChart);

        // Setup CHarts Basic
        var _cmbChartsBasic = new Select({
          id: "selectChartBasic",
          name: "selectChartBasicName",
          options: dChartTypeBasic,
          onChange: function(){
              curChart = this.value;
              wOD._showHideCharts_Mon();
              wOD._showHideCharts_TOD();
          }
        }, "cmbChartBasic");
        _cmbChartsBasic.startup();
        _cmbChartsBasic.set("value",curChart);

        // Get Centers
        dojo.xhrGet({
            url: "widgets/ODWidget/data/centers.json",
            handleAs: "json",
            load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log('centers.json');
                centers = obj;
                // centers dropdown
                var _cmbCenters = new Select({
                    id: "selectCenter",
                    name: "selectCenterName",
                    options: centers,
                    onChange: function(){
                        curCenter = this.value;
                    }
                }, "cmbCenter");
                _cmbCenters.startup();
                _cmbCenters.set("value",curCenter);
            },
            error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                    or if the request was unsuccessful altogether. */
            }
        });


        // create radio buttons for both display of labels and symbology
        wOD._createRadioButtons(dVolumeOrPercent,"divVolumeOrPercentSection"   ,"vol_per"    , sVol_Per    );

        // Mode Advanced
        cmbMode = new Select({
            id: "selectMode",
            name: "selectModeName",
            options: dModes,
            onChange: function(){
                curMode = this.value;

                var _bUnselectable = false;

                if (curMode=='A' || curMode=='T') {
                  cmbModeBasic.set("value",curMode); // change basic combo value if matches A or T
                }

                if (curMode=='S' || curMode=='R') {

                    var _firstselval = '';
                    var _firstselvar = '';

                    // turn on/off months
                    for (const [key, value] of Object.entries(season)) {
                        //console.log(value);
                        _rbName = 'rb_season' + value.value;

                        if (value.transit=='no') {
                            dom.byId(_rbName + '_label').innerHTML = "----no data----";
                            if (curSeason==value.value && _bUnselectable==false) {
                                _bUnselectable = true;
                                registry.byId(_rbName).set("checked", false);
                            }
                            dom.byId(_rbName).disabled = true;

                            dom.byId(_rbName).style.display = 'none';

                        } else {
                            dom.byId(_rbName).disabled = false;
                            dom.byId(_rbName + '_label').innerHTML = value.label;
                            if (_firstselval=='') {
                                _firstselval = value.value;
                                _firstselvar = _rbName;
                            }
                            dom.byId(_rbName).style.display = '';
                        }
                    }

                    if (_bUnselectable==true) {
                        curSeason = _firstselval;
                        registry.byId(_firstselvar).set("checked", true);
                        _bUnselectable=false;
                    }

                    
                    var _firstselval = '';
                    var _firstselvar = '';

                    // turn on/off months
                    for (const [key, value] of Object.entries(year)) {
                        //console.log(value);
                        _rbName = 'rb_year' + value.value;

                        if (value.transit=='no') {
                            dom.byId(_rbName + '_label').innerHTML = "----no data----";
                            if (curYear==value.value && _bUnselectable==false) {
                                _bUnselectable = true;
                                registry.byId(_rbName).set("checked", false);
                            }
                            dom.byId(_rbName).disabled = true;

                            dom.byId(_rbName).style.display = 'none';

                        } else {
                            dom.byId(_rbName).disabled = false;
                            dom.byId(_rbName + '_label').innerHTML = value.label;
                            if (_firstselval=='') {
                                _firstselval = value.value;
                                _firstselvar = _rbName;
                            }
                            dom.byId(_rbName).style.display = '';
                        }
                    }

                    if (_bUnselectable==true) {
                        curYear = _firstselval;
                        registry.byId(_firstselvar).set("checked", true);
                        _bUnselectable=false;
                    }


                } else {
                    for (const [key, value] of Object.entries(season)) {
                        dom.byId('rb_season' + value.value).disabled = false;
                        dom.byId('rb_season' + value.value + '_label').innerHTML = value.label;
                    }
                    for (const [key, value] of Object.entries(year)) {
                        dom.byId('rb_year' + value.value).disabled = false;
                        dom.byId('rb_year' + value.value + '_label').innerHTML = value.label;
                    }
                }
                wOD._updateDisplay();
                wOD._setLegendBar();
            }
        }, "cmbMode");
        cmbMode.startup();
        cmbMode.set("value",sMode);
        
        // Mode Basic
        cmbModeBasic = new Select({
          id: "selectModeBasic",
          name: "selectModeBasicName",
          options: dModesBasic,
          onChange: function(){
              curMode = this.value;
              cmbMode.set("value",curMode); // set advanced same as basic
              wOD._updateDisplay();
              wOD._setLegendBar();
          }
        }, "cmbModeBasic");
        cmbModeBasic.startup();
        cmbModeBasic.set("value",sMode);

        // direction
        var _cmbDirection = new Select({
            id: "selectDirection",
            name: "selectDirectionName",
            options: dDirections,
            onChange: function(){
                curDirection = this.value;
                wOD._updateDisplay();
                wOD._setLegendBar();
            }
        }, "cmbDirection");
        _cmbDirection.startup();
        _cmbDirection.set("value",sDirection);
        
        // Get DayType
        dojo.xhrGet({
            url: "widgets/ODWidget/data/codes_daytype.json",
            handleAs: "json",
            load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log('codes_daytype.json');
                daytype = obj;
                wOD._createRadioButtons(daytype,"divDayTypeSection","daytype",iDayType);
            },
            error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                    or if the request was unsuccessful altogether. */
            }
        });
        // Get Years
        dojo.xhrGet({
            url: "widgets/ODWidget/data/codes_year.json",
            handleAs: "json",
            load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log('codes_year.json');
                year = obj;
                wOD._createRadioButtons(year,"divYearSection","year",iYear);
            },
            error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                    or if the request was unsuccessful altogether. */
            }
        });
        // Get Season
        dojo.xhrGet({
            url: "widgets/ODWidget/data/codes_season.json",
            handleAs: "json",
            load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log('codes_season.json');
                season = obj;
                wOD._createRadioButtons(season,"divSeasonSection","season",sSeason);
            },
            error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                    or if the request was unsuccessful altogether. */
            }
        });
        // Get DayParts
        dojo.xhrGet({
            url: "widgets/ODWidget/data/codes_daypart.json",
            handleAs: "json",
            load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log('codes_daypart.json');
                daypart = obj;
                wOD._createRadioButtons(daypart,"divDayPartSection","daypart",iDayPart);
            },
            error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                    or if the request was unsuccessful altogether. */
            }
        });

        // Populate BinData Object
        dojo.xhrGet({
            url: "widgets/ODWidget/data/bindata.json",
            handleAs: "json",
            load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log('bindata.json');
                bindata = obj;
                // _CurDisplayItem = dDisplayOptions.filter( function(dDisplayOptions){return (dDisplayOptions['value']==curDisplay);} );
                wOD._setLegendBar();
                wOD._updateDisplay();
            },
            error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                    or if the request was unsuccessful altogether. */
            }
        });
        
        // Get Label Points
        dojo.xhrGet({
          url: "widgets/ODWidget/data/districts/zone_set_WFSmallAnalysisDists_LabelPoints.json",
          handleAs: "json",
          load: function(obj) {
              /* here, obj will already be a JS object deserialized from the JSON response */
              console.log('zone_set_WFSmallAnalysisDists_LabelPoints.json');
              labelpoints = obj;
          },
          error: function(err) {
              /* this will execute if the response couldn't be converted to a JS object,
                  or if the request was unsuccessful altogether. */
          }
        });

        // Check box change events
        dom.byId("chkLabels").onchange = function(isChecked) {
            wOD._updateDisplay();
        };
        
        //get dat for table - time of day
        dojo.xhrGet({
            url: "widgets/ODWidget/data/SpecGenTAZ_SLTimeOfDayVolumes.json",
            handleAs: "json",
            load: function(obj) {
            /* here, obj will already be a JS object deserialized from the JSON response */
            console.log('SpecGenTAZ_SLTimeOfDayVolumes.json');
            todtot = obj;

            //Populate dowFactors DataStore
            storetodtot = Observable(new Memory({
                    data: {
                        identifier: "SpecGen",
                        items: todtot
                    }
                }));
            },
            error: function(err) {
            /* this will execute if the response couldn't be converted to a JS object,
                or if the request was unsuccessful altogether. */
            }
        });

        //SETUP MAP CLICK EVENT

        wOD.map.on('click', selectFeatures);

        function pointToExtent(map, point, toleranceInPixel) {
            var pixelWidth = wOD.map.extent.getWidth() / wOD.map.width;
            var toleranceInMapCoords = toleranceInPixel * pixelWidth;
            return new Extent(point.x - toleranceInMapCoords,
                              point.y - toleranceInMapCoords,
                              point.x + toleranceInMapCoords,
                              point.y + toleranceInMapCoords,
                              wOD.map.spatialReference);
        }
        
        //Setup Function for Selecting Features and Opening Widgets

        function selectFeatures(evt) {
            var query = new Query();
            query.geometry = pointToExtent(map, evt.mapPoint, iPixelSelectionTolerance);
            query.returnGeometry = false;
            query.outFields = ["*"];

            var queryTaskSeg = new QueryTask(lyrSmallDist.url);
            
            //Clear Selection
            lyrSmallDist.clearSelection();
            wOD.map.infoWindow.clearFeatures();
            g_sSegID = '';
            
            //execute query
            queryTaskSeg.execute(query,showResults);
            
            //search results
            function showResults(results) {
                console.log('showResults');
                var resultCount = results.features.length;
                //only use first result
                if (resultCount>=1) {
                    var featureAttributes = results.features[0].attributes;
                    curSmallDist = featureAttributes['id'];

//                    var querysmalldist = new Query();  
//                    querysmalldist.returnGeometry = false;
//                    querysmalldist.where = "id=" + curSmallDist;
//                    querysmalldist.outFields = ["*"];
                    lyrSmallDistSelection.setDefinitionExpression("id=" + curSmallDist);
                    lyrSmallDistSelection.refresh();
//                    var selectSmallDist = lyrSmallDist.selectFeatures(querysmalldist, FeatureLayer.SELECTION_NEW);
//                    wOD.map.infoWindow.lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, Color.fromHex(sSelectionColor), 3);
//                    wOD.map.infoWindow.setFeatures([selectSmallDist]);

                    //Update chart
                    wOD._updateDisplay();
                }
            }
        }
        wOD._changeZoom();


        // TRENDS CHART
        

                
        customThemeYear = new SimpleTheme({
            markers: {
                CIRCLE:   "m-2,0 c0,-2 3,-2 3,0 m-3,0 c0,2 3,2 3,0",
                CIRCLE:   "m-2,0 c0,-2 3,-2 3,0 m-3,0 c0,2 3,2 3,0",
                CIRCLE:   "m-2,0 c0,-2 3,-2 3,0 m-3,0 c0,2 3,2 3,0"
                //CIRCLE:   "m-3,0 c0,-4 6,-4 6,0 m-6,0 c0,4 6,4 6,0",
                //SQUARE:   "m-3,-3 l0,6 6,0 0,-6 z",
                //TRIANGLE: "m-3,3 l3,-6 3,6 z"
            }
        });

        cMonVol = new Chart("chart_MonVol");
        cMonVol.addPlot("default", {type: Markers})
        //cMonVol.addPlot("default", {type: Lines})
        .addAxis("x",
            {labels: [
            {value:  1, text: "Jan"},
            {value:  2, text: "Feb"},
            {value:  3, text: "Mar"},
            {value:  4, text: "Apr"},
            {value:  5, text: "May"},
            {value:  6, text: "Jun"},
            {value:  7, text: "Jul"},
            {value:  8, text: "Aug"},
            {value:  9, text: "Sep"},
            {value: 10, text: "Oct"},
            {value: 11, text: "Nov"},
            {value: 12, text: "Dec"}
            ],
            minorLabels: true,
            majorLabels: true,
            majorTickStep: 1,
            minorTicks: false,
            min:  1,
            max: 12,
            title: "Month",
            titleOrientation: "away",
            titleFont: "normal normal normal 12pt Verdana",
            titleGap: 15,
            rotation: 90
            }
        )
        .addAxis("y",
            {
            vertical: true,
            //fixLower: "minor",
            //fixUpper: "minor",
            min: 0,
            //max: 1000,
            minorTicks: false,
            //minorTickStep: 250,
            title: "Average Trips",
            titleOrientation: "axis",
            titleFont: "normal normal normal 8pt Verdana",
            titleGap: 15
            }
        )
        .addSeries("2019", [{x: 0, y: 0}], {stroke: {color: new Color([237, 125,  49, 0.9]), width: 3}, fill: new Color([237, 125,  49, 0.9])})
        .addSeries("2020", [{x: 0, y: 0}], {stroke: {color: new Color([ 52,  96, 148, 0.9]), width: 3}, fill: new Color([ 52,  96, 148, 0.9])})
        .addSeries("2021", [{x: 0, y: 0}], {stroke: {color: new Color([165, 165, 165, 0.9]), width: 3}, fill: new Color([165, 165, 165, 0.9])})
        .setTheme(customThemeYear)
        .render();

        // Create the legend
        //var lVT = new Legend({ chart: cMonVol }, "legendVT");
        lMonVol = new SelectableLegend({chart: cMonVol, outline: true, horizontal: false},"legendMonVol");


        // BY MODE CHART

        customThemeMode = new SimpleTheme({
            markers: {
                CIRCLE:   "m-2,0 c0,-2 3,-2 3,0 m-3,0 c0,2 3,2 3,0",
                SQUARE:   "m-2,-2 l0,3 3,0 0,-3 z",
                TRIANGLE: "m-2,2 l2,-3 2,3 z",
                CIRCLE:   "m-2,0 c0,-2 3,-2 3,0 m-3,0 c0,2 3,2 3,0",
                SQUARE:   "m-2,-2 l0,3 3,0 0,-3 z",
                TRIANGLE: "m-2,2 l2,-3 2,3 z"
            }
        });

        cMonMod = new Chart("chart_MonMod");
        cMonMod.addPlot("default", {type: Markers})
        .addAxis("x",
            {labels: [
            {value:  1, text: "Jan"},
            {value:  2, text: "Feb"},
            {value:  3, text: "Mar"},
            {value:  4, text: "Apr"},
            {value:  5, text: "May"},
            {value:  6, text: "Jun"},
            {value:  7, text: "Jul"},
            {value:  8, text: "Aug"},
            {value:  9, text: "Sep"},
            {value: 10, text: "Oct"},
            {value: 11, text: "Nov"},
            {value: 12, text: "Dec"}
            ],
            minorLabels: true,
            majorLabels: true,
            majorTickStep: 1,
            minorTicks: false,
            min:  1,
            max: 12,
            title: "Month",
            titleOrientation: "away",
            titleFont: "normal normal normal 12pt Verdana",
            titleGap: 15,
            rotation: 90
            }
        )
        .addAxis("y",
            {
            vertical: true,
            //fixLower: "minor",
            //fixUpper: "minor",
            min: 0,
            //max: 1000,
            minorTicks: false,
            //minorTickStep: 250,
            title: "Average Trips",
            titleOrientation: "axis",
            titleFont: "normal normal normal 8pt Verdana",
            titleGap: 15
            }
        )
        .addSeries("All Vehicles", [{x: 0, y: 0}], {stroke: {color: new Color([237, 125,  49, 0.9]), width: 3}, fill: new Color([237, 125,  49, 0.9])})
        .addSeries("Rail"        , [{x: 0, y: 0}], {stroke: {color: new Color([ 52,  96, 148, 0.9]), width: 3}, fill: new Color([ 52,  96, 148, 0.9])})
        .addSeries("Bus"         , [{x: 0, y: 0}], {stroke: {color: new Color([165, 165, 165, 0.9]), width: 3}, fill: new Color([165, 165, 165, 0.9])})
        .addSeries("Bicycle"     , [{x: 0, y: 0}], {stroke: {color: new Color([246, 190, 152, 0.9]), width: 3}, fill: new Color([118,  63,  25, 0.9])})
        .addSeries("Pedestrian"  , [{x: 0, y: 0}], {stroke: {color: new Color([152, 176, 202, 0.9]), width: 3}, fill: new Color([ 26,  48,  74, 0.9])})
        .addSeries("Trucks"      , [{x: 0, y: 0}], {stroke: {color: new Color([210, 210, 210, 0.9]), width: 3}, fill: new Color([ 83,  83,  83, 0.9])})
        .setTheme(customThemeMode)
        .render();

        // Create the legend
        //var lVT = new Legend({ chart: cMonVol }, "legendVTMode");
        lMonMod = new SelectableLegend({chart: cMonMod, outline: true, horizontal: false},"legendMonMod");

        // BY TOD CHART - Volume

        cTODVol = new Chart("chart_TODVol");
        cTODVol.addPlot("default", {type: Markers})
        .addAxis("x",
            {labels: [
            {value:  1, text: "Early AM"},
            {value:  2, text: "AM Peak"},
            {value:  3, text: "Midday"},
            {value:  4, text: "PM Peak"},
            {value:  5, text: "Late PM"}
            ],
            minorLabels: true,
            majorLabels: true,
            majorTickStep: 1,
            minorTicks: false,
            min:  1,
            max: 5,
            title: "Time of Day",
            titleOrientation: "away",
            titleFont: "normal normal normal 10pt Verdana",
            titleGap: 15
            }
        )
        .addAxis("y",
            {
            vertical: true,
            //fixLower: "minor",
            //fixUpper: "minor",
            min: 0,
            //max: 1000,
            minorTicks: false,
            //minorTickStep: 250,
            title: "Average Trips",
            titleOrientation: "axis",
            titleFont: "normal normal normal 8pt Verdana",
            titleGap: 15
            }
        )
        .addSeries("2019", [{x: 0, y: 0}], {stroke: {color: new Color([237, 125,  49, 0.9]), width: 3}, fill: new Color([237, 125,  49, 0.9])})
        .addSeries("2020", [{x: 0, y: 0}], {stroke: {color: new Color([ 52,  96, 148, 0.9]), width: 3}, fill: new Color([ 52,  96, 148, 0.9])})
        .addSeries("2021", [{x: 0, y: 0}], {stroke: {color: new Color([165, 165, 165, 0.9]), width: 3}, fill: new Color([165, 165, 165, 0.9])})
        .setTheme(customThemeYear)
        .render();

        // Create the legend
        //var lVT = new Legend({ chart: cMonVol }, "legendVTMode");
        lTODVol = new SelectableLegend({chart: cTODVol, outline: true, horizontal: false},"legendTODVol");

        // BY TOD CHART - Mode

        cTODMod = new Chart("chart_TODMod");
        cTODMod.addPlot("default", {type: Markers})
        .addAxis("x",
            {labels: [
            {value:  1, text: "Early AM"},
            {value:  2, text: "AM Peak"},
            {value:  3, text: "Midday"},
            {value:  4, text: "PM Peak"},
            {value:  5, text: "Late PM"}
            ],
            minorLabels: true,
            majorLabels: true,
            majorTickStep: 1,
            minorTicks: false,
            min:  1,
            max: 5,
            title: "Time of Day",
            titleOrientation: "away",
            titleFont: "normal normal normal 10pt Verdana",
            titleGap: 15
            }
        )
        .addAxis("y",
            {
            vertical: true,
            //fixLower: "minor",
            //fixUpper: "minor",
            min: 0,
            //max: 1000,
            minorTicks: false,
            //minorTickStep: 250,
            title: "Average Trips",
            titleOrientation: "axis",
            titleFont: "normal normal normal 8pt Verdana",
            titleGap: 15
            }
        )
        .addSeries("All Vehicles", [{x: 0, y: 0}], {stroke: {color: new Color([237, 125,  49, 0.9]), width: 3}, fill: new Color([237, 125,  49, 0.9])})
        .addSeries("Rail"        , [{x: 0, y: 0}], {stroke: {color: new Color([ 52,  96, 148, 0.9]), width: 3}, fill: new Color([ 52,  96, 148, 0.9])})
        .addSeries("Bus"         , [{x: 0, y: 0}], {stroke: {color: new Color([165, 165, 165, 0.9]), width: 3}, fill: new Color([165, 165, 165, 0.9])})
        .addSeries("Bicycle"     , [{x: 0, y: 0}], {stroke: {color: new Color([246, 190, 152, 0.9]), width: 3}, fill: new Color([118,  63,  25, 0.9])})
        .addSeries("Pedestrian"  , [{x: 0, y: 0}], {stroke: {color: new Color([152, 176, 202, 0.9]), width: 3}, fill: new Color([ 26,  48,  74, 0.9])})
        .addSeries("Trucks"      , [{x: 0, y: 0}], {stroke: {color: new Color([210, 210, 210, 0.9]), width: 3}, fill: new Color([ 83,  83,  83, 0.9])})
        .setTheme(customThemeMode)
        .render();

        // Create the legend
        //var lVT = new Legend({ chart: cMonVol }, "legendVTMode");
        lTODMod = new SelectableLegend({chart: cTODMod, outline: true, horizontal: false},"legendTODMod");


        var horizSlider = new HorizontalSlider({
            minimum: 0,
            maximum: 1,
            discreteValues: 21,
            value: curOpacity,
            intermediateChanges: true,
            onChange: function(){
                console.log(this.value);
                curOpacity = this.value;
                wOD._updateDisplay();
            }
        }, "horizSlider");

        // Start up the widget
        horizSlider.startup();

    },

    _getTrendData_Mon: function() {

        _jsonfile = 'plotdata_monthly_' + String(curSmallDist).padStart(4, '0') + '.json';
        // Get Season
        dojo.xhrGet({
            url: "widgets/ODWidget/data/trends_monthly/" + _jsonfile,
            handleAs: "json",
            load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log(_jsonfile);
                
                trenddata_Mon = obj

                storeTrends_Mon = Observable(new Memory({
                    data: {
                      items: trenddata_Mon
                    }
                }));

                wOD._updateTrendsChart_Mon();
            },
            error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                    or if the request was unsuccessful altogether. */
            }
        });

    },

    _getTrendData_TOD: function() {

        _jsonfile = 'plotdata_tod_' + String(curSmallDist).padStart(4, '0') + '.json';
        // Get Season
        dojo.xhrGet({
            url: "widgets/ODWidget/data/trends_tod/" + _jsonfile,
            handleAs: "json",
            load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log(_jsonfile);
                
                trenddata_TOD = obj

                storeTrends_TOD = Observable(new Memory({
                    data: {
                      items: trenddata_TOD
                    }
                }));

                wOD._updateTrendsChart_TOD();
            },
            error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                    or if the request was unsuccessful altogether. */
            }
        });

    },


    _showHideCharts_Mon: function() {
        for (const [key, value] of Object.entries(dChartType)) {
            //console.log(value);
            _divName = value.value;
            if (value.value.substring(0, 3) =='Mon') {
                if (value.value==curChart) {
                    dom.byId(_divName).style.display = "block";
                } else {
                    dom.byId(_divName).style.display = "none";
                }
            }
        }
    },

    
    _showHideCharts_TOD: function() {
        for (const [key, value] of Object.entries(dChartType)) {
            //console.log(value);
            _divName = value.value;
            if (value.value.substring(0, 3) =='TOD') {
                if (value.value==curChart) {
                    dom.byId(_divName).style.display = "block";
                } else {
                    dom.byId(_divName).style.display = "none";
                }
            }
        }
    },

    _updateTrendsChart_Mon: function() {
        console.log('_updateTrendsChart_Mon');


        // get season group
        _md = dModes .find(o => o.value === curMode   ).label;
        _dt = daytype.find(o => o.value === curDayType).label;
        _dp = daypart.find(o => o.value === curDayPart).label;

        var ss2019_Mon = new StoreSeries(storeTrends_Mon, { query: { dt:curDayType, dp:curDayPart, md:curMode, g:curGeo, y:2019} }, {x:"m",y:curDirection});
        var ss2020_Mon = new StoreSeries(storeTrends_Mon, { query: { dt:curDayType, dp:curDayPart, md:curMode, g:curGeo, y:2020} }, {x:"m",y:curDirection});
        var ss2021_Mon = new StoreSeries(storeTrends_Mon, { query: { dt:curDayType, dp:curDayPart, md:curMode, g:curGeo, y:2021} }, {x:"m",y:curDirection});

        cMonVol.updateSeries("2019", ss2019_Mon);
        cMonVol.updateSeries("2020", ss2020_Mon);
        cMonVol.updateSeries("2021", ss2021_Mon);
        dom.byId("monvolTitle"   ).innerHTML =  "<h2>Trips by Month 2019-2021<br/>" + dDirections.find(o => o.value === curDirection).label + "</h2>";
        dom.byId("monvolSubtitle").innerHTML =  _md + " - " + _dt + " - " + _dp;
        cMonVol.fullRender();


        var ssAll_Mon = new StoreSeries(storeTrends_Mon, { query: { dt:curDayType, dp:curDayPart, md:'A', g:curGeo, y:curYear} }, {x:"m",y:curDirection});
        var ssRai_Mon = new StoreSeries(storeTrends_Mon, { query: { dt:curDayType, dp:curDayPart, md:'R', g:curGeo, y:curYear} }, {x:"m",y:curDirection});
        var ssBus_Mon = new StoreSeries(storeTrends_Mon, { query: { dt:curDayType, dp:curDayPart, md:'S', g:curGeo, y:curYear} }, {x:"m",y:curDirection});
        var ssBik_Mon = new StoreSeries(storeTrends_Mon, { query: { dt:curDayType, dp:curDayPart, md:'K', g:curGeo, y:curYear} }, {x:"m",y:curDirection});
        var ssPed_Mon = new StoreSeries(storeTrends_Mon, { query: { dt:curDayType, dp:curDayPart, md:'P', g:curGeo, y:curYear} }, {x:"m",y:curDirection});
        var ssTru_Mon = new StoreSeries(storeTrends_Mon, { query: { dt:curDayType, dp:curDayPart, md:'T', g:curGeo, y:curYear} }, {x:"m",y:curDirection});

        cMonMod.updateSeries("All Vehicles", ssAll_Mon);
        cMonMod.updateSeries("Rail"        , ssRai_Mon);
        cMonMod.updateSeries("Bus"         , ssBus_Mon);
        cMonMod.updateSeries("Bicycle"     , ssBik_Mon);
        cMonMod.updateSeries("Pedestrian"  , ssPed_Mon);
        cMonMod.updateSeries("Trucks"      , ssTru_Mon);
        dom.byId("monmodTitle"   ).innerHTML = "<h2>Trips by Mode for " + curYear + "<br/>" + dDirections.find(o => o.value === curDirection).label + "</h2>";
        dom.byId("monmodSubtitle").innerHTML =  _dt + " - " + _dp;
        cMonMod.fullRender();

        wOD._showHideCharts_Mon();
    },

    _updateTrendsChart_TOD: function() {
        console.log('_updateTrendsChart_TOD');


        // get season group
        _md = dModes .find(o => o.value === curMode   ).label;
        _sn = season .find(o => o.value === curSeason ).label;
        _dp = daypart.find(o => o.value === curDayPart).label;
        _dt = daytype.find(o => o.value === curDayType).label;

        _curDateRange = String(curYear) + '_' + curSeason;

        var ss2019_TOD = new StoreSeries(storeTrends_TOD, { query: { dt:curDayType, s:curSeason, y:2019, md:curMode, g:curGeo} }, {x:"dp",y:curDirection});
        var ss2020_TOD = new StoreSeries(storeTrends_TOD, { query: { dt:curDayType, s:curSeason, y:2020, md:curMode, g:curGeo} }, {x:"dp",y:curDirection});
        var ss2021_TOD = new StoreSeries(storeTrends_TOD, { query: { dt:curDayType, s:curSeason, y:2021, md:curMode, g:curGeo} }, {x:"dp",y:curDirection});

        cTODVol.updateSeries("2019", ss2019_TOD);
        cTODVol.updateSeries("2020", ss2020_TOD);
        cTODVol.updateSeries("2021", ss2021_TOD);
        dom.byId("todvolTitle"   ).innerHTML =  "<h2>Trips by Time of Day 2019-2021<br/>" + dDirections.find(o => o.value === curDirection).label + "</h2>";
        dom.byId("todvolSubtitle").innerHTML =  _md + " - " + _sn + " - " + _dt;
        cTODVol.fullRender();

        var ssAll_TOD = new StoreSeries(storeTrends_TOD, { query: { dt:curDayType, s:curSeason, y:curYear, md:'A', g:curGeo} }, {x:"dp",y:curDirection});
        var ssRai_TOD = new StoreSeries(storeTrends_TOD, { query: { dt:curDayType, s:curSeason, y:curYear, md:'R', g:curGeo} }, {x:"dp",y:curDirection});
        var ssBus_TOD = new StoreSeries(storeTrends_TOD, { query: { dt:curDayType, s:curSeason, y:curYear, md:'S', g:curGeo} }, {x:"dp",y:curDirection});
        var ssBik_TOD = new StoreSeries(storeTrends_TOD, { query: { dt:curDayType, s:curSeason, y:curYear, md:'K', g:curGeo} }, {x:"dp",y:curDirection});
        var ssPed_TOD = new StoreSeries(storeTrends_TOD, { query: { dt:curDayType, s:curSeason, y:curYear, md:'P', g:curGeo} }, {x:"dp",y:curDirection});
        var ssTru_TOD = new StoreSeries(storeTrends_TOD, { query: { dt:curDayType, s:curSeason, y:curYear, md:'T', g:curGeo} }, {x:"dp",y:curDirection});

        cTODMod.updateSeries("All Vehicles", ssAll_TOD);
        cTODMod.updateSeries("Rail"        , ssRai_TOD);
        cTODMod.updateSeries("Bus"         , ssBus_TOD);
        cTODMod.updateSeries("Bicycle"     , ssBik_TOD);
        cTODMod.updateSeries("Pedestrian"  , ssPed_TOD);
        cTODMod.updateSeries("Trucks"      , ssTru_TOD);
        dom.byId("todmodTitle"   ).innerHTML = "<h2>Trips by Time of Day by Mode for " + curYear + "<br/>" + dDirections.find(o => o.value === curDirection).label + "</h2>";
        dom.byId("todmodSubtitle").innerHTML =  _sn + " - " + _dt;
        cTODMod.fullRender();

        wOD._showHideCharts_TOD();
    },

    _createRadioButtons: function(dData,sDiv,sName,sCheckedValue) {
      console.log('_createRadioButtons');
      
      var _divRBDiv = dom.byId(sDiv);
          
      for (d in dData) {
    
        // define if this is the radio button that should be selected
        if (dData[d].value == sCheckedValue) {
          bChecked = true;
        } else {
          bChecked = false;
        }
        
        // radio button id
        _rbID = "rb_" + sName + dData[d].value

        // radio button object
        var _rbRB = new RadioButton({ name:sName, label:dData[d].label, id:_rbID, value: dData[d].value, checked: bChecked});
        _rbRB.startup();
        _rbRB.placeAt(_divRBDiv);

        // radio button label
        var _lblRB = dojo.create('label', {
          innerHTML: dData[d].label,
          for: _rbID,
          id: _rbID + '_label'
        }, _divRBDiv);
        
        // place radio button
        dojo.place("<br/>", _divRBDiv);
    
        // Radio Buttons Change Event
        dom.byId(_rbID).onchange = function(isChecked) {
          console.log("radio button onchange");
          if(isChecked) {
            // check which group radio button is in and assign cur value accordingly
            switch(this.name) {
              case 'daytype'    : curDayType     = parseInt(this.id.charAt(this.id.length - 1)); break;
              case 'season'     : curSeason      = this.id.charAt(this.id.length - 2) + this.id.charAt(this.id.length - 1); break;
              case 'daypart'    : curDayPart     = parseInt(this.id.charAt(this.id.length - 1)); break;
              case 'vol_per'    : curVol_Per     = this.id.charAt(this.id.length - 1); break;
              case 'year'       : curYear        = this.id.charAt(this.id.length - 4) + this.id.charAt(this.id.length - 3) + this.id.charAt(this.id.length - 2) + this.id.charAt(this.id.length - 1); break;
            }
            wOD._updateDisplay();
            wOD._setLegendBar();
            wOD._updateTrendsChart_Mon();
            wOD._updateTrendsChart_TOD();
          }
        }
      }
    },

    _numberWithCommas: function(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    _updateDisplay: function() {
        console.log('_updateDisplay');


        console.log(curMode);

        if (dom.byId('chkIntrazonals').checked==true) {
          _jsonfile = dGeo.find(o => o.value === curGeo   ).file + '_' + curYear + '_' + curSeason + '_' + curDayType + '_' + curDayPart + '_wiIntrazonals.json';
        } else {
          _jsonfile = dGeo.find(o => o.value === curGeo   ).file + '_' + curYear + '_' + curSeason + '_' + curDayType + '_' + curDayPart + '_noIntrazonals.json';
        }


        // Get Season
        dojo.xhrGet({
            url: "widgets/ODWidget/data/od/" + _jsonfile,
            handleAs: "json",
            load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log(_jsonfile);
                odata = obj

                // select display field

                // when trip ends are displayed there is only one field, directionality will be done when querying row
                if (curVol_Per=='V') {
                    _displayfield = curMode + 'V';
                    _totalfield = curMode + 'V';
                }
                // when percent is displayed then a separate field per direction is used
                else if (curVol_Per=='P') {
                    _displayfield = curMode + curDirection;
                    _totalfield = curMode + 'V';  // total is not percent but trips
                }
                //console.log(_displayfield);
          
                wOD.map.graphics.clear();

                queryTask = new esri.tasks.QueryTask(lyrSmallDist.url);

                var query, updateFeature;
                query                = new Query();
                //query.outFields = ["id","displayvalue"];
                query.outFields = ["*"];
                //query.returnGeometry = false;
                query.where          = "id>=1";

                lyrSmallDist.queryFeatures(query,function(featureSet) {
                    //Update values
                    var _totalTrips = 0;
                    var resultCount = featureSet.features.length;
                    for (var i = 0; i < resultCount; i++) {
                        updateFeature = featureSet.features[i];
                        var _smalldistid = updateFeature.attributes['id'];
        
                        // when trip ends are displayed there is only one field, directionality will be done when querying row
                        if        (curDirection=='O') {
                            _dindexO = String(curSmallDist).padStart(4, '0') + '_' +  String(_smalldistid).padStart(4, '0');
                            _dindexD = '';
                        } else if (curDirection=='D') {
                            _dindexO = '';
                            _dindexD = String(_smalldistid).padStart(4, '0') + '_' +  String(curSmallDist).padStart(4, '0');
                        } else if (curDirection=='B') {
                            _dindexO = String(curSmallDist).padStart(4, '0') + '_' +  String(_smalldistid).padStart(4, '0');
                            _dindexD = String(_smalldistid).padStart(4, '0') + '_' +  String(curSmallDist).padStart(4, '0');
                        } else {
                            _dindexO = '';
                            _dindexD = '';
                        }
                
                        valueO  = 0;
                        valueD  = 0;
                        valueOt = 0;
                        valueDt = 0;

                        // try origin
                        try {
                            valueO  = odata[_dindexO][_displayfield];
                            valueOt = odata[_dindexO][_totalfield  ];
                        }
                        catch(err) {
                            valueO  = 0;
                            valueOt = 0;
                        }
                        // try destination
                        try {
                            valueD  = odata[_dindexD][_displayfield];
                            valueDt = odata[_dindexD][_totalfield  ];
                        }
                        catch(err) {
                            valueD  = 0;
                            valueDt = 0;
                        }
                        
                        if (curDirection=='B' && curVol_Per=='P') {
                            var _displayvalue = (valueO + valueD) / 2;  // average both if both directionsstyle="display: none;"
                            var _totalvalue = (valueOt + valueDt) / 2;
                        } else {
                            var _displayvalue = (valueO + valueD);
                            var _totalvalue = (valueOt + valueDt);
                        }
                        
                        _totalTrips += _totalvalue;

                        if (curVol_Per=='V') {
                            var _labelvalue = _displayvalue.toLocaleString("en-US");
                        } else if (curVol_Per=='P') {
                            var _labelvalue = parseFloat(_displayvalue*100).toFixed(1)+"%";
                        }

                        // if small district is one being selected, set to -1
                        if (dom.byId('chkIntrazonals').checked==false && _smalldistid==curSmallDist) {
                            _displayvalue = -1;
                            _labelvalue = "";
                            _selected = "nonintrazonal";
                        } else if (dom.byId('chkIntrazonals').checked==true && _smalldistid==curSmallDist) {
                            _displayvalue = -1;
                            _selected = "intrazonal";
                        } else {
                            _selected = "notselected";
                        }

                        //console.log('Origin:      ' + _dindexO + ' ' + valueO);
                        //console.log('Destination: ' + _dindexD + ' ' + valueD);
                        
                        updateFeature.attributes['displayvalue'] = _displayvalue;
                        updateFeature.attributes['selected'    ] = _selected;
                        updateFeature.attributes['valuetype'   ] = curVol_Per;
                        wOD.map.graphics.add(updateFeature);

                        if (dom.byId("chkLabels").checked == true) {

                            //SOMETIMES CENTER IS OUTSIDE POLYGON :(
                            //var pnt = updateFeature.geometry.getExtent().getCenter();

                            // get coordinates from json file

                            var _x = labelpoints.find(o => o.id === _smalldistid).Lon;//X_UTM;
                            var _y = labelpoints.find(o => o.id === _smalldistid).Lat;//Y_UTM;
      
                            _pnt = new Point(new esri.geometry.Point(_x, _y, map.spatialReference));
                            
                            var _font  = new Font();
                            _font.setSize       ("10pt");
                            _font.setWeight     (Font.WEIGHT_BOLDER);

                            //var _txtSym = new TextSymbol(_displayvalue);
                            var _txtSym = new TextSymbol(_labelvalue);
                            _txtSym.font.setSize("11pt");
                            _txtSym.font.setFamily("arial");
                            _txtSym.font.setWeight(Font.WEIGHT_BOLDER);
                            _txtSym.setHaloColor( new dojo.Color([255,255,255]) );
                            _txtSym.setHaloSize(2);
                            //txtSym.setAlign    (esri.symbol.txtSym.ALIGN_START);

                            var _lblGra = new Graphic(_pnt, _txtSym);
                            wOD.map.graphics.add(_lblGra);
                        }

                    }

                    
                    if (curGeo=='centertosmalldist') {
                        console.log(curCenter);
                        //_lyr = lyrCenters;
                    } else if (curGeo=='smalldist') {
                        console.log('smalldist');
                        //_lyr = lyrSmallDist;
                    }
            
                    if (typeof bindata !== 'undefined') {
                
                        // create renderer for display layers
                        var _defaultLine  =  new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 0.7]), 4.0)
                        var _selectedLine =  new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255,   0, 0.7]), 4.0)
                    
                        // initialize renderer with field name for current bin based on current area
                        var _Rndr = new ClassBreaksRenderer(null, 'displayvalue');
                        
                        for (var i=0; i<=9; i++) {
                            _id = curVol_Per + '_' + i.toString();
                            _Rndr.addBreak({minValue: bindata[_id].minValue, maxValue: bindata[_id].maxValue,   symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _defaultLine, Color.fromHex(bindata[_id].Color)), label: bindata[_id].Description});
                        }
                    
//                      var _uvUniqueValueRenderer = new UniqueValueRenderer({
//                        type: "unique-value",  // autocasts as new UniqueValueRenderer()
//                        valueExpression: 'var v    = $feature["displayvalue"];' +
//                                         'var s    = $feature["selected"]    ;' +
//                                           'var vorp = $feature.valuetype   ;' + 
//                                         'if      (s=="intrazonal") { return "class1" ; }' +
//                                         'else                     { return "class2" ; }',
//                                           'if      (s=="notselected"    && vorp=="V" && v <1000000) { return "class__V9" ; }' +
//                                           'else if (s=="notselected"    && vorp=="V" && v <  15000) { return "class__V8" ; }' +
//                                           'else if (s=="notselected"    && vorp=="V" && v <  10000) { return "class__V7" ; }' +
//                                           'else if (s=="notselected"    && vorp=="V" && v <   7500) { return "class__V6" ; }' +
//                                           'else if (s=="notselected"    && vorp=="V" && v <   5000) { return "class__V5" ; }' +
//                                           'else if (s=="notselected"    && vorp=="V" && v <   2500) { return "class__V4" ; }' +
//                                           'else if (s=="notselected"    && vorp=="V" && v <   1000) { return "class__V3" ; }' +
//                                           'else if (s=="notselected"    && vorp=="V" && v <    250) { return "class__V2" ; }' +
//                                           'else if (s=="notselected"    && vorp=="V" && v <     50) { return "class__V1" ; }' +
//                                           'else if (s=="notselected"    && vorp=="P" && v <  1.000) { return "class__V9" ; }' +
//                                           'else if (s=="notselected"    && vorp=="P" && v <  0.350) { return "class__V8" ; }' +
//                                           'else if (s=="notselected"    && vorp=="P" && v <  0.150) { return "class__V7" ; }' +
//                                           'else if (s=="notselected"    && vorp=="P" && v <  0.100) { return "class__V6" ; }' +
//                                           'else if (s=="notselected"    && vorp=="P" && v <  0.050) { return "class__V5" ; }' +
//                                           'else if (s=="notselected"    && vorp=="P" && v <  0.025) { return "class__V4" ; }' +
//                                           'else if (s=="notselected"    && vorp=="P" && v <  0.010) { return "class__V3" ; }' +
//                                           'else if (s=="notselected"    && vorp=="P" && v <  0.005) { return "class__V2" ; }' +
//                                           'else if (s=="notselected"    && vorp=="P" && v <  0.001) { return "class__V1" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="V" && v <1000000) { return "class_iV9" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="V" && v <  15000) { return "class_iV8" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="V" && v <  10000) { return "class_iV7" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="V" && v <   7500) { return "class_iV6" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="V" && v <   5000) { return "class_iV5" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="V" && v <   2500) { return "class_iV4" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="V" && v <   1000) { return "class_iV3" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="V" && v <    250) { return "class_iV2" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="V" && v <     50) { return "class_iV1" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="P" && v <  1.000) { return "class_iV9" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="P" && v <  0.350) { return "class_iV8" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="P" && v <  0.150) { return "class_iV7" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="P" && v <  0.100) { return "class_iV6" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="P" && v <  0.050) { return "class_iV5" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="P" && v <  0.025) { return "class_iV4" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="P" && v <  0.010) { return "class_iV3" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="P" && v <  0.005) { return "class_iV2" ; }' +
//                                           'else if (s=="intrazonal"     && vorp=="P" && v <  0.001) { return "class_iV1" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="V" && v <1000000) { return "class_nV9" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="V" && v <  15000) { return "class_nV8" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="V" && v <  10000) { return "class_nV7" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="V" && v <   7500) { return "class_nV6" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="V" && v <   5000) { return "class_nV5" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="V" && v <   2500) { return "class_nV4" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="V" && v <   1000) { return "class_nV3" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="V" && v <    250) { return "class_nV2" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="V" && v <     50) { return "class_nV1" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="P" && v <  1.000) { return "class_nV9" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="P" && v <  0.350) { return "class_nV8" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="P" && v <  0.150) { return "class_nV7" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="P" && v <  0.100) { return "class_nV6" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="P" && v <  0.050) { return "class_nV5" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="P" && v <  0.025) { return "class_nV4" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="P" && v <  0.010) { return "class_nV3" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="P" && v <  0.005) { return "class_nV2" ; }' +
//                                           'else if (s=="nonintrazonal"  && vorp=="P" && v <  0.001) { return "class_nV1" ; }' +
//                                           'else                                                     { return 'class____' ; }",
//                        uniqueValueInfos: [{value:"class1"   , symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,  _defaultLine, Color.fromHex("#000000")), label: "class1"},
//                                           {value:"class2"   , symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#EEEEEE")), label: "class2"}]//,
//                                             {value:"class____", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,  _defaultLine, Color.fromHex("#000000")), label: "class____"},
//                                           {value:"class__V1", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,  _defaultLine, Color.fromHex("#31398a")), label: "class__V1"},
//                                           {value:"class__V2", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,  _defaultLine, Color.fromHex("#1ba9e6")), label: "class__V2"},
//                                           {value:"class__V3", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,  _defaultLine, Color.fromHex("#00a74e")), label: "class__V3"},
//                                           {value:"class__V4", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,  _defaultLine, Color.fromHex("#6cb74a")), label: "class__V4"},
//                                           {value:"class__V5", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,  _defaultLine, Color.fromHex("#8dc348")), label: "class__V5"},
//                                           {value:"class__V6", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,  _defaultLine, Color.fromHex("#E09d2e")), label: "class__V6"},
//                                           {value:"class__V7", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,  _defaultLine, Color.fromHex("#Eb672d")), label: "class__V7"},
//                                           {value:"class__V8", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,  _defaultLine, Color.fromHex("#E5272d")), label: "class__V8"},
//                                           {value:"class__V9", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,  _defaultLine, Color.fromHex("#Af2944")), label: "class__V9"},
//                                           {value:"class_iV1", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#31398a")), label: "class_iV1"},
//                                           {value:"class_iV2", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#1ba9e6")), label: "class_iV2"},
//                                           {value:"class_iV3", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#00a74e")), label: "class_iV3"},
//                                           {value:"class_iV4", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#6cb74a")), label: "class_iV4"},
//                                           {value:"class_iV5", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#8dc348")), label: "class_iV5"},
//                                           {value:"class_iV6", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#E09d2e")), label: "class_iV6"},
//                                           {value:"class_iV7", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#Eb672d")), label: "class_iV7"},
//                                           {value:"class_iV8", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#E5272d")), label: "class_iV8"},
//                                           {value:"class_iV9", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#Af2944")), label: "class_iV9"},
//                                           {value:"class_nV1", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#FFFF00")), label: "class_nV1"},
//                                           {value:"class_nV2", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#FFFF00")), label: "class_nV2"},
//                                           {value:"class_nV3", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#FFFF00")), label: "class_nV3"},
//                                           {value:"class_nV4", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#FFFF00")), label: "class_nV4"},
//                                           {value:"class_nV5", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#FFFF00")), label: "class_nV5"},
//                                           {value:"class_nV6", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#FFFF00")), label: "class_nV6"},
//                                           {value:"class_nV7", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#FFFF00")), label: "class_nV7"},
//                                           {value:"class_nV8", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#FFFF00")), label: "class_nV8"},
//                                           {value:"class_nV9", symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, _selectedLine, Color.fromHex("#FFFF00")), label: "class_nV9"}]
//                        });

                        wOD._changeZoom();
                        dom.byId("opa").innerHTML = ((curOpacity)*100).toFixed(0) + "%"
                        wOD.map.graphics.setRenderer(_Rndr);
                        wOD.map.graphics.setOpacity(1-curOpacity);
                        wOD.map.graphics.refresh();
                    }
          
                    lyrSmallDist.hide();

                    if (daytype.length>0 && season.length>0 && daypart.length>0) {
                      _curDayType = daytype.filter( function(daytype){return (daytype['value']==curDayType);} );
                      _curSeason = season.filter( function(season){return (season['value']==curSeason);} );
                      _curDayPart = daypart.filter( function(daypart){return (daypart['value']==curDayPart);} );
              
                      dom.byId("TOTALTRIPSNAME").innerHTML = dModes.find(o => o.value === curMode).label + ' Average Trip Count<br/>for ' + dDirections.find(o => o.value === curDirection).highlighted;
                      dom.byId("TOTALTRIPSFINE").innerHTML = '<small>' + _curDayType[0]['label'] + ' - ' + _curDayPart[0]['label'] + ' - ' + curYear + ' ' + _curSeason[0]['label'] + '</small>';
                      dom.byId("TOTALTRIPS").innerHTML = '<strong>' + wOD._numberWithCommas(_totalTrips) + '</strong>';
                    }

                    wOD._getTrendData_Mon();
                    wOD._getTrendData_TOD();

                    console.log('Display updated');
                });
            },
            error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                    or if the request was unsuccessful altogether. */
            }
        });

        
    },
    
    _setLegendBar: function() {
      console.log('setLegendBar');

      var _curDistrict = "";
      var _curDayType = "";
      var _curSeason = "";
      var _curDayPart = "";

      if (daytype.length>0 && season.length>0 && daypart.length>0) {
        _curDayType = daytype.filter( function(daytype){return (daytype['value']==curDayType);} );
        _curSeason = season.filter( function(season){return (season['value']==curSeason);} );
        _curDayPart = daypart.filter( function(daypart){return (daypart['value']==curDayPart);} );

        var _displaytext = dVolumeOrPercent.find(o => o.value === curVol_Per   ).label;
        var _sLegend = '<strong>' + _displaytext + ' - ' +  _curSeason[0]['label'] + " - " +  _curDayType[0]['label'] + " - " + _curDayPart[0]['label'] + '</strong>';
  
        dom.byId("LegendName").innerHTML = _sLegend;
  
        if (typeof bindata !== 'undefined') {
          for (var i=1; i<=9; i++) {
            _id = curVol_Per + '_' + i.toString();
            dom.byId("divColor" + (i).toString()).style.backgroundColor = bindata[_id].Color;
          }
        }
        //dom.byId("divDetailsTitle").innerHTML = '<br/><strong>' + _curDistrict[0]['label'] + " StreetLight Summary Tables" + '</strong><br/><br/>';
      } else {
        //dom.byId("divDetailsTitle").innerHTML = '&nbsp;';
      }
    },

    _changeZoom: function(){
    //  console.log('_changeZoom');
    //  dScale = wOD.map.getScale();
    //  if (dScale < wOD._getMinScaleForLabels()) {
    //    // enable the checkbox
    //    dom.byId("Labels").style.display = "inline";
    //  } else {
    //    // diable the checkbox
    //    dom.byId("Labels").style.display = 'none';
    //  }
    },

    _getMinScaleForLabels: function() {
      return 1000000;
    },

    _getDisplayFieldName: function(){

    },

    _updateIntrazonals: function(){
      wOD._updateDisplay();
    },

    onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){
      // this.ClickClearButton();
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    },

    // added from Demo widget Setting.js
    setConfig: function(config){
      // this.textNode.value = config.districtfrom;
    var test = "";
    },

    getConfigFrom: function(){
      // WAB will get config object through this method
      return {
        // districtfrom: this.textNode.value
      };
    },

    
    _turnOnAdvanced: function() {
      console.log('_turnOnAdvanced');
  
      dom.byId("MODEADVANCED").style.display = '';
      dom.byId("CHARTSADVANCED").style.display = '';

      dom.byId("MODEBASIC").style.display = 'none';
      dom.byId("CHARTSBASIC").style.display = 'none';
            
      dom.byId("NOTEADVANCED").style.display = '';

      cmbMode.set("value",curMode);
      wOD._updateDisplay();

      myDialog = new dijit.Dialog({
        title: "Advanced Mode",
        content: "Due to the difficulty of differentiating and categorizing GPS tracks as bicycle travel, transit travel, and slow vehicle travel in congested traffic conditions, WFRC is more comfortable with <i>comparative</i> uses of the StreetLight index values for the four modes added to the map in the Advanced mode (vs. the absolute trip counts).  \
        <br/><br/>\
        Mode specific information for the Advanced version of this web map:\
        <br/>\
        <ul>\
        <li>Bus Transit and Rail Transit - data is currently only available for April, May, September, and October of 2019 and 2020.</li>\
        <li>​​Bicycle - StreetLight changed the methodology by which it identified GPS tracks as bicycle trips in November of 2021. The data shown has not been updated to apply the most recent methodology to produce updated data for the prior periods.</li>\
        <li>Pedestrian - the analysis zones, while small from the perspective of vehicle and other modes, are perhaps too large for useful interzonal pedestrian movement information. As the cost of Streetlight Insights data is proportional to the number of zones analyzed, it was not cost-effective at this point to analyze smaller zones for pedestrian travel. However, the resulting absolute and comparative data for total pedestrian trips, trip generation share, and intrazonal trips for each zone are potentially quite informative.</li>",
        style: "width: 450px"
      });

      myDialog.show();
    

      //dom.byId("INCREMENT").style.display = '';
      //dom.byId("UTAHCOUNTYMASK").style.display = '';
      //lyrMasks.setDefinitionExpression("Masks IN ('FullMask','NoMask')"); // do not show utah county masked in advanced version
      //wF._updateDisplay();
      //wF._getChartData();
  
    },
    
    _turnOnBasic: function() {
      console.log('_turnOnBasic');

      dom.byId("MODEADVANCED").style.display = 'none';
      dom.byId("CHARTSADVANCED").style.display = 'none';

      dom.byId("MODEBASIC").style.display = '';
      dom.byId("CHARTSBASIC").style.display = '';

      dom.byId("NOTEADVANCED").style.display = 'none';

      if (curMode!='A' && curMode!='T') {
          curMode = 'A';
          cmbModeBasic.set("value",curMode);
          wOD._updateDisplay();
      }
      //dom.byId("INCREMENT").style.display = 'none';
      //dom.byId("UTAHCOUNTYMASK").style.display = 'none';
      //lyrMasks.setDefinitionExpression("");  // show utah county masked in advanced version
      //wF._updateDisplay();
      //wF._getChartData();
      
    },

    //Run onOpen when receiving a message from OremLayerSymbology
    onReceiveData: function(name, widgetId, data, historyData) {
      console.log('onReceiveData');
      
      if (data.message=="TurnOnAdvanced") {
        sMode="ADVANCED";
        this._turnOnAdvanced(); 
      } else if(data.message=="TurnOnBasic") {
        sMode="BASIC";
        this._turnOnBasic();
      }
      
    }
    

        
  });
});