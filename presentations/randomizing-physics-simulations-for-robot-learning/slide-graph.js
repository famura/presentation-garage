data = undefined;
links = undefined;
nodes = undefined;
function loadGraph(json) {
  data = json;
  links = data.links.map(d => Object.create(d));
  nodes = data.nodes.map(d => Object.create(d));

  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).strength(0.001).id(d => d.id))   // attractive force between connected nodes (link is like a spring, adjust strength() to make it stiffer or more relaxed)
      .force("charge", d3.forceManyBody().strength(-800))                 // force to repel overlapping nodes from each other
      .force("x", d3.forceX(d => d.fx || (d.x || width/2)).strength(1))   // force to push nodes towards their defined x position, or center if no position specified
      .force("y", d3.forceY(d => d.fy || (d.y || height/3)).strength(1)); // force to push nodes towards their defined y position, or center if no position specified

  drag = simulation => {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
  }
      
  const svg = d3.select("body").append("div").append("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("font-family", "Ubuntu, sans-serif")
    .style("font-size", "28px")
    .style("font-weight", "500")
    // math is not text, so it does not have any "font" properties after MathJax has done its thing, it's an SVG figure and can be scaled arbitrarily (see the big-red-equations CSS class)
    // .style("math-font", "24px")
    .style("width", "98%") 
    .style("height", "98%");

  // create a group for all links
  const linkParent = svg.append("g")
    .attr("fill", "none")
    .attr("stroke-width", 2.0)
    .attr("class", "link")
    .selectAll("path")
    .data(links);
  // create a path for each linke to draw lines between nodes
  const link = linkParent.join("path")
    .attr("id", d => d.source.id + "-" + d.target.id)
    .attr("class", d => d.class || '')
    .attr("opacity", 0.0);
  // create an arrow head for each path
  const linkArrow = linkParent.join("path")
    .attr("id", d => d.source.id + "-" + d.target.id + "-head")
    .attr("class", d => d.class || '')
    .attr("data-parent", d => d.source.id + "-" + d.target.id)
    .attr("opacity", 0.0)
    .attr("d", "M0,-5L10,0L0,5");

  // create node groups
  const node = svg.append("g")
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("class", "node")
    .selectAll("g")
    .data(nodes)
      .join("g")
        .attr("id", d => d.id)
        .attr("opacity", d => d.opacity)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("class", d => d.class || '')
    .call(drag(simulation));

  // add labels to nodes
  node.append(function(d) {
    const wrapNode = d3.create("svg:g");
    d.labels.forEach((label) => {
      let lblOffset = label.offset ? label.offset.split(',') : ["0", "0"];
      lblOffset = [eval(lblOffset[0]), eval(lblOffset[1])];
      if (label.math) {
        const mathNode = d3.create("svg:g");
        mathNode
          .style("text-anchor", "middle")
          .attr("class", s => label.class || '')
          .attr("transform", "translate(" + lblOffset.join(",") + ")")
          .append(s => MathJax.tex2svg(label.math).querySelector("svg"));
        wrapNode.append(() => mathNode.node());
      } else if (label.text) {
        const textNode = d3.create("svg:text");
        textNode
          .style("text-anchor", "middle")
          .attr("class", s => label.class || '')
          .attr("transform", "translate(" + lblOffset.join(",") + ")")
          .text(label.text);
        wrapNode.append(() => textNode.node());
      } else {
        throw "Node label contains no supported data!";
      }
    });
    return wrapNode.node();
  });

  simulation.on("tick", () => {
    link.attr("d", linkArc);
    linkArrow.attr("transform", function(d) {
        // get the relevant path arc for this arrowhead
        let p = d3.select("#" +  this.dataset.parent).node();
        // get the position at the end of the path
        let length = p.getTotalLength() - 10; // offset from path end so arrow doesn't extend past path length
        let pos = p.getPointAtLength(length);
        
        let angle = getAngleAt(p, length);
        return "translate(" + pos.x + ", " + pos.y + ")rotate(" + angle + ")";
    });
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  // ensure all edges connecting visible nodes are also checked and made visible at the start
  nodes.forEach(function(node) {
    if (node.opacity > 0) {
        showNode(node.id, true);
    }
  });
}

// load graph json if provided on parent of iframe element
if (window.frameElement && window.frameElement.parentNode.dataset.graph) {
    console.log("loading graph json:", window.frameElement.parentNode.dataset.graph);
    d3.json(window.frameElement.parentNode.dataset.graph).then(function(data) {
        loadGraph(data);
    }).catch(function(error) {
        console.log("Failed to load json file '" + window.frameElement.parentNode.dataset.graph + "'", error);
    });
}

// Estimates the angle at a specified length on a path
function getAngleAt(path, l) {
  var a = path.getPointAtLength(Math.max(l - 0.01,0)), // this could be slightly negative
      b = path.getPointAtLength(l + 0.01); // browsers cap at total length

  return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
}

// Given a collection of elements, computes the bounding box enclosing them all
function getTotalBBox(eles) {
  let result = {x: 10000, y: 10000, width: 0, height: 0};
  eles.each(function(d, i) {
    var bb = d3.select(this).node().getBBox();
    var t = d3.select(this).attr("transform") || "(0, 0)";
    var offset = t.substring(t.indexOf("(")+1, t.indexOf(")")).split(",");
    result.x = Math.min(result.x, bb.x + Number(offset[0]));
    result.y = Math.min(result.y, bb.y + Number(offset[1]));
    result.width = Math.max(result.width, bb.x + bb.width - result.x + Number(offset[0]));
    result.height = Math.max(result.height, bb.y + bb.height - result.y + Number(offset[1]))
  });
  return result;
}

// Finds the nearest points on the bounding boxes of source/destination elements to use as
// start/end points for arrow visualization.
function getLinkAnchors(d) {
  const srcBB = getTotalBBox(d3.select("#" + d.source.id).selectAll("text"));
  const dstBB = getTotalBBox(d3.select("#" + d.target.id).selectAll("text"));
  var result = {start: {x: 0, y: 0}, end: {x: 0, y:0}};

  result.start.x = srcBB.x + 0.5*srcBB.width + d.source.x;
  result.start.y = srcBB.y + 0.5*srcBB.height + d.source.y;
  result.end.x = dstBB.x + 0.5*dstBB.width + d.target.x;
  result.end.y = dstBB.y + 0.5*dstBB.height + d.target.y;

  const srcPoints = [
    {x: srcBB.x + d.source.x, y: srcBB.y + d.source.y},
    {x: srcBB.x + srcBB.width + d.source.x, y: srcBB.y + d.source.y},
    {x: srcBB.x + srcBB.width + d.source.x, y: srcBB.y + srcBB.height + d.source.y},
    {x: srcBB.x + d.source.x, y: srcBB.y + srcBB.height + d.source.y}
  ];
  const dstPoints = [
    {x: dstBB.x + d.target.x, y: dstBB.y + d.target.y},
    {x: dstBB.x + dstBB.width + d.target.x, y: dstBB.y + d.target.y},
    {x: dstBB.x + dstBB.width + d.target.x, y: dstBB.y + dstBB.height + d.target.y},
    {x: dstBB.x + d.target.x, y: dstBB.y + dstBB.height + d.target.y}
  ]

  if (!d.waypoints) {
    for (var i = 0; i < srcPoints.length; i++) {
        var det, gamma, lambda;
        var s1 = srcPoints[i];
        var s2 = i == srcPoints.length - 1 ? srcPoints[0] : srcPoints[i+1];
        det = (result.end.x - result.start.x) * (s2.y - s1.y) - (s2.x - s1.x) * (result.end.y - result.start.y);
        if (det === 0)
        continue;
        lambda = ((s2.y - s1.y) * (s2.x - result.start.x) + (s1.x - s2.x) * (s2.y - result.start.y)) / det;
        gamma = ((result.start.y - result.end.y) * (s2.x - result.start.x) + (result.end.x - result.start.x) * (s2.y - result.start.y)) / det;
        if ((0 < lambda && lambda < 1) && (0 < gamma && gamma < 1)) {
        // HIT!
        result.start.x = result.start.x + lambda * (result.end.x - result.start.x);
        result.start.y = result.start.y + lambda * (result.end.y - result.start.y);
        break;
        }
    }
  } else {
    for (var i = 0; i < srcPoints.length; i++) {
        var det, gamma, lambda;
        var s1 = srcPoints[i];
        var s2 = i == srcPoints.length - 1 ? srcPoints[0] : srcPoints[i+1];
        det = (d.waypoints[0][0] - result.start.x) * (s2.y - s1.y) - (s2.x - s1.x) * (d.waypoints[0][1] - result.start.y);
        if (det === 0)
        continue;
        lambda = ((s2.y - s1.y) * (s2.x - result.start.x) + (s1.x - s2.x) * (s2.y - result.start.y)) / det;
        gamma = ((result.start.y - d.waypoints[0][1]) * (s2.x - result.start.x) + (d.waypoints[0][0] - result.start.x) * (s2.y - result.start.y)) / det;
        if ((0 < lambda && lambda < 1) && (0 < gamma && gamma < 1)) {
        // HIT!
        result.start.x = result.start.x + lambda * (d.waypoints[0][0] - result.start.x);
        result.start.y = result.start.y + lambda * (d.waypoints[0][1] - result.start.y);
        break;
        }
    }
  }


  if (!d.waypoints) {
    for (var i = 0; i < dstPoints.length; i++) {
        var det, gamma, lambda;
        var s1 = dstPoints[i];
        var s2 = i == dstPoints.length - 1 ? dstPoints[0] : dstPoints[i+1];
        det = (result.start.x - result.end.x) * (s2.y - s1.y) - (s2.x - s1.x) * (result.start.y - result.end.y);
        if (det === 0)
        continue;
        lambda = ((s2.y - s1.y) * (s2.x - result.end.x) + (s1.x - s2.x) * (s2.y - result.end.y)) / det;
        gamma = ((result.end.y - result.start.y) * (s2.x - result.end.x) + (result.start.x - result.end.x) * (s2.y - result.end.y)) / det;
        if ((0 < lambda && lambda < 1) && (0 < gamma && gamma < 1)) {
        // HIT!
        result.end.x = result.end.x + lambda * (result.start.x - result.end.x) - (0.1 * (result.end.x - result.start.x));
        result.end.y = result.end.y + lambda * (result.start.y - result.end.y) - (0.1 * (result.end.y - result.start.y));
        break;
        }
    }
  } else {
    for (var i = 0; i < dstPoints.length; i++) {
        var det, gamma, lambda;
        var s1 = dstPoints[i];
        var s2 = i == dstPoints.length - 1 ? dstPoints[0] : dstPoints[i+1];
        det = (d.waypoints[d.waypoints.length-1][0] - result.end.x) * (s2.y - s1.y) - (s2.x - s1.x) * (d.waypoints[d.waypoints.length-1][1] - result.end.y);
        if (det === 0)
        continue;
        lambda = ((s2.y - s1.y) * (s2.x - result.end.x) + (s1.x - s2.x) * (s2.y - result.end.y)) / det;
        gamma = ((result.end.y - d.waypoints[d.waypoints.length-1][1]) * (s2.x - result.end.x) + (d.waypoints[d.waypoints.length-1][0] - result.end.x) * (s2.y - result.end.y)) / det;
        if ((0 < lambda && lambda < 1) && (0 < gamma && gamma < 1)) {
        // HIT!
        result.end.x = result.end.x + lambda * (d.waypoints[d.waypoints.length-1][0] - result.end.x) - (0.1 * (result.end.x - d.waypoints[d.waypoints.length-1][0]));
        result.end.y = result.end.y + lambda * (d.waypoints[d.waypoints.length-1][1] - result.end.y) - (0.1 * (result.end.y - d.waypoints[d.waypoints.length-1][1]));
        break;
        }
    }
  }
  return result;
}

// computes an elliptical arc between two nodes
function linkArc(d) {
  var anchors = getLinkAnchors(d);
  var points = [[anchors.start.x, anchors.start.y], [anchors.end.x, anchors.end.y]];
  if (d.waypoints)
    points.splice(1, 0, ...d.waypoints);
  var lineGen = d3.line();
  lineGen.curve(eval(d.curvetype) || d3.curveCardinal);
  return lineGen(points);
  // const r = Math.hypot(anchors.end.x - anchors.start.x, anchors.end.y - anchors.start.y);
  // return `
  //   M${anchors.start.x},${anchors.start.y}
  //   A${r},${r} 0 0,0 ${anchors.end.x},${anchors.end.y}
  // `;
}

// Shows/hides the specified node
// idx may be the node index in `nodes`, or the node id.
function showNode(idx, show) {
    let node_id;
    if (typeof idx == 'number') {
      node_id = nodes[idx].id;
    } else {
      node_id = idx;
    }
    node = d3.select("#" + node_id);
    
    if (show) {
        node.transition().attr("opacity", 1.0);
        
    } else {
        node.transition().attr("opacity", 0.0);
    }

    setTimeout(function() {
      var edges = [];
      links.forEach(link => {
          if (link.target.id == node_id && d3.select("#" + link.source.id).attr("opacity") > 0 ||
              link.source.id == node_id && d3.select("#" + link.target.id).attr("opacity") > 0)
            edges.push(link);
      });

      if (show) {
        edges.forEach(e => {
          d3.select("#" + e.source.id + "-" + e.target.id).transition().attr("opacity", 1.0);
          d3.select("#" + e.source.id + "-" + e.target.id + "-head").transition().attr("opacity", 1.0);
            // var edge = d3.select("#" + e.source.id + "-" + e.target.id);
            // edge.attr("opacity", 1.0);
            // var length = edge.node().getTotalLength();
            // edge.attr("stroke-dasharray", length + " " + length)
            //     .attr("stroke-dashoffset", length)
            //     .transition().duration(600).ease(d3.easeBackOut).attr("stroke-dashoffset", 0);
        });
      } else {
        edges.forEach(e => {
            d3.select("#" + e.source.id + "-" + e.target.id).transition().attr("opacity", 0.0);
            d3.select("#" + e.source.id + "-" + e.target.id + "-head").transition().attr("opacity", 0.0);
        });
      }
    }, 50);
}

function showNodes(idx, show, asyncDelay) {
  if (asyncDelay) {
    idx.forEach((i, d) => {
      setTimeout(function() {
      showNode(i, show);
    }, asyncDelay*d);
    });
    
  } else {
    idx.forEach((i) => {
      showNode(i, show);
    });
  }
}

function showAllNodes(show) {
  for (var i = 0; i < nodes.length; i++) {
    showNode(i, show);
  }
}

