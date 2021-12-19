import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import * as d3 from "d3";
import styled from 'styled-components';
import jstat from 'jstat';

export interface studentResult {
  studentID: string,
  studentName: string,
  scores: Array<Number>
}

// path => /course/[id]/dashboards/chart
export default function Index() {
  return (<div>
    <Head>
      <title>Dashboard</title>
    </Head>
  </div>);
};

export function AllStudentChart(props: { data: studentResult[], chartType: string, scoreType: string, tableHead: string[] }) {
  return (
    <div>
      {props.chartType === "avg" && <AverageChart data={props.data} scoreType={props.scoreType} tableHead={props.tableHead}/>}
      {props.chartType === "all" && <AllChart data={props.data} scoreType={props.scoreType} tableHead={props.tableHead}/>}
    </div>
  )
}

//Chart Selection
function AverageChart(props: { data: studentResult[], scoreType: string, tableHead: string[] }) {
  const [chartType, setChartType] = useState("bar");
  function handleChartType(e: any){ setChartType(e.target.value) }
  return(
    <div style={{ width: "65%", height: "60%", marginTop: "0.5%"}}>
      <div style={{ display: "inline" }}>
        <span style={{ marginRight: 5 }}>Graph Type</span>
        <select value={chartType} onChange={handleChartType} className="border rounded-md border-2 ">
          <option value="bar">Bar Chart</option>
          <option value="pie">Pie Chart</option>
          <option value="line">Line Chart</option>
          <option value="dist">Distribute Chart</option>
        </select>
      </div>
      {chartType === "bar" && <ChartBarAverage data={props.data} scoreType={props.scoreType} tableHead={props.tableHead}/>}
      {chartType === "pie" && <ChartPieAverage data={props.data} scoreType={props.scoreType} tableHead={props.tableHead}/>}
      {chartType === "line" && <ChartLineAverage data={props.data} scoreType={props.scoreType} tableHead={props.tableHead}/>}
      {chartType === "dist" && <ChartDistribute data={props.data} scoreType={props.scoreType} tableHead={props.tableHead}/>}
    </div>
  )
}

function AllChart(props: { data: studentResult[], scoreType: string, tableHead: string[] }) {
  const [chartType, setChartType] = useState("bar");
  function handleChartType(e: any){ setChartType(e.target.value) }
  return(
    <div style={{width: "100%", height: "60%", marginTop: "0.5%"}}>
      <div style={{ display: "inline" }}>
        <span style={{ marginRight: 5 }}>Graph Type</span>
        <select value={chartType} onChange={handleChartType} className="border rounded-md border-2 ">
          <option value="bar">Bar Chart</option>
          <option value="bar2">Bar Scrollable</option>
          <option value="barVerti">Bar Vertical</option>
          <option value="dens">Density Chart</option>
        </select>
      </div>
      {chartType === "bar" && <ChartBarAll data={props.data} scoreType={props.scoreType} tableHead={props.tableHead}/>}
      {chartType === "bar2" && <div style={{}}>
      <ChartBarAllScroll data={props.data} scoreType={props.scoreType} tableHead={props.tableHead}/>
      </div>}
      {chartType === "barVerti" && <ChartBarAllVertical data={props.data} scoreType={props.scoreType} tableHead={props.tableHead}/>}
      {chartType === "dens" && <ChartDensity data={props.data} scoreType={props.scoreType} tableHead={props.tableHead}/>}
    </div>
  )
}

let dimensions = {
  w: 550, h: 400,
  margin:{ top: 50, bottom: 50, left: 50,right: 50 }
}

