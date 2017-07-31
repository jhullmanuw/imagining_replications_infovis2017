  

var script = document.createElement('script');
  script.src = 'http://code.jquery.com/jquery-1.11.0.min.js';
  script.type = 'text/javascript';



  document.getElementsByTagName('head')[0].appendChild(script);

var aggregate_data;
var options = { verbose: true,
                agg_points: true,
                update_feedback: true };
var chart;

var optionDict = {
  "Rolling-balls (20)":0,
  "Rolling-balls (100)":1,
  "Pull-up (20)":2,
  "Pull-up (100)":3,
  "Balls-and-bins (20)":4,
  "Balls-and-bins (50)":5,
  "Paint-outcomes-by-dragging (fill-down 20)":6,
  "Paint-outcomes-by-dragging (fill-down 100)":7,
  "Paint-outcomes-by-dragging (20)":8,
  "Paint-outcomes-by-dragging (100)":9,
  "Continuous-line-drag":10,
  "Continuous-pull-up":11,
}
var feedback_options = [

  
  {
    "display" : "Rolling-balls (20)",
    "base_data" : "circle100.csv",
    "call" : "roll_circle",
    "x_label": "xg",
    "x_prop" : "xg",
    "y_prop" : "yg",
    "data_desc" : "Drag the available circles and stack them on top of one another to create a distribution. "

  },
    {
    "display" : "Rolling-balls (100)",
    "base_data" : "circle100.csv",
    "call" : "roll_circle_100",
    "x_label": "xg",
    "x_prop" : "xg",
    "y_prop" : "yg",
    "data_desc" : "Drag the available circles and stack them on top of one another to create a distribution. "

  },


      {
    "display" : "Pull-up (20)",
    "base_data" : "circle100.csv",
    "call" : "pull_circle_no_limit",
    "x_label": "xg",
    "x_prop" : "xg",
    "y_prop" : "yg",
    "data_desc" : "Click the orange handles and pull up to create a distribution containing 20 total circles. <br>\**You can hide the handles to get a better look at your drawing by clicking the \"Show\/ Hide handles\" button."

  },
  {
    "display" : "Pull-up (100)",
    "base_data" : "circle100.csv",
    "call" : "pull_circle_100",
    "x_label" : "xg",
    "x_prop" : "xg",
    "y_prop" : "yg",
    "data_desc" : "Click the orange handles and pull up to create a distribution containing 100 total circles. <br>\**You can hide the handles to get a better look at your drawing by clicking the \"Show\/ Hide handles\" button. "
  },

  
  {
    "display" : "Balls-and-bins (20)",
    "base_data" : "circle20.csv",
    "call" : "plus_circle",
    "data_desc" : "Click the + or - buttons to add or remove circles in each bin and create a distribution containing 20 total circles. "

  },
    {
    "display" : "Balls-and-bins (50)",
    "base_data" : "circle20.csv",
    "call" : "plus_circle_50",
    "data_desc" : "Click the + or - buttons to add or remove circles in each bin and create a distribution containing 50 total circles. "
  },
  {
    "display" : "Paint-outcomes-by-dragging (fill-down 20)",
    "base_data" : "circle100.csv",
    "call" : "paint_circle",
    "x_label": "xg",
    "x_prop" : "xg",
    "y_prop" : "yg",
    "data_desc" : "Drag over circles to fill them in and create a distribution containing 20 total circles. "

  },

  {
    "display" : "Paint-outcomes-by-dragging (fill-down 100)",
    "base_data" : "circle100.csv",
    "call" : "paint_circle_100",
    "x_label": "xg",
    "x_prop" : "xg",
    "y_prop" : "yg",
    "data_desc" : "Drag over circles to fill them in and create a distribution containing 100 total circles. "

  },
    
    {
    "display" : "Paint-outcomes-by-dragging (20)",
    "base_data" : "circle100.csv",
    "call" : "paint_circle_top",
    "x_label": "xg",
    "x_prop" : "xg",
    "y_prop" : "yg",
    "data_desc" : "Drag over circles to fill them in and create a distribution containing 20 total circles. "

  },
    {
    "display" : "Paint-outcomes-by-dragging (100)",
    "base_data" : "circle100.csv",
    "call" : "paint_circle_top_100",
    "x_label": "xg",
    "x_prop" : "xg",
    "y_prop" : "yg",
    "data_desc" : "Drag over circles to fill them in and create a distribution containing 100 total circles. "

  },

    {
     "display" : "Continuous-line-drag",
     "base_data" : "circle100.csv",
     "call" : "draw_distribution",
     "x_label": "xg",
     "x_prop" : "xg",
     "y_prop" : "yg",
     "data_desc" : "Click and drag from the lower left to lower right of the plot to create a distribution."

   },
    
    {
     "display" : "Continuous-pull-up",
     "base_data" : "circle100.csv",
     "call" : "draw_distribution_fill",
     "x_label": "xg",
     "x_prop" : "xg",
     "y_prop" : "yg",
     "data_desc" : "Click the orange handles and pull up to create a distribution shape. <br> \**You can hide the handles to get a better look at your drawing by clicking the \"Show\/ Hide handles\" button."

   },


];


