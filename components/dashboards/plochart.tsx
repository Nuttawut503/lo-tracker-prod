import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import * as d3 from 'd3'

export interface studentResult {
  studentID: string,
  studentName: string,
  scores: Array<Number>
}

export function ChartBarPLO(props: { data: studentResult, scoreType: string, tableHead: string[] }) {
  const ref = useRef()
  const scoreType = props.scoreType
  const tableHead = props.tableHead
  //Scoring
  interface averageScore { name: string, score: number }
  let datas = props.data
  let avgScore: averageScore[] = [];
  for (let i = 0; i < datas.scores.length; i++){
    avgScore.push({name: tableHead[i], score: datas.scores[i] as number})
  }

  //Charting
  let dimensions = {
    w: 600, h: 380,
    margin: { top: 50, bottom: 50, left: 50, right: 50 }
  }
  let boxW = dimensions.w - dimensions.margin.left - dimensions.margin.right
  let boxH = dimensions.h - dimensions.margin.bottom - dimensions.margin.top

  useEffect(() => {
    if (avgScore.length != 0) {
      d3.selectAll("#chart1 > *").remove()
      const svgElement = d3.select(ref.current)
      let dataset = avgScore;
      //chart area
      svgElement.attr('width', dimensions.w).attr('height', dimensions.h)
        .style("background-color", "transparent")
      svgElement.append('text')
        .attr('x', dimensions.w / 2).attr('y', 35)
        .style('text-anchor', 'middle').style('font-size', 18)
        .text(`Graph of ${scoreType} Score`)
      const box = svgElement.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

      //scale
      const xScale = d3.scaleBand()
        .range([0, boxW])
        .domain(tableHead)
        .padding(0.2)
      box.append("g")
        .attr("transform", "translate(0," + boxH + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text").style("text-anchor", "middle");
      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([boxH, 0])
      box.append("g")
        .call(d3.axisLeft(yScale))

      box.selectAll("rect")
        .data(dataset).enter().append('rect')
        .attr('width', xScale.bandwidth).attr('height', function (d) { return boxH - yScale(d.score); })
        .attr("x", d => xScale(d.name))
        .attr("y", d => yScale(d.score))
        .attr("fill", "#3033d3")
        .style("stroke-width", "0px").style("stroke", "black")
        .on('mouseover', mOverEvent)
        .on('mousemove', mMoveEvent)
        .on('mouseout', mOutEvent)
        
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
          .style('top', e.pageY + 'px').style('left', e.pageX + 20 + 'px')
      }

      function mOutEvent() {
        d3.select(this).style('stroke-width', 0)
        d3.select(this).attr('fill', '#3033d3')
        d3.select('svg').selectAll('.temp').remove()
        tooltip.style('display', 'none')
      }
    }
  }, [avgScore, boxH, boxW, dimensions.h, dimensions.margin.bottom, dimensions.margin.left, dimensions.margin.top, dimensions.w, scoreType, tableHead])

  return <div >
      <svg ref={ref} style={{ display: "block", margin: "auto" }} id="chart1"></svg>
      <Tooltip id='tooltip'>
        <div className='name'></div>
        <div className='score'></div>
      </Tooltip>
  </div>
}

