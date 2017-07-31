

d3.line_ev = function (true_values, dataset, options) {
    var script = document.createElement('script');
    script.src = 'http://code.jquery.com/jquery-1.11.0.min.js';
    script.type = 'text/javascript';
    document.getElementsByTagName('head')[0].appendChild(script);


    MARGIN_DEFAULT = {top: 30, right: 60, bottom: 40, left: 50};
    var opts = _.merge({
                    verbose: false,
                    update_feedback: false,
                    agg_points: false,
                    agg_fade: false,
                    agg_animate: false,
                    demo : false},
                    options);
    var line_ev = {};
    var xAxis = null;
    var yAxis = null;
    var margin = MARGIN_DEFAULT;
    var svg = null;
    var xTicks = null;
    var user_guess = null;
    var clicked = false;
    var chart_height;
    var chart_width;
    var LEFT_BUTTON = 0;
    var MIDDLE_BUTTON = 1;
    var RIGHT_BUTTON = 2;
    var can_edit = true;
    var indexed_data = [];
    line_ev.user_done = false; // true if a user has guessed for all data points//DELETE?
    line_ev.last_feedback = null;//DELETE?
    var click_change_color = true;
    var click_set_height = true;
    var activeCircle;
    var x, xNew, xBins, y, b;
    var dataKeyX, dataKeyY, dataKeyA, dataKeyB, dataKeyForPaintCircle, dataKeyForDrawingDist;
    var dataKeyForRollCircle = [];
    var dataKeyForRollCircleY = [];
    var dataKeyRoll100 = [];
    var dataKeyRoll100Y = [];
    var trueShown = null;

    var guess_line = d3.svg.line()//DELETE?
    .interpolate("linear")
    .x(function(d) { return d[0]; })
    .y(function(d) { return d[1]; });

    var actual_line = d3.svg.line()//DELETE?
    .x(function(d) { return x(d[0]); })
    .y(function(d) { return y(d[1]); });

    var aggregate_line = d3.svg.line()//DELETE?
    .interpolate("linear")
    .x(function(d) { return x(d[0]); })
    .y(function(d) { return y(d[1]); });

    function svg_to_chart(pt) {
    return [pt[0] - margin.left, pt[1] - margin.top];
    }

    document.onmousedown = function(e) {
    if (e.button == LEFT_BUTTON) {
      e.preventDefault();
      clicked = true;
    }
    };

    document.onmouseup = function(e) {
    if (e.button == LEFT_BUTTON) {
      clicked = false;
    }
    };

    function type(n) { return typeof(n);}


    line_ev.render_chart = function (total_width, total_height, elem, InteractionType) {
        
         if (opts.verbose) {
        }
        
        chart_width = total_width - margin.left - margin.right;
        chart_height = total_height - margin.top - margin.bottom;

        // scales for data keys customized for different drawing options
        x = d3.scale.linear()
            .range([0, chart_width]);

        y = d3.scale.linear()
            .range([chart_height, 0]);

        x100 = d3.scale.linear()
                .range([-20, chart_width+10]);

        xRoll100 = d3.scale.linear()
                .range([60, chart_width-172]);

        yRoll100 = d3.scale.linear()
                .range([chart_height+15, 266]);

        xNew = d3.scale.ordinal()
                .domain(["0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20"])
                .rangePoints([0, chart_width + 30]);

        xNew100 = d3.scale.ordinal()
                .domain(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"])
                .rangePoints([-4, chart_width + 24]);

        xBins = d3.scale.ordinal()
                .domain(["0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20"])
                .rangePoints([-32, chart_width + 61]);

        a = d3.scale.linear()
            .range([chart_width+18, chart_width+52]);

        b = d3.scale.linear()
            .range([chart_height-1, -100]);


        // for tickForBallNew()
        dataKeyA = a.ticks().map(a)
        dataKeyB = b.ticks().map(b)

        // for tickForBall(pt), dataKeyForDrawingDist, dataKeyForRollCircle  
        dataKeyX = x.ticks().map(x)
        $.each(dataKeyX, function(i, d) {
          dataKeyX[i] = d - 20.5;
        })

        // for tickForBall(pt), dataKeyForRollCircleY 
        dataKeyY = y.ticks().map(y)
 
        dataKeyForDrawingDist = []
        $.each(dataKeyX, function(i, d) {
          dataKeyForDrawingDist[i] = d + 50.5;
        })

        // for tickForBallNew(pt)    
        dataKeyForPaintCircle = [];
        $.each(dataKeyX, function(i, d) {
          dataKeyForPaintCircle[i] = d + 50;
        })

        // for tickForBallNew(pt)
        dataKeyPaint100 = x100.ticks().map(x)
        $.each(dataKeyPaint100, function(i, d) {
          dataKeyPaint100[i] = d;

        })


        //customized x-axis for each design
        if ((InteractionType == "roll_circle")|| (InteractionType == "drag_circle") || (InteractionType == "pull_circle") || (InteractionType == "paint_circle_top") ||(InteractionType == "paint_circle")  || (InteractionType == "draw_distribution") ||(InteractionType == "pull_circle_no_limit") || (InteractionType == "draw_distribution_fill")) {
            xAxis = d3.svg.axis()
                  .scale(xNew)
                  .orient("bottom")
        } 
        else if ((InteractionType == "plus_circle") || (InteractionType == "plus_circle_50")){
            xAxis = d3.svg.axis()
                  .scale(xBins)
                  .orient("bottom")
        }
        else if ((InteractionType == "pull_circle_100") || (InteractionType == "roll_circle_100") || (InteractionType == "paint_circle_top_100")  || (InteractionType == "drag_circle_100") || (InteractionType == "paint_circle_100")){
            xAxis = d3.svg.axis()
                  .scale(xNew100)
                  .orient("bottom") 
          } 
        else {
            xAxis = d3.svg.axis()
                  .scale(x)
                  .orient("bottom")
                  .ticks(10);
        }

        yAxis = d3.svg.axis()
              .scale(y)
              .orient("left");


        // for hiding message about remaining balls in interactions that don't use it
        if ((InteractionType == "roll_circle")|| (InteractionType == "drag_circle") || (InteractionType == "draw_distribution") ||(InteractionType == "draw_distribution_fill") || (InteractionType == "roll_circle_100") || (InteractionType == "drag_circle_100")) {
        //        console.log("aa")
            $('#availableBall').hide();
        } else {
            $('#availableBall').show();
        }


        svg = elem;
        svg = svg
              .attr("width", total_width + margin.left + margin.right)
              .attr("height", total_height + margin.top + margin.bottom)
              .on("mousemove", function() { if (clicked) { tick(d3.mouse(this));} })
              .on("click", function() { tick(d3.mouse(this)); })
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.domain(d3.extent(_(true_values).map(0).value()));
        y.domain(d3.extent(_(true_values).map(1).value()));

        b.domain(d3.extent(_(true_values).map(1).value()));
        if (opts.verbose) {
        }

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + chart_height + ")")
            .call(xAxis.tickFormat(d3.format()))


        svg.append("path").attr("class", "defaultEvLine");
        user_guess = init_user_data(dataKeyForDrawingDist);

        var feedback_call = "line_ev." + String(dataset.call) + '()';
            eval(feedback_call);
    }; // end render chart

    
    
    
    
    // updates the feedback alerting the user about the number of balls that are painted 
    function changeCountActiveCircle() {
        //max number of circles they can use
        var start_value = 20;
        if (dataset.call == "pull_circle_100" || dataset.call == "paint_circle_100"  || dataset.call == "paint_circle_top_100") {
            //max number for 100 count versions
            start_value = 100;
        } else if (dataset.call == "plus_circle_50"){
            //max number for 50 count version (bins and circles)
            start_value = 50;
        }

        // update the text on the feedback based on the number of currently active circles 
        $('#ballN').text( start_value - $('.activeCircle').size())    
    }


    
    
    
    // counts all circles with class "activeCircle"
    function CountActiveCircle() {
      return d3.selectAll('.activeCircle').size();
    }

    
    
    

    // returns the y coordinate of circle with minimum value (ie the highest circle in given column class(columnClass))
    function minimumHeight(columnClass) {
        var minimumHeightArray = [];
        d3.selectAll("." + columnClass).filter(".activeCircle")
        //select each circle in the given class
        .each(function(){
            //and push its y coordinate into an array (minimumHeightArray)
            minimumHeightArray.push(d3.select(this).attr('cy'));
        })
        // return the minimum value form the array
        return Math.min.apply(null,minimumHeightArray);
    }

    
    
    

    // puts the coordinates of colored (drawn) circles in an array once they press I'm Done 
    line_ev.finalCountArr = function() {
        var coloredArray = [];
        d3.selectAll("circle")
        .each(function(){
            if (d3.select(this).classed("activeCircle")){
                coloredArray.push([d3.select(this).attr('cx'), d3.select(this).attr('cy')]);
            }
        })
    }


    
    
    
    // paints over a grid of circles when user drags over an area or clicks on an individual circle. All circles in the column below the
    // mousepointer are also colored. Previously colored circles are erased if user goes over them again 
    line_ev.paint_circle = function() { 
        click_change_color = false;
        click_set_height = true;
        can_edit = false;
        d3.select("#next").on("click", chart.finalCountArr);

        // mouse coordinates
        var mouse, cxL, cyL;

        // to track beginning and end of drag
        var mousedown_node = null;    


        d3.csv("circle100.csv",function(error, data) {
            d3.select('svg').selectAll(".dot")
                .data(data)
            // append circles using the csv
              .enter().append("circle")
                // only append circles with even x value (to fix spacing for bigger circles)
                .filter(function(d,i) { if (d.xg % 2 ==0) { return d.xg; }})
                // only append 10 circles per column
                .filter(function(d,i) { return d.yg < 10})
                // column number divided by 2 to keep numbering consecutive
                .attr('class',function(d) {return "clickableCircle " + "circle_col_"+(d.xg/2) + " circle_row_" + d.yg ;})
                .attr("r", 20)
                .attr('fill','white')
                .attr('stroke','lightgray')
                .attr("cx", function(d) {return x(d.xg) + 75;})
                .attr("cy", function(d) {return y(d.yg)*(1.8) - 415;})
                .on({
                "mouseover": function(d) {
                          d3.select(this).style("cursor", "pointer")
                          //if no dragstart hasn't been flagged
                        if(!mousedown_node) {
                            return;
                        }
                        //call paintMode()
                         paintMode(d3.select(this))
                      },
                      "mouseout": function(d) {
                        d3.select(this).style("cursor", "default")
                      }
                    })
                .on ("click", function(){
                //on click, paint the circle and the circles under it
                    currentlyActive = CountActiveCircle(); 
                    paintMode(d3.select(this));
                
                    if ( currentlyActive >= 21) { 
                        d3.select("svg").selectAll(".activeCircle").attr("fill", "red")
                            $('#feedbackmsg').text("You're out of circles! Undo some selected circles by dragging over them or click \"Try Again\" to start over!")
                    } 
                    else {
                        $('#feedbackmsg').empty()
                            d3.select("svg").selectAll(".activeCircle").attr("fill", "steelblue")  
                    }
                changeCountActiveCircle();
                })
                .call(drag);
        }) //csv end


        // drag
        var drag = d3.behavior.drag()
                    //when drag starts,
                    .on("dragstart", function(){
                        //flag by changing value of mousedown_node
                        mousedown_node = "start"

                        //record mouse coordinates
                        mouse = d3.mouse(this);
                        cxL = mouse[0];
                        cyL = mouse[1];
                    })

                    //while dragging,
                    .on("drag", function(d,i){
                        // keep track of mouse coordinates
                        mouse = d3.mouse(this);
                        cxL = mouse[0];
                        cyL = mouse[1];

                        // calculates where the mouse pointer is heading in the circles grid along the x-axis
                        headhereXgrid = Math.ceil(Math.round(x.invert(tickForBallNew(mouse)[0]) +1.2) / 2) 

                        //counts the number of active circlesas the drag is happening
                        currentlyActive = CountActiveCircle();

                        // if the number of painted circles is less than 21, 
                        if ( currentlyActive < 21) { 
                            // no feedback message
                            $('#feedbackmsg').empty()
                            // all painted circles are filled blue
                            d3.select("svg").selectAll(".activeCircle").attr("fill", "steelblue")
                        } 
                        // if there are more than 20 colored circles,
                        else {
                            //alert the user that they're out of circles
                            $('#feedbackmsg').text("You're out of circles! Undo some selected circles by dragging over them or click \"Try Again\" to start over!")
                            //and color the painted circles red
                            d3.select("svg").selectAll(".activeCircle").attr("fill", "red")
                        }

                        // update the number of remaining circles in the feedback box
                        changeCountActiveCircle()

                    })//end ondrag

                    //when drag ends
                    .on("dragend", function() {
                        //indicate drag end by changing mousedown_node value back to null
                        mousedown_node = null;
                    })


        
        
        
        //for painting circles. thisO is given either by the dragstart or on click
        function paintMode (thisO) {
        var thisCircleColor = thisO.attr("fill")
        //columnId
        var colid = thisO.attr("class").split(" ")[1]
        //height of selected circle
        var thisHeight = parseFloat(thisO.attr("cy"))

        //if the circle is not colored
        if (thisCircleColor == "white") {
            //add activeCircle class to the painted circles
            thisO.classed("activeCircle",true)
            //go through each circle in the column of selected circle
            d3.selectAll('.' + colid)
            .each(function() {
                //if any circle lies below se;ected circle, color it and class it as active 
                if (parseFloat(d3.select(this).attr("cy")) > thisHeight) {
                    d3.select(this).attr("fill","steelblue")
                    d3.select(this).classed("activeCircle",true)
                    currentlyActive = CountActiveCircle();
                }
            })//end each function
        } else {
            //if the selected circle is colored already 
            d3.selectAll('.' + colid)
            .each(function() {
    //        console.log(parseFloat(d3.select(this).attr("cy")), thisHeight)
                //for each circle at and below the height of selected circle, 
                if (parseFloat(d3.select(this).attr("cy")) <= thisHeight) {
    //                console.log("get in")
                    //change color back to white and remove active class
                    d3.select(this).attr("fill","white")
                    d3.select(this).classed("activeCircle",false)
                    //update active circle count
                    currentlyActive = CountActiveCircle();
                }
            })//end each function
          }
        }//paintMode end

        
        
        
        
        //for points to snap circles into grid positions
        function tickForBallNew(pt) {
            pt = svg_to_chart(pt);
            pt[0] = find_closest(dataKeyForPaintCircle, pt[0]);
            pt[1] = find_closest(dataKeyForPaintCircle, pt[1]);
            //      console.log("dataKeyForPaintCircle",dataKeyForPaintCircle)
            new_point = [pt[0], pt[1]]
            return new_point    
        }

    } // end paint_circle


    
    
    
    line_ev.paint_circle_100 = function() { 
        click_change_color = false;
        click_set_height = true;
        can_edit = false;
        d3.select("#next").on("click", chart.finalCountArr);

        var origClass;
        var mouse;

        var cxL;
        var cyL;
        var mousedown_node = null;

        d3.csv("circle100_paint.csv",function(error, data) {
            d3.select('svg').selectAll(".dot")
                .data(data)
                .enter().append("circle")
                .filter(function(d,i) { return d.yg < 18 })
                .attr('class',function(d) {return "clickableCircle " + "circle_col_"+d.xg + " circle_row_" + d.yg ;})
                .attr("r", 10)
                .attr('fill','white')
                .attr('stroke','lightgray')
                .attr("cx", function(d) {return (0.8*x(d.xg)) + 58})
                .attr("cy", function(d) {return (0.8*y(d.yg)) + 125})
                .on({
                      "mouseover": function(d) {
                          d3.select(this).style("cursor", "pointer")
                         if(!mousedown_node) return;

                         paintMode(d3.select(this))


                      },
                      "mouseout": function(d) {
                        d3.select(this).style("cursor", "default")
                      }
                    })
                .on ("click", function(){

                    currentlyActive = CountActiveCircle();   
                    paintMode(d3.select(this));
                    currentlyActive = CountActiveCircle();

                    if ( currentlyActive >= 101) { 
                        d3.select("svg").selectAll(".activeCircle").attr("fill", "red")
                            $('#feedbackmsg').text("You're out of circles! Undo some selected circles by dragging over them or click \"Try Again\" to start over!")

                      } else {
                        $('#feedbackmsg').empty()
                        d3.select("svg").selectAll(".activeCircle").attr("fill", "steelblue")  

                      }  
                    changeCountActiveCircle()
                })
                .call(drag);
        }) //csv end
        
        var active;
        
        var drag = d3.behavior.drag()
        .on("dragstart", function(){
            mousedown_node = "what"
            mouse = d3.mouse(this);
            cxL = mouse[0];
            cyL = mouse[1];
            origClass = d3.select(this).attr("class").split(" ")[3];

        })

        .on("drag", function(d,i){

            mouse = d3.mouse(this);
            cxL = mouse[0];
            cyL = mouse[1];

            headhereXgrid = Math.floor(Math.round(x.invert((mouse)[0] - 50)))



            currentlyActive = CountActiveCircle();


            if ( currentlyActive < 101) { 
                $('#feedbackmsg').empty()
                d3.select("svg").selectAll(".activeCircle").attr("fill", "steelblue")
            } else {
                $('#feedbackmsg').text("You're out of circles! Undo some selected circles by dragging over them or click \"Try Again\" to start over!")
                d3.select("svg").selectAll(".activeCircle").attr("fill", "red")
            }
            
            changeCountActiveCircle()

        }) //end ondrag
        
        .on("dragend", function() {
            mousedown_node = null;
        })

        
        function paintMode (thisO) {
            var thisCircleColor = thisO.attr("fill")
            var colid = thisO.attr("class").split(" ")[1]
            var thisHeight = parseFloat(thisO.attr("cy"))
            thisO.classed("activeCircle",true)
            console.log("thiscircle's class",thisO.attr("class"))
            console.log('colid',colid)
            if (thisCircleColor == "white") {
                thisO.classed("activeCircle",true)
                d3.selectAll('.' + colid)
                .each(function() {
                    if (parseFloat(d3.select(this).attr("cy")) > thisHeight) {
                        d3.select(this).attr("fill","steelblue")
                        d3.select(this).classed("activeCircle",true)
                        currentlyActive = CountActiveCircle();
                    }
                })
            } else {
                d3.selectAll('.' + colid)
                .each(function() {
                console.log(parseFloat(d3.select(this).attr("cy")), thisHeight)
                if (parseFloat(d3.select(this).attr("cy")) <= thisHeight) {
                    d3.select(this).attr("fill","white")
                    d3.select(this).classed("activeCircle",false)
                    currentlyActive = CountActiveCircle();
                }
                })
            }
        } //end paintmode()


        function eraseMode () {
            d3.select("svg").selectAll(".clickableCircle")
            .each(function(){
              //erase everything above what the user goes over
                if ((d3.select(this).classed("circle_col_"+headhereXgrid)) && (d3.select(this).attr("cy") <= cyL)){
                  d3.select(this).attr("fill", "white")
                  d3.select(this).classed("activeCircle", false);
                }
            })
        } //end erasemode()
        
        
        dataKeyPaint100 = x100.ticks().map(x)
        $.each(dataKeyPaint100, function(i, d) {
        dataKeyPaint100[i] = d;
        })


        function tickForBallNew(pt) {
            pt = svg_to_chart(pt);
            pt[0] = find_closest(dataKeyPaint100, pt[0]);
            pt[1] = find_closest(dataKeyPaint100, pt[1]);
            new_point = [pt[0], pt[1]]
            return new_point    
        } //end tickForBallNew()

    } // end paint_circle_100

    
    
    

    line_ev.trueDistPaint = function () {
        d3.csv("circle100_paint.csv",function(error, data) {
            d3.select('svg').selectAll(".dot")
                .data(data)
                .enter().append("circle")
                .filter(function(d,i) { return d.yg < 18 })
                .attr('class',function(d) {return "topLayer " + "col_"+d.xg + " row_" + d.yg ;})
                .attr("id", "trueDist")
                .attr("r", 10)
                .attr('fill','white')

                .attr('stroke','lightgrey')
                .attr("cx", function(d) {return (0.8*x(d.xg)) + 58})
                .attr("cy", function(d) {return (0.8*y(d.yg)) + 125})
                .style("opacity", 0.5);
            })// circle100_paint csv end
        
        
        d3.csv("xg,yg.csv",function(error, data) {
            $.each(data, function(i,d) {
                d3.selectAll(".topLayer").filter(".col_"+d.xg).filter(".row_" + d.yg)
                .attr("fill", "green")
                .attr("stroke", "lightgreen")
                .attr("id", "trueDist")
                .style("opacity", 0.6);
            })
        }) //xg,yg csv end 
    } //trueDistPaint() end

    
    
    

    line_ev.paint_circle_top_100 = function() { 
        click_change_color = false;
        click_set_height = true;
        can_edit = false;
        d3.select("#next").on("click", chart.finalCountArr);
        var origClass;
        var mouse;
        var cxL;
        var cyL;

        
        d3.csv("circle100.csv",function(error, data) {
            d3.select('svg').selectAll(".dot")
                .data(data)
                .enter().append("circle")
                .filter(function(d,i) { return d.yg < 18 })
                .attr('class',function(d) {return "clickableCircle " + "circle_col_"+d.xg + " circle_row_" + d.yg ;})
                .attr("r", 10)
                .attr('fill','white')
                .attr('stroke','lightgray')
                .attr("cx", function(d) {return x(d.xg) + 60})
                .attr("cy", function(d) {return y(d.yg) + 15})
                .on({
                    "mouseover": function(d) {
                    d3.select(this).style("cursor", "pointer")
                    },
                    "mouseout": function(d) {
                    d3.select(this).style("cursor", "default")
                    }
                })
                .on ("click", function(){
                    if (d3.event.defaultPrevented) return;
                    currentlyActive = CountActiveCircle();        
                    if (d3.select(this).attr("fill") == "white"){
                        d3.select(this).classed("activeCircle", true);
                        if ( currentlyActive < 101) {  
                            d3.select(this).attr("fill", "steelblue") 
                            changeCountActiveCircle()
                        } else {
                            d3.select(this).attr("fill", "red")
                            changeCountActiveCircle()
                        }
                      } 
                    else {
                        d3.select(this).attr("fill", "white")
                        d3.select(this).classed("activeCircle", false);
                        changeCountActiveCircle()
                    }
                
                    currentlyActive = CountActiveCircle();
                    
                    if ( currentlyActive >= 101) { 
                        d3.select("svg").selectAll(".activeCircle").attr("fill", "red")
                            $('#feedbackmsg').text("You're out of circles! Undo some selected circles by dragging over them or click \"Try Again\" to start over!")

                    } else {
                        $('#feedbackmsg').empty()
                            d3.select("svg").selectAll(".activeCircle").attr("fill", "steelblue")  
                    } 
                
                    changeCountActiveCircle();
                }) //end onclick()
                .call(drag);
        }) //csv end

        
        var drag = d3.behavior.drag()
            .on("dragstart", function(){
                mouse = d3.mouse(this);
                cxL = mouse[0];
                cyL = mouse[1];
                origClass = d3.select(this).attr("class").split(" ")[3];
            })

            .on("drag", function(d,i){
                mouse = d3.mouse(this);

                cxL = mouse[0];
                cyL = mouse[1];

                headhereXgrid = Math.floor(Math.round(x.invert((mouse)[0] - 50)))
                headhereYgrid = Math.floor(Math.round(y.invert((mouse)[1])))

                currentlyActive = CountActiveCircle();

                if ( currentlyActive < 101) { 
                    $('#feedbackmsg').empty()
                    d3.select("svg").selectAll(".activeCircle").attr("fill", "steelblue")
                } else {
                    $('#feedbackmsg').text("You're out of circles! Undo some selected circles by dragging over them or click \"Try Again\" to start over!")
                    d3.select("svg").selectAll(".activeCircle").attr("fill", "red")
                }

                changeCountActiveCircle()
                if (origClass == "activeCircle"){
                    eraseMode();
                }
                else{
                    paintMode();
                }
            })// end ondrag


        function paintMode () {
            currentlyActive = CountActiveCircle();

            d3.select("svg").selectAll(".clickableCircle")
            .each(function(){
                if ((d3.select(this).classed("circle_col_"+(headhereXgrid))) && (d3.select(this).classed("circle_row_"+headhereYgrid))){
                    d3.select(this).classed("activeCircle", true);
                    if ( currentlyActive < 101) {  
                        d3.select(this).attr("fill", "steelblue")             
                    } else {
                        d3.select(this).attr("fill", "red")
                    }
                }
            })
        } // end paintmode()


        function eraseMode () {
            d3.select("svg").selectAll(".clickableCircle")
            .each(function(){
              //erase everything above what the user goes over
                if ((d3.select(this).classed("circle_col_"+(headhereXgrid))) && (d3.select(this).classed("circle_row_"+headhereYgrid))){
                    d3.select(this).attr("fill", "white")
                    d3.select(this).classed("activeCircle", false);
                }
            })
        } // end erasemode()


        dataKeyPaint100 = x100.ticks().map(x)
        $.each(dataKeyPaint100, function(i, d) {
            dataKeyPaint100[i] = d;
        })

        
        function tickForBallNew(pt) {
            pt = svg_to_chart(pt);
            pt[0] = find_closest(dataKeyPaint100, pt[0]);
            pt[1] = find_closest(dataKeyPaint100, pt[1]);
            new_point = [pt[0], pt[1]]
            return new_point;    
        }

    } // end paint_circle_top_100



    
    
    line_ev.paint_circle_top = function() { 

        click_change_color = false;
        click_set_height = true;
        can_edit = false;
        d3.select("#next").on("click", chart.finalCountArr);
        var origClass;
        var mouse;
        var cxL;
        var cyL;
        
        d3.csv("circle100.csv",function(error, data) {
            d3.select('svg').selectAll(".dot")
                .data(data)
                .enter().append("circle")
                .filter(function(d,i) { if (d.xg % 2 ==0) { return d.xg; }})
                .filter(function(d,i) { return d.yg < 10})
                .attr('class',function(d) {return "clickableCircle " + "circle_col_"+(d.xg/2) + " circle_row_" + d.yg ;})
                .attr("r", 20)
                .attr('fill','white')
                .attr('stroke','lightgray')
                .attr("cx", function(d) {return x(d.xg) + 75;})
                .attr("cy", function(d) {return y(d.yg)*(1.8) - 415;})
                .on({
                    "mouseover": function(d) {
                    d3.select(this).style("cursor", "pointer")
                    },
                    "mouseout": function(d) {
                    d3.select(this).style("cursor", "default")
                    }
                })
                .on ("click", function(){
                    if (d3.event.defaultPrevented) return;
                    currentlyActive = CountActiveCircle();        
                    if (d3.select(this).attr("fill") == "white"){
                        d3.select(this).classed("activeCircle", true);
                        if ( currentlyActive < 21) { 
                            d3.select(this).attr("fill", "steelblue") 
                            changeCountActiveCircle()
                        } else {
                            d3.select(this).attr("fill", "red")
                            changeCountActiveCircle()
                        }
                      } else {
                          d3.select(this).attr("fill", "white")
                          d3.select(this).classed("activeCircle", false);
                          changeCountActiveCircle()
                      }
                
                    currentlyActive = CountActiveCircle();

                    if ( currentlyActive >= 21) {
                        d3.select("svg").selectAll(".activeCircle").attr("fill", "red")
                        $('#feedbackmsg').text("You're out of circles! Undo some selected circles by dragging over them or click \"Try Again\" to start over!")
                      }
                    else {
                        $('#feedbackmsg').empty()
                        d3.select("svg").selectAll(".activeCircle").attr("fill", "steelblue")  
                    }
                
                    changeCountActiveCircle();
                }) // end onclick
                .call(drag);
        }) //csv end

        
        var drag = d3.behavior.drag()
                    .on("dragstart", function(){
                        mouse = d3.mouse(this);
                        cxL = mouse[0];
                        cyL = mouse[1];
                        origClass = d3.select(this).attr("class").split(" ")[3];
                    })

                    .on("drag", function(d,i){
                        mouse = d3.mouse(this);
                        cxL = mouse[0];
                        cyL = mouse[1];
                        headhereXgrid = Math.floor(Math.ceil(x.invert(tickForBallNew(mouse)[0]) + 1.2) / 2)
                        headhereYgrid = Math.floor(Math.round(y.invert(tickForBall(mouse)[1]))/2)
        
                        currentlyActive = CountActiveCircle();

                        if ( currentlyActive < 21) { 
                            $('#feedbackmsg').empty()
                            d3.select("svg").selectAll(".activeCircle").attr("fill", "steelblue")
                        } else {
                            $('#feedbackmsg').text("You're out of circles! Undo some selected circles by dragging over them or click \"Try Again\" to start over!")
                            d3.select("svg").selectAll(".activeCircle").attr("fill", "red")
                        }

                        changeCountActiveCircle()
                        if (origClass == "activeCircle"){
                            eraseMode();
                        }
                        else{
                            paintMode();
                        }
                    }) // end ondrag


        function paintMode() {
            currentlyActive = CountActiveCircle();
            d3.select("svg").selectAll(".clickableCircle")
            .each(function(){
                if ((d3.select(this).classed("circle_col_"+(headhereXgrid - 1))) && (d3.select(this).classed("circle_row_"+headhereYgrid))){
                    d3.select(this).classed("activeCircle", true);
                    if ( currentlyActive < 21) {  
                        d3.select(this).attr("fill", "steelblue")             
                    } else {
                        d3.select(this).attr("fill", "red")
                    }
                }
            })
        } // end paintmode()


        function eraseMode () {
            d3.select("svg").selectAll(".clickableCircle")
            .each(function(){
            //erase everything above what the user goes over
                if ((d3.select(this).classed("circle_col_"+(headhereXgrid - 1))) && (d3.select(this).classed("circle_row_"+headhereYgrid))){
                    d3.select(this).attr("fill", "white")
                    d3.select(this).classed("activeCircle", false);
                }
            })
        } // end erasemode()


        function tickForBallNew(pt) {
            pt = svg_to_chart(pt);
            pt[0] = find_closest(dataKeyForPaintCircle, pt[0]);
            pt[1] = find_closest(dataKeyForPaintCircle, pt[1]);
            //      console.log("dataKeyForPaintCircle",dataKeyForPaintCircle)
            new_point = [pt[0], pt[1]]
            return new_point    
        } // end tickforballnew()

        
        var activeArr = [];

    } // end paint_circle_top




    
    line_ev.roll_circle = function () {
        console.log("in roll_circle")
        var dataArray = {};
        var minimumHeightArrayRoll20;
        
        click_change_color = false;
        click_set_height = false;
        can_edit = false;
           
        $(function () {
            setTimeout(function () {
               createCircle();
            }, 5);
        });
        
        function createCircle() {
            
        
        d3.csv("circle100.csv",function(error, data) {
            console.log(data);
            
            d3.select('svg').selectAll(".dot")
                .data(data)
                .enter().append("circle")
                .filter(function(d,i) { if (d.xg % 2 ==0) { console.log("dlksjdlfijselij:,", d.xg);return d.xg; }})
                .filter(function(d,i) { if (d.yg % 2 ==0) {dataKeyForRollCircleY[i] = y(d.yg) + 10;}
                                        if ((d.yg % 2 ==0) && (d.yg < 3)) { return d.yg; }}
                                        )
                .attr("r", 20)
                .attr('id',function(d){return d.xg + d.yg})
                .attr('class',function(d) {return "activeCircle " + "circle_col_"+d.xg ;})
                .attr('fill','steelblue')
                .attr("cx", function(d, i) {
                                dataKeyForRollCircle[i] = x(d.xg) + 80;
                                return dataKeyForRollCircle[i]
                            })
                .attr("cy", function(d, i) {
                                return y(d.yg) + 10;
                            })
                .on({
                    "mouseover": function(d) {
                        d3.select(this).style("cursor", "pointer")
                    },
                    "mouseout": function(d) {
                        d3.select(this).style("cursor", "default")
                    }
                })
                .call(drag);
        }) //csv end
        }
        console.log("datakeyx", dataKeyForRollCircle)
        console.log("datakeyy", dataKeyForRollCircleY)
        
        
        function minimumHeightRoll20(columnClass, thisO) {
            minimumHeightArrayRoll20 = [];
            d3.select("svg").selectAll("." + columnClass)
            .each(function(){
                if ((thisO.attr('cy') != d3.select(this).attr('cy')) && (d3.select(this).attr('cy') < 550)) {
                    minimumHeightArrayRoll20.push(d3.select(this).attr('cy'));
                } 
            })
            if (minimumHeightArrayRoll20.length == 0) {
                return 540; // first row 
            } else {
                return parseFloat(Math.min.apply(null,minimumHeightArrayRoll20));
            }
        } //end minimumHeightRoll20


        var headhereX;
        var headhereY;
        var origCol;
        var headColumnClass;
        var minHt;
        var origX;
        var origY;
        var startDrag;
        var endDrag;
        var drag = d3.behavior.drag()
                .on("drag", function(d,i) {
                    var mouse = d3.mouse(this);
                    var cxL = mouse[0];
                    var cyL = mouse[1];
                    if (cxL < 100) {
                        headhereXgrid = 0;
                    }
                    else if (Math.floor(x.invert(tickForBallRoll20(mouse)[0] + 50)) % 2 == 0)  {
                        headhereXgrid = Math.floor(x.invert(tickForBallRoll20(mouse)[0])) - 2;
                    } else {
                        headhereXgrid = Math.floor(x.invert(tickForBallRoll20(mouse)[0])) + 1 - 2;
                    }
                    d3.select(this).attr("cx",cxL).attr("cy",cyL);
                })// end ondrag

                .on("dragstart", function(){
                    var d = new Date();
                    startDrag  = d.getTime();
                    var mouse = d3.mouse(this);
                    var cxL = mouse[0];
                    var cyL = mouse[1];
                    origX = d3.select(this).attr("cx")
                    origY = d3.select(this).attr("cy")
                    origCol = d3.select(this).attr("class").split(" ")[1]
                    if (cxL < 100) {
                        headhereXgrid = 0;
                    }
                    else if (Math.floor(x.invert(tickForBallRoll20(mouse)[0] + 50)) % 2 == 0)  {
                        headhereXgrid = Math.floor(x.invert(tickForBallRoll20(mouse)[0])) - 2;
                    } else {
                        headhereXgrid = Math.floor(x.invert(tickForBallRoll20(mouse)[0])) + 1 - 2;
                    }
                    minHt = minimumHeightRoll20("circle_col_"+headhereXgrid, d3.select(this));
                })// end ondragstart

                .on("dragend", function(d,i) {
                    var d = new Date();
                    endDrag = d.getTime();
                    duration = endDrag - startDrag
                    if (duration > 150) {
                        var mouse = d3.mouse(this);
                        var cxL = mouse[0];
                        var cyL = mouse[1];

                        if (cxL < 100) {
                            headhereXgrid = 0;
                        }
                        else if (cxL > 540){
                            headhereXgrid = 18;
                        }
                        else if (Math.floor(x.invert(tickForBallRoll20(mouse)[0] + 50)) % 2 == 0)  {
                            headhereXgrid = Math.floor(x.invert(tickForBallRoll20(mouse)[0])) - 2;
                        } 
                        else {
                            headhereXgrid = Math.floor(x.invert(tickForBallRoll20(mouse)[0])) + 1 - 2;
                        }

                        d3.select(this)
                            .classed (d3.select(this).attr("class").split(" ")[1], false)
                            .classed ("circle_col_" + headhereXgrid, true)

                        //gravitize
                        d3.selectAll("."+origCol)
                        .each(function(d, i){
                            var thisBallY = d3.select(this).attr("cy");
                            if (parseFloat(thisBallY) < parseFloat(origY)){
                                d3.select(this).attr("cy", parseFloat(thisBallY) + 56);
                            };
                        })


                        minHt = minimumHeightRoll20("circle_col_"+headhereXgrid, d3.select(this));

                        d3.select(this).transition()
                        .attr("cx", function(){
                            if ((((tickForBall2Roll20(minHt) - 30) < 545) && ((tickForBall2Roll20(minHt) - 30) > 0)) && (minHt > 93)){
                                return dataKeyForRollCircle[headhereXgrid];

                            }
                            else {
                                return origX;
                            }
                        })  //cx
                        .attr("cy",function(){
                            if (((tickForBall2Roll20(minHt) - 30) < 545) && ((tickForBall2Roll20(minHt) - 37) > 0) && (minHt > 93)){
                                if (origCol ==  "circle_col_" + headhereXgrid) {
                                    minHt = minimumHeightRoll20(origCol, d3.select(this));
                                }
                                if (minimumHeightArrayRoll20.length == 0) 
                                {
                                    return (540); 
                                }                       

                                if (((tickForBall2Roll20(minHt)) < 550) && ((tickForBall2Roll20(minHt)-37) > 0)) {
                                    return (tickForBall2Roll20(minHt));
                                } else {
                                    if (parseFloat(origY) == parseFloat(minHt)){
                                        return parseFloat(minHt)-20;
                                    }
                                    else {
                                        setOriginalClassRoll20(d3.select(this));
                                        minHt = minimumHeight(d3.select(this).attr("class").split(" ")[1], d3.select(this));
                                        return parseFloat(tickForBall2Roll20(minHt) - 20);
                                    }
                                }
                            } else {
                                minHt = minimumHeightRoll20(origCol, d3.select(this));
                                setOriginalClassRoll20(d3.select(this));
                                return (tickForBall2Roll20(minHt));
                            }
                        }) // cy
                    }//duration end 
                    else {
                        d3.select(this).transition()
                        .attr("cx",origX)
                        .attr("cy",origY)
                    }
                }) // on dragend end

         
        function setOriginalClassRoll20(thisO){
            thisO.classed (thisO.attr("class").split(" ")[1], false)
            thisO.classed (origCol, true)
        }

        function tickForBall2Roll20(pt, arr) {
            pt = pt - margin.top
            new_point = find_closest(dataKeyForRollCircleY, pt);
            if (minimumHeightArrayRoll20.length == 0)  {
                return 540
            } else {
                return parseFloat(new_point);    
            }
        } // tickForball2Roll20 end

        
        function tickForBallRoll20(pt) {
            pt = svg_to_chart(pt);
            pt[0] = find_closest(dataKeyForRollCircle, pt[0]);
            pt[1] = find_closest(dataKeyForRollCircleY, pt[1]);
            new_point = [pt[0], pt[1]]
            return new_point    
        } // tickForballRoll20 end

    } //end rollcircle

    
    
    

    line_ev.roll_circle_100 = function () {
        var dataArray = {};
        click_change_color = false;
        click_set_height = false;
        can_edit = false;

        d3.csv("circle100.csv",function(error, data) {
            d3.select('svg').selectAll(".dot")
                .data(data)
                .enter().append("circle")
                .filter(function(d,i) { dataKeyRoll100Y [i] = y(d.yg) + 20;
                                        return d.yg < 5; })
                .attr('class',function(d) {return "activeCircle " + "circle_col_"+d.xg ;})
                .attr("r", 10)
                .attr('fill','steelblue')
                .attr("cx", function(d, i) {
                                if (d.yg < 1){
                                dataKeyRoll100 [i] = x(d.xg) + 60;
                                }
                                return x(d.xg) + 60
                            })
                .attr("cy", function(d) {return y(d.yg) + 20})
                .on({
                    "mouseover": function(d) {
                        d3.select(this).style("cursor", "pointer")
                    },
                    "mouseout": function(d) {
                        d3.select(this).style("cursor", "default")
                    }
                    })
                .on("click", null)
                .on("dblclick", null)
                .call(drag);
          }) //csv end


        var minimumHeightArray;
        
        function minimumHeightRoll(columnClass, thisO) {
            minimumHeightArray = [];
            d3.select("svg").selectAll("." + columnClass)
            .each(function(){
                    if (thisO.attr('cy') != d3.select(this).attr('cy')) {
                    minimumHeightArray.push(d3.select(this).attr('cy'));
                    } 
            })
            if (minimumHeightArray.length == 0) {
                return 550; // first row 
            } else {
                return parseFloat(Math.min.apply(null,minimumHeightArray));
            }
        } //end minimumHeightRoll


        var headhereX;
        var headhereY;
        var origCol;
        var headColumnClass;
        var minHt;
        var origX;
        var origY;
        var startDrag;
        var endDrag;
        var drag = d3.behavior.drag()
                .on("drag", function(d,i) {
                    var mouse = d3.mouse(this);
                    var cxL = mouse[0];
                    var cyL = mouse[1];

                   if (cxL < 70) {
                        headhereXgrid = 0;
                    } else if (cxL < 100) {
                        headhereXgrid = 1;
                    } else if (cxL > 540) {
                        headhereXgrid = 19;
                    }
                    else {
                        headhereXgrid = Math.floor(x.invert(tickForBallRoll(mouse)[0]));
                    }
                    d3.select(this).attr("cx",cxL).attr("cy",cyL);
                })

                .on("dragstart", function(){
                    var d = new Date();
                    startDrag  = d.getTime();
                    origX = d3.select(this).attr("cx")
                    origY = d3.select(this).attr("cy")
                    origCol = d3.select(this).attr("class").split(" ")[1]
                })

                .on("dragend", function(d,i) {
                    var d = new Date();
                    endDrag = d.getTime();
                    duration = endDrag - startDrag
                    if (duration > 100) {
                        var mouse = d3.mouse(this);
                        var cxL = mouse[0];
                        var cyL = mouse[1];

                        if (cxL < 70) {
                            headhereXgrid = 0;
                        } else if (cxL < 100) {
                            headhereXgrid = 1;
                        } else if (cxL > 540) {
                            headhereXgrid = 19;
                        }
                        else {
                            headhereXgrid = Math.floor(x.invert(tickForBallRoll(mouse)[0]));
                        }


                        //gravitize
                        d3.selectAll("."+origCol)
                        .each(function(d, i){
                            var thisBallY = d3.select(this).attr("cy");
                            if (parseFloat(thisBallY) < parseFloat(origY))
                            {
                                d3.select(this).attr("cy", parseFloat(thisBallY) + 28);
                            };
                        })

                        minHt = minimumHeightRoll("circle_col_"+headhereXgrid, d3.select(this));

                        d3.select(this).transition()
                        .attr("cx", function(){
                            if (((tickForBall2Roll100(minHt) - 30) < 545) && ((tickForBall2Roll100(minHt) - 30) > 0)){
                                return dataKeyRoll100[5*headhereXgrid];
                            }
                            else {
                                setOriginalClass(d3.select(this));
                                return origX;
                            }
                        })  //cx

                        .attr("cy",function(){
                            minHt = minimumHeightRoll("circle_col_"+headhereXgrid, d3.select(this));
                            if (((tickForBall2Roll100(minHt)) < 555) && (tickForBall2Roll100(minHt) - 30 > 0)) {
                                d3.select(this)
                                .classed (d3.select(this).attr("class").split(" ")[1], false)
                                .classed ("circle_col_" + headhereXgrid, true)
                                return (tickForBall2Roll100(minHt));
                            } else 
                            {                             
                                setOriginalClass(d3.select(this));
                                minHt = minimumHeight(origCol, d3.select(this));
                                return (tickForBall2Roll100(minHt));
                            }
                            if (minimumHeightArray.length == 0) 
                            {
                                d3.select(this)
                                .classed (d3.select(this).attr("class").split(" ")[1], false)
                                .classed ("circle_col_" + headhereXgrid, true)
                                return (550);
                            }
                          }) // cy
                    } //duration end
                    else {
                      d3.select(this).transition()
                        .attr("cx",origX)
                        .attr("cy",origY)
                    }
                }) // on dragend end

         
        function setOriginalClass(thisO){
            thisO.classed (thisO.attr("class").split(" ")[1], false)
            thisO.classed (origCol, true)
        }

        
        function tickForBall2Roll100(pt, arr) {
            pt = pt - margin.top
            new_point = find_closest(dataKeyRoll100Y, pt);
            if (minimumHeightArray.length == 0)  {
                return 550 
            } else {
                return parseFloat(new_point);    
            }
        } // tickForball2Roll100 end

        
        function tickForBallRoll(pt) {
            pt = svg_to_chart(pt);
            pt[0] = find_closest(dataKeyRoll100, pt[0]);
            pt[1] = find_closest(dataKeyRoll100Y, pt[1]);
            new_point = [pt[0], pt[1]]
            return new_point    
        }

    } //end rollcircle_100


    
    
    
    function tickForBall(pt) {
        pt = svg_to_chart(pt);
        pt[0] = find_closest(dataKeyX, pt[0]);
        pt[1] = find_closest(dataKeyY, pt[1]);
        new_point = [pt[0], pt[1]]
        return new_point    
    }

    function tickForBallNew(pt) {
        pt = svg_to_chart(pt);
        pt[0] = find_closest(dataKeyA, pt[0]);
        pt[1] = find_closest(dataKeyB, pt[1]);
        new_point = [pt[0], pt[1]]
        return new_point    
    }

    
    
    

    line_ev.draw_distribution = function () {
    }

    

    
    
    function createArrow(direction, bufferX, bufferY) {
        var pointArrayUp = [10,3,0,10,0,14,10,7,20,14,20,10];
        var pointArrayDown = [0,3,0,7,10,14,20,7,20,3,10,10];
        var thisArray;
        if (direction == "p") {
            thisArray = pointArrayUp;
        } else {
            thisArray = pointArrayDown;
        }
        var finalPointString = '';
        for (i = 0; i < thisArray.length; i++) {
            if (i === 0) {
                finalPointString += (parseFloat(thisArray[i]) + bufferX);
            }
            else if (i % 2 === 0) {
                finalPointString += " " + (parseFloat(thisArray[i]) + bufferX);
            } else {
                finalPointString += "," + (parseFloat(thisArray[i]) + bufferY);
            }
        }
        return finalPointString;
    }// end createArrow
    
    
    
    

    line_ev.pull_circle_no_limit = function () {
        click_change_color = false;
        click_set_height = false;
        can_edit = false;
        d3.csv("circle100.csv",function(error, data) {
            d3.select('svg').selectAll(".dot")
                .data(data)
                .enter().append("circle")
                .filter(function(d,i) { if (d.xg % 2 ==0) { return d.xg; }})
                .attr("r", 20)
                .attr('class',function(d) {return "clickableCircle " + "circle_col_"+d.xg + " circle_row_" + d.yg ;})
                .attr('fill','white')
                .attr("cx", function(d) {return x(d.xg) + 70;})
                .attr("cy", function(d) {return (y(d.yg)*1.6) - 310;})
        }) //csv end

        
        $(function () {
            setTimeout(function () {
               createArrow();
            }, 5);
        });

        
        function createArrow() {
            d3.csv("circle100.csv",function(error, data) {
                d3.select('svg').append("g")
                .selectAll(".rect")
                .data(data)
                .enter().append("rect")
                .filter(function(d,i) { if (d.xg % 2 ==0) { return d.xg; }})
                .filter(function(d,i) { return d.yg < 1})
                .attr('class',function(d) {return "arrows " + "circle_col_"+ d.xg;})
                .attr("id", "arrows")
                .attr("width", 10)
                .attr("height", 10)
                .attr("x", function (d) {return x(d.xg) + 65;})
                .attr("y", 540) 
                .attr("fill","orange")
                .on({
                  "mouseover": function(d) {
                      if (trueShown){
                          return;
                      } else {
                        d3.select(this).style("cursor", "pointer")
                      }
                  },
                  "mouseout": function(d) {
                      d3.select(this).style("cursor", "default")
                  }
                })
                .call(drag);
            }) //csv end
        } // end createArrow
        

        d3.select('svg').append("g")
            .append("rect")
            .attr("class", "btn")
            .attr("width", 115)
            .attr("height", 30)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("x", 550)
            .attr("y", 620) 
            .attr("fill","white")
            .attr("stroke", "orange")
            .attr("stroke-width", 2)
            .on ("mouseover", function(d) {d3.select(this).style("cursor", "pointer")})
            .on("click", function(){
                var active   = arrows.active ? false : true,
                newOpacity = active ? 0 : 1;
                // Hide or show the elements
                d3.selectAll("#arrows").style("opacity", newOpacity);
                // Update whether or not the elements are active
                arrows.active = active;
            })

        
        d3.select('svg')        
            .append("text")
            .text("Show/Hide handles")
            .attr("fill", "steelblue")
            .attr("x", 555)
            .attr("y", 640)

        
        var finalPos;
        var mouse;
        var currentlyActive;
        var drag = d3.behavior.drag()
        .on("drag", function() {
            if (trueShown){
                return;
            } else
            {
                changeCountActiveCircle();
                mouse = d3.mouse(this);
                arrow = d3.select(this)
                var cyL = mouse[1];
                var currentColClass = d3.select(this).attr("class").split(" ")[1]
                if ((10 <= cyL) && (cyL <= 550)){
                    currentlyActive = CountActiveCircle();
                    circleInSelectedColumn = d3.selectAll("."+currentColClass).filter(".activeCircle").size()
                    cyL = mouse[1];

                    var currentColor = d3.select("svg").selectAll(".clickableCircle").filter("."+currentColClass).attr("fill");
                    d3.select("svg").selectAll(".clickableCircle").filter("."+currentColClass)                  
                        .attr("fill",function(d) {
                            if (1 <= parseFloat(cyL)) {
                                arrow.attr('y',cyL)
                                if (parseFloat(d3.select(this).attr('cy')) >= ( cyL)) {
                                    currentlyActive = CountActiveCircle();
                                    if(currentlyActive <=20) {
                                        d3.select(this).classed("activeCircle", true);
                                        d3.selectAll(".activeCircle").attr("fill", "steelblue");
                                        return "steelblue"; 
                                    } else{
                                        d3.select(this).classed("activeCircle", true);
                                        d3.selectAll(".activeCircle").attr("fill", "red");
                                        return "red";
                                    }
                                } else {
                                    d3.select(this).classed("activeCircle", false);
                                    return "white"; 
                                }
                                currentlyActive = CountActiveCircle();
                          } 
                            else {
                                if (parseFloat(d3.select(this).attr('cy')) >= 1) {
                                    d3.select(this).classed("activeCircle", true);
                                    return "steelblue";
                                } else {
                                    d3.select(this).classed("activeCircle", false);
                                    return "white"; 
                                } 
                            }
                        }) //end fill function
                }// end margin if 
            }
        })// end onDrag
        
        .on("dragend", function() {
            if(currentlyActive >= 20) {
                $('#feedbackmsg').text("You're out of circles! Undo some selected circles by dragging down or click \"Try Again\" to start over!")
            } else {
                $('#feedbackmsg').empty()
            }
        })
    } // end pull_circle_no_limit
    
    
    
    
    
    line_ev.trueDist = function () {
        trueShown = "yes";
        d3.csv("circle100.csv",function(error, data) {
            d3.select('svg').selectAll(".activeCircle")
            .style("opacity", 0.6);
        })// circle100_paint csv end

        d3.csv("xg,yg.csv",function(error, data) {
            d3.select('svg').selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("r", 20)
            .attr('class',function(d) {return "trueLayer" + "circle_col_"+d.xg + " circle_row_" + d.yg ;})
            .attr("cx", function(d) {return x(d.xg) + 70;})
            .attr("cy", function(d) {return (y(d.yg)*1.6) - 310;})
            .attr("fill", "green")
            .attr("stroke", "lightgreen")
            .attr("id", "trueDist")
            .style("opacity", 0.4);
        }) //xg,yg csv end 
    } //trueDist() end

    
    
    
    
    line_ev.pull_circle_100 = function () {
        click_change_color = false;
        click_set_height = false;
        can_edit = false;
        d3.csv("circle100.csv",function(error, data) {
            d3.select('svg').selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("r", 10)
            .attr('class',function(d) {return "clickableCircle " + "circle_col_"+d.xg + " circle_row_" + d.yg ;})
            .attr('fill','white')
            .attr("cx", function(d) {return x(d.xg) + 60;})
            .attr("cy", function(d) {return y(d.yg) + 15;})
        }) //csv end


        $(function () {
            setTimeout(function () {
            createArrow();
            }, 5);
        });


        function createArrow() {
            d3.csv("circle20Pull.csv",function(error, data) {
                d3.select('svg').append("g")
                .selectAll(".rect")
                .data(data)
                .enter().append("rect")
                .attr('class',function(d) {return "arrows " + "circle_col_"+ d.xg;})
                .attr("id", "arrows")
                .attr("width", 10)
                .attr("height", 10)
                .attr("x", function (d) {
                return x(d.xg)+55;})
                .attr("y", 540) 
                .attr("fill","orange")
                .on({
                "mouseover": function(d) {
                    d3.select(this).style("cursor", "pointer")
                },
                "mouseout": function(d) {
                    d3.select(this).style("cursor", "default")
                }
                })
                .call(drag);
            }) //csv end
        }


        d3.select('svg').append("g")
        .append("rect")
        .attr("class", "btn")
        .attr("width", 115)
        .attr("height", 30)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("x", 550)
        .attr("y", 620) 
        .attr("fill","white")
        .attr("stroke", "orange")
        .attr("stroke-width", 2)
        .on ("mouseover", function(d) {d3.select(this).style("cursor", "pointer")})
        .on("click", function(){
            var active   = arrows.active ? false : true,
            newOpacity = active ? 0 : 1;
            // Hide or show the elements
            d3.selectAll("#arrows").style("opacity", newOpacity);
            // Update whether or not the elements are active
            arrows.active = active;
        })

        d3.select('svg')        
        .append("text")
        .text("Show/Hide handles")
        .attr("fill", "steelblue")
        .attr("x", 555)
        .attr("y", 640)

        var finalPos;
        var mouse;
        var currentlyActive;
        var drag = d3.behavior.drag()
        .on("drag", function() {
            changeCountActiveCircle();
            mouse = d3.mouse(this);
            arrow = d3.select(this)
            var cyL = mouse[1];
            var currentColClass = d3.select(this).attr("class").split(" ")[1]
            if ((10 <= cyL) && (cyL <= 550)){
                currentlyActive = CountActiveCircle();
                circleInSelectedColumn = d3.selectAll("."+currentColClass).filter(".activeCircle").size()
                cyL = mouse[1];
                var currentColor = d3.select("svg").selectAll(".clickableCircle").filter("."+currentColClass).attr("fill");
                d3.select("svg").selectAll(".clickableCircle").filter("."+currentColClass)                  
                .attr("fill",function(d) {
                    if (1 <= parseFloat(cyL)) {
                        arrow.attr('y',cyL)
                        if (parseFloat(d3.select(this).attr('cy')) >= ( cyL)) {
                            currentlyActive = CountActiveCircle();
                            if(currentlyActive <=100) {
                                d3.select(this).classed("activeCircle", true);
                                d3.selectAll(".activeCircle").attr("fill", "steelblue");
                                return "steelblue"; 
                            } else{
                                d3.select(this).classed("activeCircle", true);
                                d3.selectAll(".activeCircle").attr("fill", "red");
                                return "red";
                            }
                        } else {
                            d3.select(this).classed("activeCircle", false);
                            return "white"; 
                        }
                        currentlyActive = CountActiveCircle();
                    } 
                    else {
                        if (parseFloat(d3.select(this).attr('cy')) >= 1) {
                            d3.select(this).classed("activeCircle", true);
                            return "steelblue"; 
                        } else {
                            d3.select(this).classed("activeCircle", false);
                            return "white"; 
                        } 
                    }
                }) //end fill function
              }// end margin if 
        })// end onDrag

        .on("dragend", function() {
            if(currentlyActive == 100) {
                $('#feedbackmsg').text("You're out of circles! Undo some selected circles by drgging down or click \"Try Again\" to start over!")
            } else {
                $('#feedbackmsg').empty()
            }
        })
  } // end pull_circle_100


    
    

    line_ev.draw_distribution_fill = function () {
        click_change_color = false;
        click_set_height = false;
        can_edit = false;

        var width = 710,
            height = 670,
            coords = [],
            colNum,
            index,
            xInit,
            xInitArr = [];

        var drag = d3.behavior.drag()
          .origin(Object)
          .on("dragstart", function(){ 
              colNum = d3.select(this).attr("class").split("circle_col_") [1];
              index = colNum/2;

          })

          .on("drag", function(){ 
              if (trueShown) {
                          return;
                      } else {

              d3.select(this).attr("width",20)
              d3.select(this).attr("height",20)
              dragmove(this, index)
                      }; 
          })

          .on("dragend", function(){ 
              if (trueShown) {
                          return;
              } else {

              d3.select(this).attr("width",15)
              d3.select(this).attr("height",15)
              }
          })

        var line = d3.svg.line()


        var lineContainer, hideOverflowLayer;
        d3.csv("fillDist.csv", function(error, data) {
            d3.select('svg').append("g")
                .append("rect")
                .attr("class", "btn")
                .attr("width", 115)
                .attr("height", 30)
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("x", 550)
                .attr("y", 620) 
                .attr("fill","white")
                .attr("stroke", "orange")
                .attr("stroke-width", 2)
                .on ("mouseover", function(d) {d3.select(this).style("cursor", "pointer")})
                .on("click", function(){
                    var active   = arrows.active ? false : true,
                    newOpacity = active ? 0 : 1;
                    // Hide or show the elements
                    d3.selectAll("#arrows").style("opacity", newOpacity);
                    // Update whether or not the elements are active
                    arrows.active = active;
                })

            d3.select('svg')        
                .append("text")
                .text("Show/Hide handles")
                .attr("fill", "steelblue")
                .attr("x", 555)
                .attr("y", 640)



            lineContainer = d3.select('svg').append('g').attr('class', "line-container");
            hideOverflowLayer = d3.select('svg').append('g').attr('class', "hideOverflowLayer");


            var arrows = 
                d3.select("svg").selectAll(".arrows")
                coords.push([46, 560])
                for(var i = 0; i < arrows[0].length; i++) {
                    var x1 = +arrows[0][i].attributes.x.value + 8;
                    var y1 = +arrows[0][i].attributes.y.value + 8;
                    var linepoints = [x1, y1]
                    coords.push(linepoints);
                }

            lineContainer.append('path')
                        .datum(coords)
                        .attr('class', "line")
                        .attr("d", line)
            
            hideOverflowLayer.append("rect")
            .attr("id", "hideOverflowLayer")
            .attr("width", 560)
            .attr("height", 50)
            .attr("x", 30)
            .attr("y", 561)
            .attr("fill", "white");

            d3.select('svg').append("g")
                .selectAll(".rect")
                .data(data).enter().append("rect")
                .attr('class',function(d) {return "arrows " + "circle_col_" + d.xg;})
                .attr("id", "arrows")
                .attr("width", 15)
                .attr("height", 15)
                .attr("x", function (d) {
                xInitArr.push(x(d.xg) + 68);
                return x(d.xg) + 68;})
                .attr("y", 552)  
                .attr("fill","orange")
                .on({
                "mouseover": function(d) {
                    if (trueShown) {
                        return;
                    } else {
                        d3.select(this).style("cursor", "pointer")
                        d3.select(this).attr("width",20)
                        d3.select(this).attr("height",20)
                    }
                },
                "mouseout": function(d) {
                    if (trueShown) {
                        return;
                    } else {
                        d3.select(this).style("cursor", "default")
                        d3.select(this).attr("width",15)
                        d3.select(this).attr("height",15)
                    }
                }             
                })
                .call(drag);

            hideOverflowLayer.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(50, 560)")
            .call(xAxis.tickFormat(d3.format()))

        }) //csv end


        function dragmove(dragged, index) {
            if (trueShown){
                return;
            } else {
                var x = d3.select(dragged).attr("x");
                var y = d3.select(dragged).attr("y");
                var cx = Math.min(width, +x + d3.event.dx);
                var cy = Math.min(height, +y + d3.event.dy);
                var draggedArrows = [{ "x": cx, "y": cy }];

                d3.select(dragged)
                .data(function(d) {return draggedArrows;})
                .attr("x", function (d) {
                                          if ((d.x < (xInitArr[index] + 16)) && (d.x > (xInitArr[index] - 21))) 
                                          { 
                                              return d.x;
                                          } else if (d.x >= (xInitArr[index] + 16)) {
                                              return xInitArr[index] + 16
                                          } else if (d.x <= (xInitArr[index] - 21)) {
                                              return xInitArr[index] - 21
                                          }; })
                .attr("y", function (d) {  
                    if ((d.y <= 552) && (d.y >= 49)){
                    return d.y;
                    } else if (d.y >= 552) {
                        return 552;
                    } else if (d.y <= 49) {
                        return 49;
                    }
                    });
                redrawlines();
            }
        } //end dragmove

        line.interpolate("cardinal");

        function redrawlines() {
            var arrows = d3.select("svg").selectAll(".arrows")
            var obj = [];
            obj.push([46, 560])
            for(var i = 0; i < arrows[0].length; i++) {
                var x1 = +arrows[0][i].attributes.x.value + 8;
                var y1 = +arrows[0][i].attributes.y.value + 8;
                var linepointsnew = [x1, y1]
                    obj.push(linepointsnew);           
            }
            obj.push([563, 560])
            d3.select('.line-container').selectAll(".line")
                        .datum(obj)
                        .attr('class', "line")
                        .attr("fill", "steelblue")
                        .attr("d", line);        
        }//redraw end

    } // end draw_distribution_fill





line_ev.trueDistFill = function () {
    trueShown = "yes";
    
    d3.select("svg").selectAll(".line")
    .style("opacity", 0.5);

    d3.select("svg").append("path")
    .attr("class", "line")
    .attr("id","trueArea")
    .attr("d", "M46,560Q83.6421052631579,559.5,92,558C104.53684210526316,555.75,116.80526315789473,557.3,129.57894736842104,545S160.03421052631575,524.9,177.15789473684208,476S228.11315789473684,257.1,243.73684210526315,219S266.59210526315786,186,281.31578947368416,222S326.12105263157895,411.45,341.89473684210526,459S373.7,524.3,386.4736842105263,539S412.928947368421,554,427.05263157894734,557S465.1578947368421,558.55,480.6315789473684,559S517.8552631578946,559.85,530.2105263157894,560Q538.4473684210525,560.1,563,560")
    .attr("fill",'green')
    .attr("stroke", "green")
    .style("opacity", 0.5)
    .attr("y", 552) ;          
} //end truDistFill





    line_ev.plus_circle_50 = function () {
        click_change_color = false;
        click_set_height = false;
        can_edit = false;
        var bin_height = 500;
        var bin_width = 45;

        d3.select("svg")
            .append("g")
            .attr("transform", "translate(" + (margin.left) + "," + margin.top + ")");

        var triUp = d3.svg.symbol().type('triangle-up')
                        .size(80);

        var triDown = d3.svg.symbol().type('triangle-down')
                        .size(80);



        d3.csv("circle20.csv",function(error, data) {
            
            svg.selectAll(".grpAll")
            .data(data) 
             .enter().append("g")
             .attr('class','grpAll');

            svg.selectAll(".grpAll")
              .append("rect")
              .attr("x", function(d) {return (d.yg * 58) - 25;})
                  .attr("width", bin_width)
                  .attr("y", -40)
                  .attr("height", bin_height)
                  .attr("stroke", "orange")
                  .attr("fill", "none")
                  .attr("class", function(d) {return "bins "+ "bin_"+d.yg ;});

            svg.selectAll(".grpAll")
              .append("path")
              .attr("d", triUp)
                  .attr('transform',function(d){ return "translate("+((d.yg * 58) - 18)+","+(bin_height - 15)+")"; })
                  .attr("fill", "steelblue")
                  .attr("class", function(d) {return "bins "+ "button_add_"+d.yg ;})
                    .on({
                          "mouseover": function(d) {
                            d3.select(this).style("cursor", "pointer")
                          },
                          "mouseout": function(d) {
                            d3.select(this).style("cursor", "default")
                          }
                        })
                  .on("click", function(d){
                    var binNum = d3.select(this).attr("class").split(" button_add_")[1]
                    addCircles(binNum);
                  });


             svg.selectAll(".grpAll")
              .append("path")
              .attr("d", triDown)
              .attr("fill", "steelblue")
                  .attr('transform',function(d){ return "translate("+((d.yg * 58) + 12)+","+(bin_height - 15)+")"; })  
                  .attr("class", function(d) {return "bins "+ "button_sub_"+d.yg ;})
                    .on({
                          "mouseover": function(d) {
                            d3.select(this).style("cursor", "pointer")
                          },
                          "mouseout": function(d) {
                            d3.select(this).style("cursor", "default")
                          }
                        })
                  .on("click", function(){
                    var binNum = d3.select(this).attr("class").split(" button_sub_")[1]
                    if (i_array[binNum] == 19){
                      return
                    }
                    else{
                    remCircles(binNum);
                  }
                  });

            svg.selectAll(".grpAll")
                .attr("transform", "translate(" + 0 + "," + 10 + ")");

            svg.selectAll(".grpAll")
              .append("text")
                  .attr("x", function(d) {return (d.yg * 58) - 22;})
                  .attr("y", (bin_height - 26))
                  .text("+")
                  .attr("fill", "steelblue")
                  .attr("class", function(d) {return "bins "+ "button_add_text_"+d.yg ;});



            svg.selectAll(".grpAll")
              .append("text")
                  .attr("x", function(d) {return (d.yg * 58) + 10;})
                  .attr("y", (bin_height-26))
                  .text("-")
                  .attr("fill", "steelblue")

                  .attr("class", function(d) {return "bins "+ "button_sub_text_"+d.yg ;});


            var i_array = [19,19,19,19,19,19,19,19,19,19]


            function addCircles(binNum) {
              this_i = i_array[binNum]
              currentlyActive = CountActiveCircle()
                if (this_i >= 0){
                  svg.selectAll(".circle_"+ this_i).filter(".bin_" + binNum)
                   .classed("activeCircle", true)
                   .attr("fill", function(d) {
                      return "steelblue";}) 

                  i_array[binNum] = i_array[binNum] -1;
                }
                  if (currentlyActive >= 50){

                  $('#feedbackmsg').text("You're out of circles! Undo some selected circles by clicking - or click \"Try Again\" to start over!")
                  svg.selectAll(".activeCircle")
                    .attr("fill", "red")
                } else{
                  $('#feedbackmsg').empty()
                }
                countActiveInBin(binNum);

            }

            function remCircles(binNum) {
              this_i = i_array[binNum]+1
              currentlyActive = CountActiveCircle()


              svg.selectAll(".circle_"+ this_i).filter(".bin_" + binNum)
               .classed("activeCircle", false)
               .attr("fill", function(d) { 
                  return "white";}) 

              i_array[binNum] = i_array[binNum] +1;
                if (currentlyActive <= 51){
                  $('#feedbackmsg').empty()
              svg.selectAll(".activeCircle")
                .attr("fill", "steelblue")
            } else {
              $('#feedbackmsg').text("You're out of circles! Undo some selected circles by clicking - or click \"Try Again\" to start over!")
            }
            countActiveInBin(binNum);
            }

            function countActiveInBin(binNum){
              changeCountActiveCircle()
              $(".button_count_text_" + binNum).text(d3.selectAll('.activeCircle').filter(".bin_" + binNum ).size())

            }


            svg.selectAll(".grpAll")
              .append("text")
                  .attr("x", function(d) {return (d.yg * 58)-8;})
                  .attr("y", (bin_height) + 10)
                  .text(function(d) {return 0;})
                  .attr("fill", "lightblue")
                  .attr("class", function(d) {return "bins "+ "button_count_text_"+d.yg ;});

        }) //circle20.csv end

        d3.csv("bin20.csv",function(error, data) {
        svg.selectAll("circle")
        .data(data) 
        .enter().append("circle")
          .attr("r", 10)
          .attr('id',function(d){return d.xg + d.yg})
          .attr('class',function(d) {return  "circle_" + d.yg + " bin_"+d.xg ;})
          .attr('fill','white')
          .attr("cx", function(d) {return (d.xg *  58) - 3;})
          .attr("cy", function(d) {return (d.yg * 24) + 0;})
        })//bin20.csv end

    }//end plus_circle_50





    line_ev.plus_circle = function () {
        click_change_color = false;
        click_set_height = false;
        can_edit = false;
        var bin_height = 500;
        var bin_width = 45;

        d3.select("svg")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var triUp = d3.svg.symbol().type('triangle-up')
                        .size(80);

        var triDown = d3.svg.symbol().type('triangle-down')
                        .size(80);


        d3.csv("circle20.csv",function(error, data) {
            svg.selectAll(".grpAll")
            .data(data) 
            .enter().append("g")
            .attr('class','grpAll');


            svg.selectAll(".grpAll")
            .append("rect")
            .attr("x", function(d) {return (d.yg * 58) - 25;})
            .attr("width", bin_width)
            .attr("y", -40)
            .attr("height", bin_height)
            .attr("stroke", "orange")
            .attr("fill", "none")
            .attr("class", function(d) {return "bins "+ "bin_"+d.yg ;});

            svg.selectAll(".grpAll")
            .append("path")
            .attr("d", triUp)
              .attr('transform',function(d){ return "translate("+((d.yg * 58) - 18)+","+(bin_height - 15)+")"; })
              .attr("fill", "steelblue")
              .attr("class", function(d) {return "bins "+ "button_add_"+d.yg ;})
                .on({
                      "mouseover": function(d) {
                        d3.select(this).style("cursor", "pointer")
                      },
                      "mouseout": function(d) {
                        d3.select(this).style("cursor", "default")
                      }
                    })
                .on("click", function(d){
                    var binNum = d3.select(this).attr("class").split(" button_add_")[1]
                    addCircles(binNum);
              });


            svg.selectAll(".grpAll")
            .append("path")
            .attr("d", triDown)
            .attr("fill", "steelblue")
              .attr('transform',function(d){ return "translate("+((d.yg * 58) + 12)+","+(bin_height - 15)+")"; })     
              .attr("class", function(d) {return "bins "+ "button_sub_"+d.yg ;})
                .on({
                      "mouseover": function(d) {
                        d3.select(this).style("cursor", "pointer")
                      },
                      "mouseout": function(d) {
                        d3.select(this).style("cursor", "default")
                      }
                    })
              .on("click", function(){
                var binNum = d3.select(this).attr("class").split(" button_sub_")[1]
                if (i_array[binNum] == 9){
                    return
                }
                else{
                    remCircles(binNum);
                }
              });

            svg.selectAll(".grpAll")
            .attr("transform", "translate(" + 0 + "," + 10 + ")");

            svg.selectAll(".grpAll")
              .append("text")
                  .attr("x", function(d) {return (d.yg * 58) - 22;})
                  .attr("y", (bin_height - 26))
                  .text("+")
                  .attr("fill", "steelblue")
                  .attr("class", function(d) {return "bins "+ "button_add_text_"+d.yg ;});

            svg.selectAll(".grpAll")
              .append("text")
                  .attr("x", function(d) {return (d.yg * 58) + 10;})
                  .attr("y", (bin_height-26))
                  .text("-")
                  .attr("fill", "steelblue")

                  .attr("class", function(d) {return "bins "+ "button_sub_text_"+d.yg ;});

            var i_array = [9,9,9,9,9,9,9,9,9,9]

            function addCircles(binNum) {
                this_i = i_array[binNum]
                currentlyActive = CountActiveCircle()
                if (this_i >= 0){
                    svg.selectAll(".circle_"+ this_i).filter(".bin_" + binNum)
                    .classed("activeCircle", true)
                    .attr("fill", function(d) { 
                      return "steelblue";}) 
                    i_array[binNum] = i_array[binNum] -1;
                }
                if (currentlyActive >= 20){
                    $('#feedbackmsg').text("You're out of circles! Undo some selected circles by clicking - or click \"Try Again\" to start over!")
                    svg.selectAll(".activeCircle")
                    .attr("fill", "red")
                } else {
                    $('#feedbackmsg').empty()
                } 
                countActiveInBin(binNum);

            } // end addCircles

            
            function remCircles(binNum) {
                this_i = i_array[binNum]+1
                currentlyActive = CountActiveCircle()
                svg.selectAll(".circle_"+ this_i).filter(".bin_" + binNum)
                .classed("activeCircle", false)
                .attr("fill", function(d) {
                    return "white";}) 
                i_array[binNum] = i_array[binNum] +1;
                if (currentlyActive <= 21){
                    $('#feedbackmsg').empty()
                    svg.selectAll(".activeCircle")
                    .attr("fill", "steelblue")
                } else {
                    $('#feedbackmsg').text("You're out of circles! Undo some selected circles by clicking - or click \"Try Again\" to start over!")
                }
                countActiveInBin(binNum);
            } // end remCircles

            
            function countActiveInBin(binNum){
                changeCountActiveCircle()
                $(".button_count_text_" + binNum).text(d3.selectAll('.activeCircle').filter(".bin_" + binNum ).size()) 
            }


            svg.selectAll(".grpAll")
              .append("text")
                  .attr("x", function(d) {return (d.yg * 58)-8;})
                  .attr("y", (bin_height) + 10)
                  .text(function(d) {return 0;})
                  .attr("fill", "lightblue")
                  .attr("class", function(d) {return "bins "+ "button_count_text_"+d.yg ;});
        }) //csv end

        
        d3.csv("bin20.csv",function(error, data) {
            svg.selectAll("circle")
            .data(data) //populate these g's with data
                .enter().append("circle")
            .filter(function(d,i) { return d.yg < 10})
              .attr("r", 20)
              .attr('id',function(d){return d.xg + d.yg})
              .attr('class',function(d) {return  "circle_" + d.yg + " bin_"+d.xg ;})
              .attr('fill','white')
              .attr("cx", function(d) {return (d.xg *  58) - 3;})
              .attr("cy", function(d) {return (d.yg * 46) + 35;})
        })//csv I end
        
    }//end plus_circle

    
    var activeArr = [];

    function recordCoords(optName) {
        activeArr.push(optName);
        clickables = d3.selectAll(".activeCircle")
                    .each(function(i,d) {
                        activeArr.push(d3.select(this).attr("class"));
                    })
    }

    
  /* Given an array of values (haystack) [x1, x2,  ...] and a target
     value (needle) x, return the nearest x value from haystack */
    function find_closest(haystack, needle) {
        var dist = haystack.map(function (n, idx) { return [Math.abs( needle - n ), n];});
        dist.sort(function (a, b) {
          if (a[0] < b[0]) {
            return -1;
          } else if (a[0] > b[0]) {
            return 1;
          } else {
            return 0;
          }
        });
          return dist[0][1];
    }
    

    line_ev.disable_edit = function() {
        can_edit = false;
        d3.selectAll('.feedback a').attr("class", "disabled")
        d3.selectAll('.show_agg a').attr("class", "disabled")
    };



    line_ev.update = function (data) {
        var points = svg.selectAll(".group-points").data(data, function(d) { return d[0]; });
        points.enter()
              .append("g")
              .attr("class", "group-points")
              .append("circle")
              .attr("r", 5)
              .on({
                      "mouseover": function(d) {
                        d3.select(this).style("cursor", "pointer")
                      },
                      "mouseout": function(d) {
                        d3.select(this).style("cursor", "default")
                      }
                    })
              .attr("class", "points");

        points.select("circle")
              .attr("cx", function (d) { return d[0]; })
              .attr("cy", function (d) { return d[1]; });

        points.exit().remove();

        if (opts.update_feedback && line_ev.last_feedback) {
            line_ev.last_feedback();
        }
        d3.select(".defaultEvLine").attr("d", guess_line(data));
    };



    line_ev.pow_size = function() {
        var error_scale = d3.scale.pow().domain([0, y.domain()[1]]).range([3,10]);
        svg.selectAll(".points")
         .data(_(line_ev.user_error()).map(1).map(Math.abs).value())
         .transition()
         .attr("r", function (d) { return error_scale(d); });
     };

    
    
    line_ev.draw_agg = function() {
        // Only include values that match a tick
        filtered_agg_values = _(aggregate_values).map(
          function (row) {
                return _(row).filter(
                function (e) {
                return _.includes(x.ticks(), e[0]);
                }).value();
            }).value();

        if (opts.verbose) {
        }

        var series = svg.selectAll(".series")
        .data(filtered_agg_values)
        .enter().append("g")
        .attr("class", "series");

        if (opts.agg_points) {
            series.selectAll("circle")
                .data(function (d) { return d; })
                .enter()
                .append("circle")
                .attr("class", "aggregatePoint")
                .attr("cx", function (d) { return x(d[0]); })
                .attr("cy", function (d) { return y(d[1]); });
        }

        var path = svg.selectAll(".aggregateLine")
          .data(filtered_agg_values)
          .enter()
          .append("path")
        .attr("class", "aggregateLine")
        .attr("d", aggregate_line)
        .attr("stroke-dasharray", function() {
          var totalLength = this.getTotalLength();
          return totalLength + ' ' + totalLength
        })
        .attr("stroke-dashoffset", function() {
            var totalLength = this.getTotalLength();
            return totalLength;
        })
        .transition()
          .duration(4000)
          .ease("linear")
          .attr('stroke-dashoffset', 0);
    };


    function tick(pt) {
        if (can_edit === false)
          return;
          /* Ticks are generated in SVG space */
        pt = svg_to_chart(pt);
        pt[0] = find_closest(d3.keys(user_guess), pt[0]);
        pt[1] = Math.min(pt[1], chart_height);
        pt[1] = Math.max(pt[1], margin.top);
        user_guess[pt[0]] = pt[1];
        if (d3.values(user_guess).every(function (v) { return v !== null; })) {
          d3.select("#next").attr("disabled", null);
          line_ev.user_done = true;
        }
        return line_ev.update(convert_obj_to_array(user_guess).sort(function(a,b){return parseFloat(a[0]) - parseFloat(b[0])}));
    }

    
    /* Set all values to null on an object */
    function clear(obj) {
        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            obj[key] = null;
        }
    }

    
    /* Given an array of values (haystack) [x1, x2,  ...] and a target
     value (needle) x, return the nearest x value from haystack */
    function find_closest(haystack, needle) {
        var dist = haystack.map(function (n, idx) { return [Math.abs( needle - n ), n];});
        dist.sort(function (a, b) {
          if (a[0] < b[0]) {
            return -1;
          } else if (a[0] > b[0]) {
            return 1;
          } else {
            return 0;
          }
        });
          return dist[0][1];
    }

    
    function init_user_data(ticks) {
        var user_guess = {};
        ticks.forEach(function (n) {
          user_guess[n] = null;
        });
        return user_guess;
    }

    
    /* Covert an object to a array of arrays: {k1:v1, k2:v2} -> [[k1 v1], [k2 v2]] */
    function convert_obj_to_array(obj) {
        return d3.zip(d3.keys(obj).map(parseFloat),
                      d3.values(obj)).filter(function (n) { return n[1] !== null;});
    }

    
    function data_to_ticks(data, ticks, values_are_nested) {
        var indices_out = [];
        var data_to_scan = data;
        if (values_are_nested) {
            data_to_scan = data.values;
        }
        for (var i = 0; i < data_to_scan.length; i++) {
            var current = data_to_scan[i];
            if (ticks.indexOf(Number(current[0])) >= 0) {
                indices_out.push(i);
            }
        }
        return indices_out;
    }

    return line_ev;
};//end