export function ChartBarAverage(props: { data: studentResult[], scoreType: string, tableHead: string[] }) {
  const ref = useRef();
  const scoreType = props.scoreType;
  const tableHead = props.tableHead;
  //Scoring
  interface averageScore { name: string, score: number }
  let datas = props.data; let dataLength = 0;
  let avgScore: averageScore[] = [];
  for(var i in datas) { 
    let ltemp = 0;
    for (var j in datas[i].scores) { ltemp +=1; } 
      if(ltemp > dataLength) { dataLength = ltemp;}
  }
  let avg = Array.from({length: dataLength}, () => 0);
  for (let i = 0; i < datas.length; i++) { 
    for (let j = 0; j < datas[i].scores.length; j++) {
      let score = datas[i].scores[j] as number;
      if(!isNaN(score)){ // prevent nan
        avg[j] += score;
      }
    }
  }
  for (let i = 0; i < avg.length; i++) {
    avg[i] = parseInt((avg[i] / datas.length).toFixed(0))
    avgScore.push({ name: tableHead[i], score: avg[i] });
  }

  //Charting
  let boxW = dimensions.w - dimensions.margin.left - dimensions.margin.right
  let boxH = dimensions.h - dimensions.margin.bottom - dimensions.margin.top

  useEffect(() => {
    if (!ref.current) return
    if (avgScore.length != 0) {
      d3.selectAll("svg > *").remove()
      const svgElement = d3.select(ref.current)
      let dataset = avgScore;
      //chart area
      svgElement.attr('width', dimensions.w).attr('height', dimensions.h)
        .style("background-color", "transparent")
      svgElement.append('text')
        .attr('x', dimensions.w / 2).attr('y', 30)
        .style('text-anchor', 'middle').style('font-size', 20)
        .text(`Graph of Average ${scoreType} Score`)
      const box = svgElement.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

      //scale
      const xScale = d3.scaleBand()
        .range([0, boxW])
        .domain(tableHead)
        .padding(0.2);
      box.append("g").transition()
        .attr("transform", "translate(0," + boxH + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text").style("text-anchor", "middle");
      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([boxH, 0]);
      box.append("g").transition()
        .call(d3.axisLeft(yScale));

      box.selectAll("rect")
        .data(dataset).enter().append('rect')
        .attr('width', xScale.bandwidth).attr('height', function (d) { return boxH - yScale(d.score); })
        .attr("x", function (d) { return xScale(d.name); })
        .attr("y", function (d) { return yScale(d.score); })
        .attr("fill", "#69b3a2")
        .style("stroke-width", "0px").style("stroke", "black")
        .on('mouseover', mOverEvent)
        .on('mousemove', mMoveEvent)
        .on('mouseout', mOutEvent)
        .transition()
        
      //Axis
      const xAxisGroup = box.append("g").style('transform', `translateY(${boxH}px)`)
      const yAxisGroup = box.append("g")
      xAxisGroup.append('text')
        .attr('x', boxW / 2)
        .attr('y', dimensions.margin.bottom - 10)
        .attr('fill', 'black')
        .text(scoreType)
        .style('text-anchor', 'middle')
      yAxisGroup.append('text')
        .attr('x', -boxH / 2)
        .attr('y', -dimensions.margin.left + 15) // have - when you rotate
        .attr('fill', 'black')
        .text('Score')
        .style('transform', 'rotate(270deg)')
        .style('text-anchor', 'middle')

      const tooltip = d3.select('#tooltip')
      //event
      function mOverEvent(e: any, d: any) { //event, data
        d3.select(this).style('stroke-width', 2)
        d3.select(this).attr('fill', 'darkblue')
        //tooltip
        tooltip.select('.name')
          .html(
            `<b>${d.name}</b> <br/> 
            Score ${d.score} `
          )
          
      }
      
      function mMoveEvent(e: any, d: any) {
        tooltip.style('display', 'block')
        .style('top', e.pageY +'px').style('left', e.pageX+20 +'px')
      }

      function mOutEvent() {
        d3.select(this).style('stroke-width', 0)
        d3.select(this).attr('fill', '#69b3a2')
        d3.select('svg').selectAll('.temp').remove()
        tooltip.style('display', 'none')
      }
    }
  }, [avgScore, boxH, boxW, scoreType, tableHead])

  return <div >
    <div>
      <svg ref={ref}></svg>
      <Tooltip id='tooltip'>
          <div className='name'></div>
          <div className='score'></div>
        </Tooltip>
    </div>
  </div>
}


export function ChartLineAverage(props: { data: studentResult[], scoreType: string, tableHead: string[] }) {
  const ref = useRef();
  const scoreType = props.scoreType;
  const tableHead = props.tableHead;
  //Scoring
  interface averageScore { name: string, score: number }
  let datas = props.data; let dataLength = 0;
  let avgScore: averageScore[] = [];
  for(var i in datas) { 
    let ltemp = 0;
    for (var j in datas[i].scores) { ltemp +=1; } 
      if(ltemp > dataLength) { dataLength = ltemp;}
  }
  let avg = Array.from({length: dataLength}, () => 0);
  for (let i = 0; i < datas.length; i++) { 
    for (let j = 0; j < datas[i].scores.length; j++) {
      let score = datas[i].scores[j] as number;
      if(!isNaN(score)){ // prevent nan
        avg[j] += score;
      }
    }
  }
  for (let i = 0; i < avg.length; i++) {
    avg[i] = parseInt((avg[i] / datas.length).toFixed(0))
    avgScore.push({ name: tableHead[i], score: avg[i] });
  }

  //Charting
  let boxW = dimensions.w - dimensions.margin.left - dimensions.margin.right
  let boxH = dimensions.h - dimensions.margin.bottom - dimensions.margin.top

  useEffect(() => {
    if (avgScore.length != 0) {
      d3.selectAll("svg > *").remove();
      const svgElement = d3.select(ref.current)
      let dataset = avgScore;
      //chart area
      svgElement.attr('width', dimensions.w).attr('height', dimensions.h)
        .style("background-color", "transparent")
      svgElement.append('text')
        .attr('x', dimensions.w / 2).attr('y', 30)
        .style('text-anchor', 'middle').style('font-size', 20)
        .text(`Graph of Average ${scoreType} Score`)
      const box = svgElement.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

      //scale
      const xScale = d3.scalePoint()
        .domain(tableHead)
        .rangeRound([0, boxW])    
      box.append("g").transition()
        .attr("transform", "translate(0," + boxH + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text").style("text-anchor", "middle");
      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([boxH, 0]);
      box.append("g").transition()
        .call(d3.axisLeft(yScale));

      const mainColor = "#626beb";
      box.append("path").datum(dataset)
        .attr("fill", "none")
        .attr("stroke", "#989ff7")
        .attr("stroke-width", 3)
        .attr("d", d3.line<any>()
          .x(function(d) { return xScale(d.name) })
          .y(function(d) { return yScale(d.score) })
        )
        .transition()

      box.append("g").selectAll("dot")
        .data(dataset).enter()
        .append("circle")
        .attr("cx", function(d) { return xScale(d.name) } )
        .attr("cy", function(d) { return yScale(d.score) } )
        .attr("r", 5)
        .attr("fill", mainColor)
        .on('mouseover', mOverEvent)
        .on('mousemove', mMoveEvent)
        .on('mouseout', mOutEvent)
        .transition()

      //Axis
      const xAxisGroup = box.append("g").style('transform', `translateY(${boxH}px)`)
      const yAxisGroup = box.append("g")
      xAxisGroup.append('text')
        .attr('x', boxW / 2)
        .attr('y', dimensions.margin.bottom - 10)
        .attr('fill', 'black')
        .text(scoreType)
        .style('text-anchor', 'middle')
      yAxisGroup.append('text')
        .attr('x', -boxH / 2)
        .attr('y', -dimensions.margin.left + 15) // have - when you rotate
        .attr('fill', 'black')
        .text('Score')
        .style('transform', 'rotate(270deg)')
        .style('text-anchor', 'middle')

      const tooltip = d3.select('#tooltip')
      //event
      function mOverEvent(e: any, d: any) { //event, data
        d3.select(this).style('stroke-width', 2)
        d3.select(this).attr('fill', 'darkblue')
        d3.select(this).attr('r', 7.5)
        //tooltip
        tooltip.select('.name')
          .html(
            `<b>${d.name}</b> <br/> 
            Score ${d.score} `
          )
          
      }
      
      function mMoveEvent(e: any, d: any) {
        tooltip.style('display', 'block')
        .style('top', e.pageY +'px').style('left', e.pageX+20 +'px')
      }

      function mOutEvent() {
        d3.select(this).style('stroke-width', 0)
        d3.select(this).attr('fill', mainColor)
        d3.select(this).attr('r', 5)
        d3.select('svg').selectAll('.temp').remove()
        tooltip.style('display', 'none')
      }
    }
  }, [avgScore, boxH, boxW, scoreType, tableHead])

  return <div >
    <div>
      <svg ref={ref}></svg>
      <Tooltip id='tooltip'>
          <div className='name'></div>
          <div className='score'></div>
        </Tooltip>
    </div>
  </div>
}


export function ChartBarAll(props: { data:studentResult[], scoreType: string, tableHead: string[] }) {
  const ref = useRef();
  const tableHead = props.tableHead;
  //scoring
  let datas = props.data;
  const scoreType = props.scoreType;
  let allScore = []; // all student score graph
  let allScoreTemp = [];
  for(var i in datas) {
    allScoreTemp.push({name: datas[i].studentID})
    for(var j in datas[i].scores) {
      allScoreTemp[i][tableHead[j]] = datas[i].scores[j]
    }
  }
  let subgroupTemp = []
  if(datas.length != 0){
    subgroupTemp = Array.from({length: datas[0].scores.length}, (d,i) => tableHead[i]);
  } 
  allScore = allScoreTemp.slice();
  //Charting
  let boxW = dimensions.w - dimensions.margin.left - dimensions.margin.right
  let boxH = dimensions.h - dimensions.margin.bottom - dimensions.margin.top

  useEffect(() => {
    if (allScore.length != 0) {
      d3.selectAll("svg > *").remove();
      const svgElement = d3.select(ref.current)
      let dataset = allScore;
      //chart area
      svgElement.attr('width', dimensions.w).attr('height', dimensions.h)
        .style("background-color", "transparent")
      svgElement.append('text')
        .attr('x', dimensions.w / 2).attr('y', 30)
        .style('text-anchor', 'middle').style('font-size', 20)
        .text(`Graph of Students' ${scoreType} Score`)
      const box = svgElement.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

      //scale
      // var groups = d3.map(dataset, function(d){return(d.studentName)}).keys()
      var groups = allScore.map(d => d.name);
      var subgroups = subgroupTemp.slice();
      const xScale = d3.scaleBand()
        .domain(groups)
        .range([0, boxW])
        .padding(0.2);
      box.append("g").transition()
        .attr("transform", "translate(0," + boxH + ")")
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter(function(d,i){ 
          if(allScore.length >= 15){
            return !(i%4)
          }else{
            return !(i%2)
          }
          
      })))
        .selectAll("text").style("text-anchor", "middle")
        // .attr("transform", "translate(-25,15)rotate(-45)")
      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([boxH, 0]);
      box.append("g").transition()
        .call(d3.axisLeft(yScale));
      const xSubGroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, xScale.bandwidth()])
        .padding(0.05)
      
      const color = d3.scaleOrdinal<any>()
        .domain(subgroups)
        .range(d3.schemeSet1);

      box.append("g")
        .selectAll("g") // can use in svg instead
        .data(dataset).enter()
        .append('g')
          .attr("transform", function(d) { return "translate(" + xScale(d.name) + ",0)"; })
          .on('mouseover', mOverMain)
          .on('mousemove', mMoveMain)
          .selectAll('rect')
          .data(function(d) { return subgroups.map(function(key) { return {key: key, value: d[key]}; }); })
          .enter().append("rect")
            .attr("x", function(d) { return xSubGroup(d.key); })
            .attr("y", function(d) { return yScale(d.value); })
            .attr("width", xSubGroup.bandwidth())
            .attr("height", function(d) { return boxH - yScale(d.value); })
            .attr("fill", function(d) { return color(d.key); })
            .style('stroke-width', 0).style("stroke", "black")
            .style("opacity", 0.8)
            .on('mouseover', mOverEvent)
            .on('mousemove', mMoveEvent)
            .on('mouseout', mOutEvent)
            .transition()

      //Axis
      const xAxisGroup = box.append("g").style('transform', `translateY(${boxH}px)`)
      const yAxisGroup = box.append("g")
      xAxisGroup.append('text')
        .attr('x', boxW / 2)
        .attr('y', dimensions.margin.bottom - 10)
        .attr('fill', 'black')
        .text(scoreType)
        .style('text-anchor', 'middle')
        .transition()
      yAxisGroup.append('text')
        .attr('x', -boxH / 2)
        .attr('y', -dimensions.margin.left + 15) // have - when you rotate
        .attr('fill', 'black')
        .text('Score')
        .style('transform', 'rotate(270deg)')
        .style('text-anchor', 'middle')
        .transition()

      const tooltip = d3.select('#tooltip')
      const tooltipMain = d3.select('#tooltip2')
      
      //event
      function mOverMain(e: any, d: any) {
        tooltipMain.select('.name')
          .html(
            `<b>${d.name}</b> <br/> `
          )
      }
      function mMoveMain(e: any, d: any) {
        tooltipMain.style('display','block')
        .style('top', e.pageY-45 +'px').style('left', e.pageX+20 +'px')
      }
      function mOverEvent(e: any, d: any) { //event, data
        d3.select(this).style('opacity', 1)
        d3.select(this).style('stroke-width', 1)
        box.append('line')
          .attr('x1', 0).attr('y1', d3.select(this).attr('y'))
          .attr('x2', boxW).attr('y2', d3.select(this).attr('y'))
          .style('stroke', 'black').classed('temp', true).style('opacity', '0.25')
        //tooltip
        tooltip.select('.name')
          .html(
            `<b>${d.key}</b> <br/> 
            Score ${d.value} <br/>`
          )
      }

      function mMoveEvent(e: any, d: any) {
        tooltip.style('display','block')
        .style('top', e.pageY +'px').style('left', e.pageX+20 +'px')
      }
      function mOutEvent() {
        d3.select(this).style('opacity', 0.8)
        d3.select(this).style('stroke-width', 0)
        d3.select('svg').selectAll('.temp').remove()
        tooltip.style('display','none')
        tooltipMain.style('display','none')
      }
    }
  }, [allScore, boxH, boxW, scoreType, subgroupTemp])

  return <div /*style={{position: "absolute", right: "1%", width: "40%", height: "60%", marginTop: "0.5%"}}*/>
    <div>
      <svg ref={ref}>
      </svg>
      <Tooltip id='tooltip'>
        <div className='name'></div>
        <div className='score'></div>
      </Tooltip>
      <Tooltip id='tooltip2'>
        <div className='name'></div>
      </Tooltip>
    </div>
  </div>
}