export function ChartBarLO(props: { data: studentResult, scoreType: string, tableHead: string[] }) {
  const reff = useRef()
  const scoreType = props.scoreType
  const tableHead = props.tableHead
  //Scoring
  interface averageScore { name: string, score: number }
  let datas = props.data
  let avgScore: averageScore[] = []
  for (let i = 0; i < datas.scores.length; i++){
    avgScore.push({name: tableHead[i], score: datas.scores[i] as number})
  }
  //Charting
  let dimensions = {
    w: 550, h: 300,
    margin: { top: 50, bottom: 50, left: 50, right: 50 }
  }
  let boxW = dimensions.w - dimensions.margin.left - dimensions.margin.right
  let boxH = dimensions.h - dimensions.margin.bottom - dimensions.margin.top

  useEffect(() => {
    if (avgScore.length != 0) {
      d3.selectAll("#chart2 > *").remove()
      const svgElement = d3.select(reff.current)
      let dataset = avgScore
      //chart area
      svgElement.attr('width', dimensions.w).attr('height', dimensions.h)
        .style("background-color", "transparent")
      svgElement.append('text')
        .attr('x', dimensions.w / 2).attr('y', 35)
        .style('text-anchor', 'middle').style('font-size', 18)
        .text(`Graph of ${scoreType} Score`)
      const box = svgElement.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

      //scale
      const xScale = d3.scaleBand()
        .range([0, boxW])
        .domain(tableHead)
        .padding(0.2)
      box.append("g")
        .attr("transform", "translate(0," + boxH + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text").style("text-anchor", "middle")
      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([boxH, 0])
      box.append("g")
        .call(d3.axisLeft(yScale))

      box.selectAll("rect")
        .data(dataset).enter().append('rect')
        .attr('width', xScale.bandwidth).attr('height', function (d) { return boxH - yScale(d.score); })
        .attr("x", d => xScale(d.name))
        .attr("y", d => yScale(d.score))
        .attr("fill", "#0c7c1f")
        .style("stroke-width", "0px").style("stroke", "black")
        .on('mouseover', mOverEvent)
        .on('mousemove', mMoveEvent)
        .on('mouseout', mOutEvent)

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

      const tooltip = d3.select('#tooltip2')
      //event
      function mOverEvent(e: any, d: any) { //event, data
        d3.select(this).style('stroke-width', 2)
        d3.select(this).attr('fill', 'darkgreen')
        //tooltip
        tooltip.select('.name')
          .html(
            `<b>${d.name}</b> <br/> 
              Score ${d.score} `
          )
      }
      function mMoveEvent(e: any, d: any) {
        tooltip.style('display', 'block')
          .style('top', e.pageY + 'px').style('left', e.pageX+20 + 'px')
      }

      function mOutEvent() {
        d3.select(this).style('stroke-width', 0)
        d3.select(this).attr('fill', '#0c7c1f')
        d3.select('svg').selectAll('.temp').remove()
        tooltip.style('display', 'none')
      }
    }
  }, [avgScore, boxH, boxW, dimensions.h, dimensions.margin.bottom, dimensions.margin.left, dimensions.margin.top, dimensions.w, scoreType, tableHead])

  return <div id="chartDiv">
      <svg ref={reff} style={{ display: "block", margin: "auto" }} id="chart2"></svg>
      <Tooltip id='tooltip2'>
        <div className='name'></div>
        <div className='score'></div>
      </Tooltip>
  </div>
}


// for all plo dashboards
interface ploResult{
  title: string
  description: string
  stats: {
    min: number
    max: number
    mean: number
    median: number
  }
}

export function ChartBarPLOAll(props: { data: ploResult[], scoreType: string }) {
  const ref = useRef()
  function toPercentage(n: number){ return parseInt((n * 100).toFixed(0)) }
  //scoring
  let datas = props.data
  const scoreType = props.scoreType
  let allScore = [] // all student score graph
  let allScoreTemp = []
  for(var i in datas) {
    allScoreTemp.push({title: datas[i].title})
    allScoreTemp[i]['min'] = toPercentage(datas[i].stats.min)
    allScoreTemp[i]['max'] = toPercentage(datas[i].stats.max)
    allScoreTemp[i]['mean'] = toPercentage(datas[i].stats.mean)
    allScoreTemp[i]['median'] = toPercentage(datas[i].stats.median)
  }

  allScore = allScoreTemp.slice()
  //Charting
  let dimensions = {
    w: 550, h: 300,
    margin: { top: 50, bottom: 50, left: 50, right: 50 }
  }
  let boxW = dimensions.w - dimensions.margin.left - dimensions.margin.right
  let boxH = dimensions.h - dimensions.margin.bottom - dimensions.margin.top

  useEffect(() => {
    if (allScore.length != 0) {
      d3.selectAll("svg > *").remove()
      const svgElement = d3.select(ref.current)
      let dataset = allScore
      //chart area
      svgElement.attr('width', dimensions.w).attr('height', dimensions.h)
        .style("background-color", "transparent")
      svgElement.append('text')
        .attr('x', dimensions.w / 2).attr('y', 30)
        .style('text-anchor', 'middle').style('font-size', 20)
        .text(`Graph of ${scoreType} Statistics`)
      const box = svgElement.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

      //scale
      // var groups = d3.map(dataset, function(d){return(d.studentName)}).keys()
      var groups = allScore.map(d => d.title)
      var subgroups = ['min', 'max', 'mean', 'median']
      // var subgroups = ['max', 'mean', 'median', 'min'];
      const xScale = d3.scaleBand()
        .domain(groups)
        .range([0, boxW])
        .padding(0.2)
      box.append("g").transition()
        .attr("transform", "translate(0," + boxH + ")")
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter(function(d,i){ 
          if(allScore.length >= 10){
            return !(i%2)
          }else{
            return !(i%1)
          }
          
      })))
        .selectAll("text").style("text-anchor", "middle")
        // .attr("transform", "translate(-25,15)rotate(-45)")
      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([boxH, 0])
      box.append("g").transition()
        .call(d3.axisLeft(yScale))
      const xSubGroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, xScale.bandwidth()])
        .padding(0.05)
      
      const color = d3.scaleOrdinal<any>()
        .domain(subgroups)
        .range(d3.schemeDark2)

      box.append("g")
        .selectAll("g") // can use in svg instead
        .data(dataset).enter()
        .append('g')
          .attr("transform", function(d) { return "translate(" + xScale(d.title) + ",0)"; })
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
            `<b>${d.title}</b> <br/> `
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
  }, [allScore, boxH, boxW, dimensions.h, dimensions.margin.bottom, dimensions.margin.left, dimensions.margin.top, dimensions.w, scoreType])

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


const Tooltip = styled.div`
  border: 1px solid #ccc;
  position: absolute;
  padding: 10px;
  background-color: #fff;
  display: none;
  pointer-events: none;
`;
