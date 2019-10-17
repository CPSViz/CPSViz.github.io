/**
 * Authors: DS, JA, VS
 * 
 * @brief Tooltip
 * 
 * @reference
 *    This references tutorial found here:
 *    http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
 */

var divToolTip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);