export function ChartPieAverage(props: { data: studentResult[], scoreType: string, tableHead: string[] }) {
  const ref = useRef();
  const scoreType = props.scoreType;
  const tableHead = props.tableHead;
  const scoreDomain = [];
  let totalScore = 0;
  //Scoring
  interface averageScore { name: string, score: number }
  let datas = props.data; let dataLength = 0;
  let avgScore: averageScore[] = [];
  for(var i in datas) { 
    let ltemp = 0;
    for (var j in datas[i].scores) { ltemp +=1; } 
      if(ltemp > dataLength) { dataLength = ltemp;}
  }
  let avg = Array.from({length: dataLength}, () => 0);
  for (let i = 0; i < datas.length; i++) { 
    for (let j = 0; j < datas[i].scores.length; j++) {
      let score = datas[i].scores[j] as number;
      if(!isNaN(score)){ // prevent nan
        avg[j] += score;
      }
    }
  }
  for (let i = 0; i < avg.length; i++) {
    avg[i] = parseInt((avg[i] / datas.length).toFixed(0))
    avgScore.push({ name: tableHead[i], score: avg[i] });
    totalScore += avg[i]
    scoreDomain.push(tableHead[i])
  }

  //Charting
  let dimensions = {
    w: 550, h: 400,
    margin:{ top: 50, bottom: 50, left: 10, right: 50 }
  }
  let boxW = dimensions.w - dimensions.margin.left - dimensions.margin.right
  let boxH = dimensions.h - dimensions.margin.bottom - dimensions.margin.top
  var radius = Math.min(dimensions.w, dimensions.h) / 2 - dimensions.margin.top

  useEffect(() => {
    if (avgScore.length != 0) {
      d3.selectAll("svg > *").remove();
      const svgElement = d3.select(ref.current)
      let dataset = avgScore;
      //chart area
      svgElement.attr('width', dimensions.w).attr('height', dimensions.h)
        .style("background-color", "transparent")
      svgElement.append('text')
        .attr('x', dimensions.w / 2).attr('y', 30)
        .style('text-anchor', 'middle').style('font-size', 20)
        .text(`Graph of Average ${scoreType} Score`)
      const box = svgElement.append('g')
        .attr('transform', `translate(${dimensions.margin.left+250}, ${dimensions.margin.top+150})`)

      //scale
      const color = d3.scaleOrdinal<any>()
        .domain(scoreDomain)
        .range(d3.schemeDark2);

      const pie = d3.pie<averageScore>()
        .value(function(d) {return d.score; })
      const data_ready = pie(dataset)
      
      const arc = d3.arc<any>()
        .innerRadius(radius * 0.4)        
        .outerRadius(radius * 0.8)
      const outerArc = d3.arc<any>()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9)
      
      box.selectAll('allSlices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function(d) { return(color(d.data.name)) })
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.8)
        .on('mouseover', mOverEvent)
        .on('mousemove', mMoveEvent)
        .on('mouseout', mOutEvent)

      box.selectAll('allPolylines')
        .data(data_ready)
        .enter()
        .append('polyline').transition()
          .attr("stroke", "black")
          .style("fill", "none")
          .attr("stroke-width", 1)
          .attr('points', function(d) {
            const posA: any = arc.centroid(d)
            const posB: any = outerArc.centroid(d)
            const posC: any = outerArc.centroid(d);
            const midangle: any = d.startAngle + (d.endAngle - d.startAngle) / 2 
            posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1);
            return [posA, posB, posC] as any
          })

        box.selectAll('allLabels')
          .data(data_ready)
          .enter()
          .append('text').transition() // score/total for %
            .text( function(d) { return `${d.data.name} (${((d.data.score*100/totalScore)).toFixed(0)} %)` } )
            .attr('transform', function(d) {
              var pos = outerArc.centroid(d);
              var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
              pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
              return 'translate(' + pos + ')';
            })
            .style('text-anchor', function(d) {
              var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
              return (midangle < Math.PI ? 'start' : 'end')
            })

      const tooltip = d3.select('#tooltip')
      //event
      function mOverEvent(e: any, d: any) { //event, data
        d3.select(this).attr("stroke-width", 10)
        .attr("stroke", "black")
        d3.select(this).style("opacity", 1)
        //tooltip
        tooltip.select('.name')
          .html(
            `<b>${d.data.name}</b> <br/> 
            Score ${d.data.score} `
          )
          
      }
      
      function mMoveEvent(e: any, d: any) {
        tooltip.style('display','block')
        .style('top', e.pageY +'px').style('left', e.pageX+20 +'px')
      }

      function mOutEvent() {
        d3.select(this).attr("stroke-width", 1)
        .attr("stroke", "white")
        d3.select(this).style("opacity", 1)
        tooltip.style('display','none')
      }
    }
  }, [avgScore, dimensions.h, dimensions.margin.left, dimensions.margin.top, dimensions.w, radius, scoreDomain, scoreType, totalScore])

  return <div>
    <svg ref={ref}>
    </svg>
    <Tooltip id='tooltip'>
      <div className='name'>A</div>
      <div className='score'></div>
    </Tooltip>
  </div>
}


