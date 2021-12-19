import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import styled from 'styled-components'

interface studentResult {
  studentID: string,
  studentName: string,
  scores: Array<Number>
}

interface averageScore {
  name: string, avgScore: number, stdScore: number
}

export function ChartBarCompare(props: { data: studentResult[], stdData: studentResult[], scoreType: string, tableHead: string[] }) {
  const ref = useRef()
  const scoreType = props.scoreType
  const tableHead = props.tableHead
  //scoring
  let stdDatas = props.stdData
  let datas = props.data
  let avgScoreTemp: averageScore[] = []
  let dataLength = 0
  for (var i in datas) {
    let ltemp = 0
    for (var j in datas[i].scores) { ltemp += 1; }
    if (ltemp > dataLength) { dataLength = ltemp; }
  }
  let avg = Array.from({ length: dataLength }, () => 0);
  for (let i = 0; i < datas.length; i++) {
    for (let j = 0; j < datas[i].scores.length; j++) {
      let score = datas[i].scores[j] as number
      if (!isNaN(score)) { // prevent nan
        avg[j] += score
      }
    }
  }
  for (let i = 0; i < avg.length; i++) {
    avg[i] = parseInt((avg[i] / datas.length).toFixed(0))
    avgScoreTemp.push({ name: tableHead[i], avgScore: avg[i], stdScore: 20 })
  }
  if (stdDatas.length !== 0) {
    for (let i = 0; i < avgScoreTemp.length; i++) {
      avgScoreTemp[i]['stdScore'] = stdDatas[0].scores[i] as number
    }
  }
  if (stdDatas.length == 2) { // add compare
    for (let i = 0; i < avgScoreTemp.length; i++) {
      avgScoreTemp[i]['compareScore'] = stdDatas[1].scores[i] as number
    }
  }
  let avgScore = avgScoreTemp.slice()

  let subgroupTemp = []
  if (datas.length != 0) {
    if (stdDatas.length == 1) {
      subgroupTemp = (["stdScore", "avgScore"])
    }
    else {
      subgroupTemp = (["stdScore", "avgScore", "compareScore"])
    }

  }
  //charting
  let dimensions = {
    w: 600, h: 400,
    margin: { top: 50, bottom: 50, left: 50, right: 50 }
  }
  let boxW = dimensions.w - dimensions.margin.left - dimensions.margin.right
  let boxH = dimensions.h - dimensions.margin.bottom - dimensions.margin.top

  useEffect(() => {
    if (avgScore.length != 0) {
      d3.selectAll("#svg1 > *").remove()
      const svgElement = d3.select(ref.current)
      let dataset = avgScore
      //chart area
      svgElement.attr('width', dimensions.w).attr('height', dimensions.h)
        .style("background-color", "transparent")
      svgElement.append('text')
        .attr('x', dimensions.w / 2).attr('y', 30)
        .style('text-anchor', 'middle').style('font-size', 20)
        .text(`Graph of ${scoreType} Score`)
      const box = svgElement.append('g')
        .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`)

      //scale
      // var groups = d3.map(dataset, function(d){return(d.studentName)}).keys()
      var groups = avgScore.map(d => d.name)
      var subgroups = subgroupTemp.slice()
      const xScale = d3.scaleBand()
        .domain(groups)
        .range([0, boxW])
        .padding(0.2)
      box.append("g")
        .attr("transform", "translate(0," + boxH + ")")
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter(function (d, i) {
          return !(i % 1)
        })))
        .selectAll("text").style("text-anchor", "middle")
      // .attr("transform", "translate(-25,15)rotate(-45)")
      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([boxH, 0])
      box.append("g")
        .call(d3.axisLeft(yScale))
      const xSubGroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, xScale.bandwidth()])
        .padding(0.05)
      var color = d3.scaleOrdinal<any>()
        .domain(subgroups)
        .range(['#2ace40', '#5299d3', '#347432'])

      var lab = d3.scaleLinear().interpolate(d3.interpolate).domain([0, 10, 21])
      box.append("g")
        .selectAll("g")
        .data(dataset).enter()
        .append('g')
        .attr("transform", function (d) { return "translate(" + xScale(d.name) + ",0)"; })
        .on('mouseover', mOverMain)
        .on('mousemove', mMoveMain)
        .selectAll('rect')
        .data(function (d) { return subgroups.map(function (key) { return { key: key, value: d[key] }; }); })
        .enter().append("rect")
        .attr("x", function (d) { return xSubGroup(d.key); })
        .attr("y", function (d) { return yScale(d.value); })
        .attr("width", xSubGroup.bandwidth())
        .attr("height", function (d) { return boxH - yScale(d.value); })
        .attr("fill", function (d) { return color(d.key); })
        .style('stroke-width', 0).style("stroke", "black")
        .style('opacity', 0.8)
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
            `<b>${d.name}</b> `
          )
      }
      function mMoveMain(e: any, d: any) {
        tooltipMain.style('display', 'block')
          .style('top', e.pageY - 45 + 'px').style('left', e.pageX + 20 + 'px')
      }

      function mOverEvent(e: any, d: any) { //event, data
        d3.select(this).style('opacity', 1)
        d3.select(this).style('stroke-width', 2)
        box.append('line')
          .attr('x1', 0).attr('y1', d3.select(this).attr('y'))
          .attr('x2', dimensions.w).attr('y2', d3.select(this).attr('y'))
          .style('stroke', 'black').classed('temp', true).style('opacity', '0.25')
        //tooltip
        let name = "Current Student Score";
        if (d.key == "avgScore") { name = "Average Class Score" }
        else if (d.key == "compareScore") { name = "Compared Student Score" }
        tooltip.select('.name')
          .html(
            `<b>${name}</b> <br/> 
              Score ${d.value} <br/>`
          )
      }

      function mMoveEvent(e: any, d: any) {
        tooltip.style('display', 'block')
          .style('top', e.pageY + 'px').style('left', e.pageX + 20 + 'px')
      }

      function mOutEvent() {
        d3.select(this).style('opacity', 0.8)
        d3.select(this).style('stroke-width', 0)
        d3.select('#svg1').selectAll('.temp').remove()
        tooltip.style('display', 'none')
        tooltipMain.style('display', 'none')
      }
    }
  }, [avgScore, boxH, boxW, dimensions.h, dimensions.margin.bottom, dimensions.margin.left, dimensions.margin.top, dimensions.w, scoreType, subgroupTemp])

  return (<div style={{ width: "65%", height: "50%", marginTop: "0.5%" }}>
    <div>
      <svg ref={ref} id="svg1">
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
  )
}

export function ChartPie(props: { stdData: studentResult[], scoreType: string, tableHead: string[] }) {
  const ref = useRef()
  const scoreType = props.scoreType
  const tableHead = props.tableHead
  const scoreDomain = []
  let totalScore = 0
  //Scoring
  interface averageScore { name: string, score: number }
  let datas = props.stdData; let dataLength = 0
  let dataScore: averageScore[] = []
  let ltemp = 0
  if(datas.length != 0){
    let scores = datas[0].scores
    for (var j in datas[0].scores) { ltemp +=1; } 
    if(ltemp > dataLength) { dataLength = ltemp;}
    for (let i = 0; i < scores.length; i++) {
      dataScore.push({ name: tableHead[i], score: scores[i] as number })
      totalScore += scores[i] as number
      scoreDomain.push(tableHead[i])
    }
  }
  

  //Charting
  let dimensions = {
    w: 600, h: 300,
    margin:{ top: 30, bottom: 50, left: 50, right: 50 }
  }
  let boxW = dimensions.w - dimensions.margin.left - dimensions.margin.right
  let boxH = dimensions.h - dimensions.margin.bottom - dimensions.margin.top
  var radius = Math.min(dimensions.w, dimensions.h) / 2 - dimensions.margin.top

  useEffect(() => {
    if (dataScore.length != 0) {
      d3.selectAll("#svg2 > *").remove()
      const svgElement = d3.select(ref.current)
      let dataset = dataScore
      //chart area
      svgElement.attr('width', dimensions.w).attr('height', dimensions.h)
        .style("background-color", "transparent")
      svgElement.append('text')
        .attr('x', dimensions.w / 2).attr('y', 60)
        .style('text-anchor', 'middle').style('font-size', 16)
        .text(`Graph of ${scoreType} Score Ratio`)
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

      box.selectAll('allPolylines')
        .data(data_ready)
        .enter()
        .append('polyline')
          .attr("stroke", "black")
          .style("fill", "none")
          .attr("stroke-width", 1)
          .attr('points', function(d) {
            const posA: any = arc.centroid(d)
            const posB: any = outerArc.centroid(d)
            const posC: any = outerArc.centroid(d);
            const midangle: any = d.startAngle + (d.endAngle - d.startAngle) / 2 
            posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1)
            return [posA, posB, posC] as any
          })

        box.selectAll('allLabels')
          .data(data_ready)
          .enter()
          .append('text') // score/total for %
            .text( function(d) { return `${d.data.name} (${((d.data.score*100/totalScore)).toFixed(0)} %)` } )
            .attr('transform', function(d) {
              var pos = outerArc.centroid(d);
              var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
              pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1)
              return 'translate(' + pos + ')'
            })
            .style('text-anchor', function(d) {
              var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
              return (midangle < Math.PI ? 'start' : 'end')
            })
            
    }
  }, [dataScore, dimensions.h, dimensions.margin.left, dimensions.margin.top, dimensions.w, radius, scoreDomain, scoreType, totalScore])

  return <div>
    <svg ref={ref} id="svg2">
    </svg>
    <Tooltip id='tooltip2'>
      <div className='name'></div>
      <div className='score'></div>
    </Tooltip>
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