var show_agg = true;
//var feedback_call = feedback_options[0].call;
function make_experiment(dataset) {
      d3.csv(dataset.base_data, _.partial(parse_row, dataset),
             
        function(error, actual_data) {
          
          console.log(actual_data)
          
          base_data = _.zip(_(actual_data).map(dataset.x_prop).value(),
          _(actual_data).map(dataset.y_prop).value());
          chart_width = 600;
   
          chart = new d3.line_ev(base_data, dataset, options);
          chart.render_chart(chart_width,600 , d3.select("svg"), dataset.call);
          
          document.getElementById('instruction').innerHTML = dataset.data_desc
          start_value = 20
          if (dataset.call == "pull_circle_100" || dataset.call == "paint_circle_100" || dataset.call == "paint_circle_top_100") {
            start_value = 100;
          } else if (dataset.call == "plus_circle_50"){
          	start_value = 50;
          }
       
        $('#ballN').text(start_value - $('.activeCircle').size())    
          d3.selectAll(".feedback").on("click", function() {
            d3.select("svg").selectAll("*").remove();
            console.log("aaaaaa")
            $('#feedbackmsg').empty()
            console.log("here",d3.select(this).text());
            make_experiment(feedback_options[optionDict[d3.select(this).text()]])
            document.getElementById('instruction').innerHTML = dataset.data_desc
          });
          d3.select("#clear").on("click", function () {
            d3.select("svg").selectAll("*").remove();
            document.getElementById('instruction').innerHTML = dataset.data_desc
            make_experiment(dataset);
          });
        }); // d3.csv end
}



function populate_list(id, items, onclick) {
 d3.select("#" + id)
   .append("ul")
   .classed("nav nav-pills mode-switch", true)
   .selectAll("." + id)
   .data(items)
   .enter()
   .append("li")
   .classed("switch-measurement " + id, true)
   .classed("active", function(d, i) { return i === 0;})  // First entry is active by default
   .attr("id", function (d,i) {if (i > 6) {
                                                return "col2";
                                            } else if (i==6) {
                                                return "col2First";
                                            }
                                            }
                     )
   .append("a")
   .on("click", onclick)
   .html(function (d) { return d.display; });
}

populate_list("feedback", feedback_options, 
              function (d) {
                console.log("in!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                d3.selectAll(".feedback").classed("active", false);
                d3.select(this.parentNode).classed("active", true);
                
                feedback_call = d.call;
             });    





function parse_row(dataset, row) {
  row[dataset.x_prop] = +row[dataset.x_prop];
  row[dataset.y_prop] = +row[dataset.y_prop];
  return row;
}

$(document).ready(function(){
    console.log("ininin")
    make_experiment(feedback_options[0]);
//    feedback_call = feedback_options.call;
})
    