export function ChartBarAllScroll(props: { data: studentResult[], scoreType: string, tableHead: string[] }) {
  const ref = useRef();
  const tableHead = props.tableHead;
  //scoring
  let datas = props.data;
  const scoreType = props.scoreType;
  let allScore = []; // all student score graph
  let allScoreTemp = [];
  for(var i in datas) {
    allScoreTemp.push({name: datas[i].studentID})
    for(var j in datas[i].scores) {
      allScoreTemp[i][tableHead[j]] = datas[i].scores[j]
    }
  }
  let subgroupTemp = []
  if(datas.length != 0){
    subgroupTemp = Array.from({length: datas[0].scores.length}, (d,i) => tableHead[i]);
  } 
  allScore = allScoreTemp.slice();
  //Charting
  //boxW now in useEffect
  let boxH = dimensions.h - dimensions.margin.bottom - dimensions.margin.top
  useEffect(() => {
    if (allScore.length != 0) {
      d3.selectAll("svg > *").remove();
      const svgElement = d3.select(ref.current)
      let dataset = allScore;
      //chart area
      let boxW = dataset.length * 50 - dimensions.margin.left - dimensions.margin.right
      svgElement.attr('width', dimensions.w).attr('height', dimensions.h)
        .style("background-color", "transparent")
      svgElement.append('text')
        .attr('x', dimensions.w / 2).attr('y', 30)
        .style('text-anchor', 'middle').style('font-size', 20)
        .text(`Scrollable Graph of Students' ${scoreType} Score`)
      const box = svgElement.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
      //scale
      // var groups = d3.map(dataset, function(d){return(d.studentName)}).keys()
      var groups = allScore.map(d => d.name);
      var subgroups = subgroupTemp.slice();
      const xScale = d3.scaleBand()
        .domain(groups)
        .range([0, boxW])
        .padding(0.2);
      box.append("g").transition()
        .attr("transform", "translate(0," + boxH + ")")
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter(function(d,i){ 
            return !(i % 2)
          
      })))
        .selectAll("text").style("text-anchor", "middle")
        // .attr("transform", "translate(-25,15)rotate(-45)")
      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([boxH, 0]);
      box.append("g").transition()
        .call(d3.axisLeft(yScale));
      const xSubGroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, xScale.bandwidth()])
        .padding(0.05)
      
      const color = d3.scaleOrdinal<any>()
        .domain(subgroups)
        .range(d3.schemeSet1);

      box.append("g")
        .selectAll("g") // can use in svg instead
        .data(dataset).enter()
        .append('g')
          .attr("transform", function(d) { return "translate(" + xScale(d.name) + ",0)"; })
          .on('mouseover', mOverMain)
          .on('mousemove', mMoveMain)
          .selectAll('rect')
          .data(function(d) { return subgroups.map(function(key) { return {key: key, value: d[key]}; }); })
          .enter().append("rect")
            .attr("x", function(d) { return xSubGroup(d.key); })
            .attr("y", function(d) { return yScale(d.value); })
            .attr("width", xSubGroup.bandwidth())
            .attr("height", function(d) { return boxH - yScale(d.value); })
            .attr("fill", function(d) { return color(d.key); })
            .style('stroke-width', 0).style("stroke", "black")
            .style("opacity", 0.8)
            .on('mouseover', mOverEvent)
            .on('mousemove', mMoveEvent)
            .on('mouseout', mOutEvent)
            .transition()

      //Axis
      const xAxisGroup = box.append("g").style('transform', `translateY(${boxH}px)`)
      const yAxisGroup = box.append("g")
      xAxisGroup.append('text')
        .attr('x', boxW / 2)
        .attr('y', dimensions.margin.bottom - 10)
        .attr('fill', 'black')
        .text(scoreType)
        .style('text-anchor', 'middle')
        .transition()
      yAxisGroup.append('text')
        .attr('x', -boxH / 2)
        .attr('y', -dimensions.margin.left + 15) // have - when you rotate
        .attr('fill', 'black')
        .text('Score')
        .style('transform', 'rotate(270deg)')
        .style('text-anchor', 'middle')
        .transition()

      const tooltip = d3.select('#tooltip')
      const tooltipMain = d3.select('#tooltip2')
      
      //event
      function mOverMain(e: any, d: any) {
        tooltipMain.select('.name')
          .html( `<b>${d.name}</b> <br/> `)
      }
      function mMoveMain(e: any, d: any) {
        // let scrolls = document.getElementById("chartDiv").scrollLeft; // check scroll length for layerXY
        tooltipMain.style('display', 'block')
        .style('top', e.pageY-45 +'px').style('left', e.pageX+20 +'px')
      }
      function mOverEvent(e: any, d: any) { //event, data
        d3.select(this).style('opacity', 1)
        d3.select(this).style('stroke-width', 1)
        box.append('line')
          .attr('x1', 0).attr('y1', d3.select(this).attr('y'))
          .attr('x2', boxW).attr('y2', d3.select(this).attr('y'))
          .style('stroke', 'black').classed('temp', true).style('opacity', '0.25')
        //tooltip
        tooltip.select('.name')
          .html(
            `<b>${d.key}</b> <br/> 
            Score ${d.value} <br/>`
          )
      }

      function mMoveEvent(e: any, d: any) {
        // let scrolls = document.getElementById("chartDiv").scrollLeft; 
        tooltip.style('display', 'block')
        .style('top', e.pageY +'px').style('left', e.pageX+20 + 'px')
      }
      function mOutEvent() {
        d3.select(this).style('opacity', 0.8)
        d3.select(this).style('stroke-width', 0)
        d3.select('svg').selectAll('.temp').remove()
        tooltip.style('display','none')
        tooltipMain.style('display','none')
      }
    }
  }, [allScore, boxH, scoreType, subgroupTemp])

  return <div /*style={{position: "absolute", right: "1%", width: "40%", height: "60%", marginTop: "0.5%"}}*/>
    <div style={{ "overflow": "scroll", "overflowY": "hidden" }} id="chartDiv">
      <svg ref={ref} style={{"width": datas.length * 50}} >
      </svg>
      <Tooltip id='tooltip'>
        <div className='name'></div>
        <div className='score'></div>
      </Tooltip>
      <Tooltip id='tooltip2'>
        <div className='name'></div>
      </Tooltip>
    </div>
  </div>
}


export function ChartBarAllVertical(props: { data:studentResult[], scoreType: string, tableHead: string[] }) {
  const ref = useRef();
  const tableHead = props.tableHead;
  //scoring
  let datas = props.data;
  const scoreType = props.scoreType;
  let allScore = []; // all student score graph
  let allScoreTemp = [];
  for(var i in datas) {
    allScoreTemp.push({name: datas[i].studentID})
    for(var j in datas[i].scores) {
      allScoreTemp[i][tableHead[j]] = datas[i].scores[j]
    }
  }
  let subgroupTemp = []
  if(datas.length != 0){
    subgroupTemp = Array.from({length: datas[0].scores.length}, (d,i) => tableHead[i]);
  } 
  allScore = allScoreTemp.slice();
  //Charting
  let dimensions = {
    w: 550, h: 400,
    margin:{ top: 50, bottom: 50, left: 90, right: 50 }
  }
  
  useEffect(() => {
    if (allScore.length != 0) {
      d3.selectAll("svg > *").remove();
      const svgElement = d3.select(ref.current)
      let dataset = allScore;
      //chart area
      let boxW = dimensions.w - dimensions.margin.left - dimensions.margin.right
      let boxH = dataset.length * 60 - dimensions.margin.bottom - dimensions.margin.top
      svgElement.attr('width', dimensions.w).attr('height', dimensions.h)
        .style("background-color", "transparent")
      svgElement.append('text')
        .attr('x', dimensions.w / 2).attr('y', 30)
        .style('text-anchor', 'middle').style('font-size', 20)
        .text(`Vertical Graph of Students' ${scoreType} Score`)
      const box = svgElement.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

      //scale
      var groups = allScore.map(d => d.name);
      var subgroups = subgroupTemp.slice();
      const yScale = d3.scaleBand()
        .domain(groups)
        .range([0, boxH])
        .padding(0.2);
      box.append("g").transition()
        .call(d3.axisLeft(yScale));
        
      const xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, boxW]);
      box.append("g").transition()
        .attr("transform", "translate(0," + boxH + ")")
        .call(d3.axisBottom(xScale)).selectAll("text").style("text-anchor", "middle")
      const ySubGroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, yScale.bandwidth()])
        .padding(0.05)
      
      const color = d3.scaleOrdinal<any>()
        .domain(subgroups)
        .range(d3.schemeSet1);

      box.append("g")
        .selectAll("g") // can use in svg instead
        .data(dataset).enter()
        .append('g')
          .attr("transform", function(d) { return "translate(0," + yScale(d.name) + ")"; })
          .on('mouseover', mOverMain)
          .on('mousemove', mMoveMain)
          .selectAll('rect')
          .data(function(d) { return subgroups.map(function(key) { return {key: key, value: d[key]}; }); })
          .enter().append("rect")
            .attr("y", function(d) { return ySubGroup(d.key); })
            .attr("x", function(d) { return xScale(0); })
            .attr("height", ySubGroup.bandwidth())
            .attr("width", function(d) { return xScale(d.value); })
            .attr("fill", function(d) { return color(d.key); })
            .style('stroke-width', 0).style("stroke", "black")
            .style("opacity", 0.8)
            .on('mouseover', mOverEvent)
            .on('mousemove', mMoveEvent)
            .on('mouseout', mOutEvent)
            .transition()

      //Axis
      const xAxisGroup = box.append("g").style('transform', `translateY(${boxH}px)`)
      const yAxisGroup = box.append("g")
      xAxisGroup.append('text')
        .attr('x', boxW / 2)
        .attr('y', dimensions.margin.bottom - 10)
        .attr('fill', 'black')
        .text(scoreType)
        .style('text-anchor', 'middle')
        .transition()
      yAxisGroup.append('text')
        .attr('x', -boxH / 2)
        .attr('y', -dimensions.margin.left + 15) // have - when you rotate
        .attr('fill', 'black')
        .text('Score')
        .style('transform', 'rotate(270deg)')
        .style('text-anchor', 'middle')
        .transition()

      const tooltip = d3.select('#tooltip')
      const tooltipMain = d3.select('#tooltip2')
      
      //event
      function mOverMain(e: any, d: any) {
        tooltipMain.select('.name')
          .html(
            `<b>${d.name}</b> <br/> `
          )
      }
      function mMoveMain(e: any, d: any) {
        tooltipMain.style('display','block')
        .style('top', e.pageY-45 +'px').style('left', e.pageX+20 +'px')
      }
      function mOverEvent(e: any, d: any) { //event, data
        d3.select(this).style('opacity', 1)
        d3.select(this).style('stroke-width', 1)
        box.append('line')
          .attr('x1', d3.select(this).attr('width')).attr('y1', 0)
          .attr('x2', d3.select(this).attr('width')).attr('y2', boxH)
          .style('stroke', 'black').classed('temp', true).style('opacity', '0.25')
        //tooltip
        tooltip.select('.name')
          .html(
            `<b>${d.key}</b> <br/> 
            Score ${d.value} <br/>`
          )
      }

      function mMoveEvent(e: any, d: any) {
        tooltip.style('display','block')
        .style('top', e.pageY +'px').style('left', e.pageX+20 +'px')
      }
      function mOutEvent() {
        d3.select(this).style('opacity', 0.8)
        d3.select(this).style('stroke-width', 0)
        d3.select('svg').selectAll('.temp').remove()
        tooltip.style('display','none')
        tooltipMain.style('display','none')
      }
    }
  }, [allScore, dimensions.h, dimensions.margin.bottom, dimensions.margin.left, dimensions.margin.right, dimensions.margin.top, dimensions.w, scoreType, subgroupTemp])

  return <div /*style={{position: "absolute", right: "1%", width: "40%", height: "60%", marginTop: "0.5%"}}*/>
    <div>
      <svg ref={ref} style={{"height": datas.length * 60}}>
      </svg>
      <Tooltip id='tooltip'>
        <div className='name'></div>
        <div className='score'></div>
      </Tooltip>
      <Tooltip id='tooltip2'>
        <div className='name'></div>
      </Tooltip>
    </div>
  </div>
}

export function ChartDistribute(props: { data: studentResult[], scoreType: string, tableHead: string[] }) {
  const ref = useRef();
  const scoreType = props.scoreType;
  const tableHead = props.tableHead;
  const chartX = [];
  //Scoring
  interface averageScore { name: string, score: number }
  let datas = props.data; let dataLength = 0;
  //new scoring, average lo score of each student
  let stdScore: averageScore[] = []; 
  let scoreTemp: averageScore[] =[];
  let dataCount = 1; let currentScore = 0;
  let scores: number[] = [];
  for (let i = 0; i < datas.length; i++) {
    chartX.push(datas[i].studentID)
    scoreTemp.push({ name: datas[i].studentID, score: 0})
    dataCount = datas[i].scores.length;
    for (let j = 0; j < datas[i].scores.length; j++) {
      currentScore += datas[i].scores[j] as number;
    }
    scoreTemp[i].score = parseInt((currentScore/dataCount).toFixed(0));
    scores.push(parseInt((currentScore/dataCount).toFixed(0)));
    currentScore = 0
  }
  
  stdScore = scoreTemp.slice()
  //create dataset
  const bisectX = d3.bisector(function(d: any) { return d.x; }).left;
  let pct = d3.format('02.2f');
  let interval = 1;
  let lower = Math.min(...scores)
  let upper = Math.max(...scores);
  let mean =  ((stdScore).reduce((sum: any, current: any) => sum + current.score, 0))/stdScore.length
  function getStandardDeviation (array: any) {
    const n = array.length
    const mean = array.reduce((a, b) => a + b) / n
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
  }
  let sd = getStandardDeviation(scores);
  //create data
  let n =  Math.abs(Math.ceil((upper - lower / interval)))
  let data = [];
  let newData = [];
  let x_position = lower;
  for (var i = 0; i < n; i++) {
      data.push({
          "y": jstat.normal.pdf(x_position, mean, sd),
          "x": x_position
      })
      x_position += interval
  }
  newData = data.slice();

  //Charting
  let boxW = dimensions.w - dimensions.margin.left - dimensions.margin.right
  let boxH = dimensions.h - dimensions.margin.bottom - dimensions.margin.top

  useEffect(() => {
    if (newData.length != 0) {
      d3.selectAll("svg > *").remove();
      const svgElement = d3.select(ref.current)
      let dataset = newData;
      //chart area
      svgElement.attr('width', dimensions.w).attr('height', dimensions.h)
        .style("background-color", "transparent")
      svgElement.append('text')
        .attr('x', dimensions.w / 2).attr('y', 30)
        .style('text-anchor', 'middle').style('font-size', 20)
        .text(`Normal Distribution Graph of Student's ${scoreType} Score`)
      const box = svgElement.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)
      //scale
      const xScale = d3.scaleLinear()
        .domain([
          d3.min(dataset, function(d: any) { return d.x; }), 
          d3.max(dataset, function(d: any) { return d.x; })
        ]).range([0, boxW])
      const yScale = d3.scaleLinear()
        .domain([
          d3.min(dataset, function(d: any) { return d.y; }),
          d3.max(dataset, function(d: any) { return d.y; })
        ]).range([boxH, 0]);

      const area = d3.area()
        .x(function(d: any) { return xScale(d.x); })
        .y1(function(d: any) { return yScale(d.y); });
      const xlabels = [
        '-3\u03C3', '-2\u03C3', '-\u03C3', '0', '\u03C3', '2\u03C3', '3\u03C3'
      ];
      //Axis
      var xAxis = d3.axisBottom(xScale)
        .ticks(xlabels.length)
        .tickFormat(function (d, i) { return xlabels[i]; });
      var yAxis = d3.axisLeft(yScale)
        .ticks(8);
      
      const xAxisGroup = box.append("g").style('transform', `translateY(${boxH}px)`)
      xAxisGroup.append('text')
        .attr('x', boxW / 2)
        .attr('y', dimensions.margin.bottom - 10)
        .attr('fill', 'black')
        .text("z-scores")
        .style('text-anchor', 'middle')
      box.append("g").attr("id", "circles").selectAll("circle")
        .data(dataset).enter()
        .append("circle").attr("class", "dot")
        .attr("cx", function(d) { return xScale(d.x); })
        .attr("cy", function(d) { return yScale(d.y); })
        .attr("r", 1.5)

      area.y0(yScale(0));
      // cut off datapoints that are outside the axis
      box.append("clipPath").attr("id", "chart-area")
        .append("rect")
        .attr("width", boxW).attr("height", boxH);

      box.append("path")
        .data([dataset.slice(0, Math.floor(dataset.length / 2))])
        .attr("clip-path", "url(#chart-area)")
        .attr("class", "area")
        .attr("fill", "steelblue")
        .attr("d", area)
        .style('opacity', 0.2);

      box.append("text")
        .attr("id", "pdisplay")
        .attr("x", boxW/2)
        .attr("y", boxH/2)
        .style("text-anchor", "middle")
        .text("p(X \u2264 x) = 0.50");

      var focus = box.append("g")
        .attr("class", "focus")
        .style("display", "inline");

      focus.append("circle")
        .attr("r", 4.5)
        .style('fill', 'none')
        .style('stroke','steelblue');

      //  Set up focus (container for vertical guiding line)
      var center_point = dataset[Math.floor(dataset.length / 2) - 1];
      focus.attr(
        "transform", "translate(" + xScale(center_point.x) + "," + yScale(center_point.y) + ")"
      );
      focus.append("line")
        .style('stroke', '#E4002B')
        .style('stroke-width', 1.5)
        .attr('x1', 0).attr('x2', 0)
        .attr('y1', 0).attr('y2', boxH - yScale(center_point.y));

      // rect for tracking mouse (active over dimensions of svg )
      box.append("rect")
        .style('fill', 'white')
        .style('opacity', 0.05)
        .style('pointer-event', 'all')
        .attr("width", boxW + 5).attr("height", boxH + 5)
        .on("mousemove", mousemove)
        .on("mouseover", function () { focus.style("display", null); })
        .on("mouseout", function () { focus.style("display", "inline"); });
        
      box.append("g").attr("class", "x axis")
        .attr("transform", "translate(0," + boxH + ")")
        .call(xAxis);
      box.append("g").attr("class", "y axis").call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6).attr("x", -10)
        .attr("dy", "0.71em")
        .attr("fill", "#000")
        .text("Probability Density");

      function mousemove(e: any) {
        const x0 = xScale.invert(d3.pointer(e)[0]), // use d3.pointer(e) instead
          i = bisectX(dataset, x0, 1),
          d0 = dataset[i - 1],
          d1 = dataset[1],
          d = x0 - d0.x > d1.x - x0 ? d0 : d1;

        focus.attr("transform", "translate(" + xScale(d.x) + "," + yScale(d.y) + ")");
        focus.select('line')
          .attr('x1', 0).attr('x2', 0)
          .attr('y1', 0).attr('y2', boxH - yScale(d.y));
        //Update the 'area to go with the line'
        box.select("path")
          .data([dataset.slice(0, dataset.indexOf(d) + 1)])
          .attr("d", area);
        // Update center display
        box.select("#pdisplay").text('p(X \u2264 x) = ' + pct(jstat.normal.cdf(d.x, mean, sd)));
      }

    }
  }, [newData, bisectX, boxH, boxW, mean, pct, scoreType, sd])

  return <div >
    <div>
      <svg ref={ref}></svg>
      <Tooltip id='tooltip'>
          <div className='name'></div>
          <div className='score'></div>
        </Tooltip>
    </div>
  </div>
}


export function ChartDensity(props: { data: studentResult[], scoreType: string, tableHead: string[] }) {
  const ref = useRef();
  const scoreType = props.scoreType;
  const tableHead = props.tableHead;
  //Scoring
  interface averageScore { name: number, score: number }
  let datas = props.data; let dataLength = 0;
  let scores: number[] = Array.from({length: 101}, () => 0);
  let stdScore: any[] = Array.from({length: 101}, (d,i) => ({name: i, score: 0}));
  let scoreTemp: any[] = Array.from({length: 101}, (d,i) => ({name: i, score: 0}));
  let dataCount = 1; let currentScore = 0;
  let checkStart = 0; let checking = true;
  for (let i = 0; i < datas.length; i++) {
    dataCount = datas[i].scores.length;
    for (let j = 0; j < datas[i].scores.length; j++) {
      currentScore += datas[i].scores[j] as number;
    }
    let avgScore = parseInt((currentScore/dataCount).toFixed(0));
    scoreTemp[avgScore].name = avgScore;
    scoreTemp[avgScore].score += 1;
    scores[avgScore] += 1;
    currentScore = 0
  }
  // ignore 0 at start
  for (let i = 0; i < scores.length; i++) {
    if(scores[i] == 0 && checking) { checkStart += 1; }
    else { checking = false; }
  }

  stdScore = scoreTemp.slice(checkStart-1);

  //Charting
  let boxW = dimensions.w - dimensions.margin.left - dimensions.margin.right
  let boxH = dimensions.h - dimensions.margin.bottom - dimensions.margin.top

  useEffect(() => {
    if (stdScore.length != 0) {
      d3.selectAll("svg > *").remove();
      const svgElement = d3.select(ref.current)
      let dataset = stdScore;
      const bisectData = d3.bisector(function(d: any) { return d.name; }).center
      //chart area
      svgElement.attr('width', dimensions.w).attr('height', dimensions.h)
        .style("background-color", "transparent")
      svgElement.append('text')
        .attr('x', dimensions.w / 2).attr('y', 30)
        .style('text-anchor', 'middle').style('font-size', 20)
        .text(`Density Graph of ${scoreType} Score`)
      const box = svgElement.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

      //scale
      const xScale = d3.scaleLinear()
        .range([0, boxW])
        .domain([checkStart-1, 100])
      box.append("g").transition()
        .attr("transform", "translate(0," + boxH + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text").style("text-anchor", "middle");
      const yScale = d3.scaleLinear()
        .domain([0, d3.max(scores)])
        .range([boxH, 0]);
      box.append("g").transition()
        .call(d3.axisLeft(yScale).ticks(d3.max(scores), ".0f"));

      box.append("path")
        .datum(dataset)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("fill", "#69b3a2")
        .attr("d", d3.line<any>()
          .curve(d3.curveBumpX)
          .x(function(d) { return xScale(d.name) })
          .y(function(d) { return yScale(d.score) })
          )
        // .on('mouseover', mOverEvent)
        
      box.append("rect")
        .attr("width", boxW)
        .attr("height", boxH) 
        .style("fill", "none")
        .style("pointer-events", "all")
        .on('mouseover', mOverEvent)
        .on('mousemove', mMoveEvent)
        .on('mouseout', mOutEvent)

      if(checkStart > 1){ // if no less score than 1 
        box.append("text")
          .attr('x', 0)
          .attr('y', boxH + 45)
          .style('font-size', 9)
          .text(`No student got score less than or equal to ${checkStart}`)
      }
        
      //Axis
      const xAxisGroup = box.append("g").style('transform', `translateY(${boxH}px)`)
      const yAxisGroup = box.append("g")
      xAxisGroup.append('text')
        .attr('x', boxW / 2)
        .attr('y', dimensions.margin.bottom - 10)
        .attr('fill', 'black')
        .text(scoreType)
        .style('text-anchor', 'middle')
      yAxisGroup.append('text')
        .attr('x', -boxH / 2)
        .attr('y', -dimensions.margin.left + 15) // have - when you rotate
        .attr('fill', 'black')
        .text('Score')
        .style('transform', 'rotate(270deg)')
        .style('text-anchor', 'middle')

      const tooltip = d3.select('#tooltip')
      //event
      function mOverEvent(e: any) { //event, data
        box.append('line')
          .attr('x1', d3.pointer(e)[0]).attr('y1', 0)
          .attr('x2', d3.pointer(e)[0]).attr('y2', boxH)
          .style("pointer-events", "none")
          .style('stroke', 'black').classed('temp', true).style('opacity', '0.25')
      }
      
      function mMoveEvent(e: any) {
        d3.select(this).style('stroke-width', 3)
        const x0 = xScale.invert(d3.pointer(e)[0]) ,
          i = bisectData(dataset, x0, 1),
          d0 = dataset[i - 1].score,
          d1 = dataset[i].score,
          d = x0 - d0 > d1 - x0 ? d1 : d0;
        //tooltip
        tooltip.select('.name')
          .html(
            `<b>Score ${i+checkStart}</b> <br/> 
            ${d} student${d > 1 ? "s" : ""} got this score `
          )
        tooltip.style('display', 'block')
        .style('top', e.pageY +'px').style('left', e.pageX+20 +'px')
        d3.select('svg').selectAll('.temp')
          .attr('x1', d3.pointer(e)[0]).attr('y1', 0)
          .attr('x2', d3.pointer(e)[0]).attr('y2', boxH)
      }

      function mOutEvent() {
        d3.select(this).style('stroke-width', 1.5)
        d3.select('svg').selectAll('.temp').remove()
        tooltip.style('display', 'none')
      }
    }
  }, [stdScore, boxH, boxW, checkStart, scoreType, scores])

  return <div >
    <div>
      <svg ref={ref}></svg>
        <Tooltip id='tooltip'>
          <div className='name'></div>
          <div className='score'></div>
        </Tooltip>
    </div>
    
  </div>
}

const Tooltip = styled.div`
  border: 1px solid #ccc;
  position: absolute;
  padding: 10px;
  background-color: #fff;
  display: none;
  pointer-events: none;
`;
