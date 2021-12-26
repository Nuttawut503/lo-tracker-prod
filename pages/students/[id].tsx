import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import router from 'next/router'
import { useEffect, useState, useRef, useContext } from 'react'
import { OverlayTrigger, Table, Tooltip, Collapse } from 'react-bootstrap'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import { ParsedUrlQuery } from 'querystring'

import { initializeApollo } from 'libs/apollo-client'
import { ChartBarPLO, ChartBarLO } from 'components/dashboards/plochart'
import { AuthContext } from 'components/auth-wrapper'

export default function Page({ student, dashboard }: { student: StudentModel, dashboard: IndividualDashboard }) {
  const { isSignedIn, isTeacher, isSameUserID } = useContext(AuthContext)
  const [ploDataType, setPLOType] = useState("loading")
  function handleType(e: any) { setPLOType(e.target.value) }
  const [chartData, setChart] = useState<studentResult>({ studentID: student.id, studentName: student.name, scores: [] })
  const [tableData, setData] = useState([])
  let plos: any[] = dashboard.ploGroups.slice()
  plos.sort((a: any, b: any) => a.name.localeCompare(b.name))

  const ploRef = useRef(null)
  const loRef = useRef(null)
  function scrollTo(ref: any) {
    ref.current.scrollIntoView()
  }

  if (plos.length != 0 && ploDataType == "loading") {
    setPLOType(plos[0].name)
  }
  useEffect(() => {
    let targetPLOs = plos.find(e => e.name == ploDataType)
    targetPLOs.plos.sort((a: any, b: any) => a.title.localeCompare(b.title))

    setData(targetPLOs.plos.slice())
    chartData.scores = []
    for (let i = 0; i < targetPLOs.plos.length; i++) {
      chartData.scores.push(parseInt((targetPLOs.plos[i].percentage * 100 as number).toFixed(0)))
    }
    setChart(chartData)

  }, [ploDataType])

  if (!isSignedIn) return null
  const noPermission = !isTeacher && !isSameUserID(student.id)
  if (noPermission) return <p className="text-center">No permission</p>

  return <div className="bg-white p-3 rounded-md shadow-md">
    <Head>
      <title>{student.name}&#39;s Dashboard</title>
    </Head>
    <div>
      <div className="flex justify-between">
        <p style={{ fontSize: 20 }} ref={ploRef} onClick={() => scrollTo(ploRef)}>Program Learning Outcome Dashboard</p>
        <button className="bg-white hover:bg-gray-400 px-2 border border-gray-400 rounded"
          onClick={() => scrollTo(loRef)} > &#8595;Go down</button>
      </div>
      <div>
        <BackButton onClick={() => {
          if (isTeacher) router.back()
          else router.replace('/')
        }} className="text-xl">
          &#12296;Back
        </BackButton>
        <h6>ID: {student.id}</h6>
        <h6>Email: {student.email}</h6>
        <h6>Name: {student.name} {student.surname}</h6>
      </div><br />
      <span>Select PLO Group to view: </span>
      <select value={ploDataType} onChange={handleType} className="border rounded-md border-2 ">
        {plos.map((d, i) => (
          <option key={`ploset` + i} value={d.name}>{d.name}</option>
        ))}
      </select>
      <TableScrollDiv>
        <TableScrollable striped bordered className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              {tableData.map((data, i) => (<OverlayTrigger
                placement="right" overlay={
                  <Tooltip id={`tooltip${i}`}>
                    <b>Description</b>
                    <p>{data.description}</p>
                  </Tooltip>
                } key={`data${i}`}><th>
                  {data.title} (%)</th></OverlayTrigger>))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{student.id}</td>
              <td>{student.name} {student.surname}</td>
              {tableData.map((scores, i) => (
                <td key={`${student.id}${i}`}>{(scores.percentage * 100 as number).toFixed(0)}</td>
              ))}
            </tr>
          </tbody>
        </TableScrollable>
      </TableScrollDiv>
      <ChartBarPLO data={chartData} scoreType={"Program Learning Outcome"} tableHead={tableData.map(d => d.title)} />
    </div>
    <div>
      <div className="flex justify-between">
        <p style={{ fontSize: 20 }} ref={loRef} onClick={() => scrollTo(loRef)}>Learning Outcome Dashboard</p>
        <button className="bg-white hover:bg-gray-400 px-2 border border-gray-400 rounded"
          onClick={() => scrollTo(ploRef)} > &#8593;Go up</button>
      </div>
      <LODashboard student={student} dashboard={dashboard} />
    </div>
  </div>
}

function LODashboard({ student, dashboard }: { student: StudentModel, dashboard: IndividualDashboard }) {
  const [course, setCourse] = useState("loading")
  function handleType(e: any) { setCourse(e.target.value) }
  const [chartData, setChart] = useState<studentResult>({ studentID: student.id, studentName: student.name, scores: [] })
  const [tableData, setData] = useState([])
  const [quizData, setQuiz] = useState([])
  const [show, setShows] = useState([])
  function setShow(i: number) {
    show[i] = !show[i]
    setShows(show.slice())
  }

  let courses = dashboard.courses.slice()
  courses.sort((a, b) => a.name.localeCompare(b.name))

  if (dashboard.ploGroups.length != 0 && course == "loading") {
    setCourse(courses[0].name)
  }
  useEffect(() => {
    let targetCourse = courses.find(e => e.name == course)
    targetCourse.los.sort((a: any, b: any) => a.title.localeCompare(b.title))
    
    for (let i = 0; i < targetCourse.los.length; i++) {
      targetCourse.los[i].levels.sort((a: any, b: any) => {
        if (a.level < b.level) return -1
        if (a.level > b.level) return 1
        return 0
      })
    }

    setShows(Array.from({ length: targetCourse.quizzes.length }, () => false))
    setData(targetCourse.los.slice())
    setQuiz(targetCourse.quizzes.slice())
    chartData.scores = []
    for (let i = 0; i < targetCourse.los.length; i++) {
      chartData.scores.push(parseInt((targetCourse.los[i].percentage * 100 as number).toFixed(0)))
    }
    setChart(chartData)

  }, [course])
  let LvlArray = []
  function resetLoLvl() { LvlArray = [] }
  function getLoName(id: string) {
    LvlArray.push(tableData.find(e => e.id == id.split(',')[0]).levels.find(e => e.level == id.split(',')[1]).description)
  }
  function showLoLvl() {
    const LvlArrays = Array.from(new Set(LvlArray))
    LvlArrays.sort((a, b) => a.localeCompare(b))
    return LvlArrays.map((d, i) => <p key={`lvl${i}`}>{d}</p>)
  }

  return (
    <div>
      <span>Select Course: </span>
      <select value={course} onChange={handleType} className="border rounded-md border-2 ">
        {courses.map((d, i) => (
          <option key={`ploset` + i} value={d.name}>{d.name}</option>
        ))}
      </select>
      <TableScrollDiv>
        <TableScrollable striped bordered className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              {tableData.map((data, i) => (<OverlayTrigger
                placement="right" overlay={
                  <Tooltip id={`tooltip${i}`}>
                    <b>LO Levels</b>
                    {data.levels.map((lvl, i) => (
                      <p key={`level${i}`}>{lvl.description}</p>
                    ))}
                  </Tooltip>
                } key={`data${i}`}><th>
                  {data.title} (%)</th></OverlayTrigger>))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{student.id}</td>
              <td>{student.name} {student.surname}</td>
              {tableData.map((scores, i) => (
                <td key={`score${i}`}>{(scores.percentage * 100 as number).toFixed(0)}</td>
              ))}
            </tr>
          </tbody>
        </TableScrollable>
      </TableScrollDiv>
      <div className="flex">
        <div style={{ minWidth: "50%", minHeight: "300px" }}>
          <p className="text-xl">Quiz Score</p>
          {quizData.map((d, i) => (
            <div key={`quiz${i}`}>
              <p>{d.name} : {d.studentScore} / {d.maxScore}</p>
              <p onClick={() => setShow(i)}>Linked to {d.los.length} LO levels
                {show[i] === false ? <span>&#11167;</span> : <span>&#11165;</span>}</p>
              <Collapse in={show[i]}>
                <div>
                  {resetLoLvl()}
                  {d.los.map(los => (
                    getLoName(los)
                  ))}
                  {showLoLvl()}
                </div>
              </Collapse>
            </div>
          ))}
        </div>
        <div>
          <ChartBarLO data={chartData} scoreType={"Learning Outcome"} tableHead={tableData.map(d => d.title.substring(0, 4))} />
        </div>
      </div>
    </div>
  )

}

interface PageParams extends ParsedUrlQuery {
  id: string
}

export const getStaticProps: GetStaticProps<{ student: StudentModel, dashboard: IndividualDashboard }> = async (context) => {
  try {
    const { id: studentID } = context.params as PageParams
  const client = initializeApollo(process.env.SSG_SECRET)
  const data = await Promise.all([
    client.query<{ student: StudentModel }, { studentID: string }>({
      query: GET_STUDENT,
      variables: { studentID },
    }),
    client.query<{ individualSummary: IndividualDashboard }, { studentID: string }>({
      query: GET_DASHBOARD,
      variables: { studentID },
    }),
  ])
  return {
    props: {
      student: data[0].data.student,
      dashboard: data[1].data.individualSummary,
    },
    revalidate: 30,
  }
  }catch{
    return {
      props: {
        student: undefined,
        dashboard: null,
      },
      revalidate: 30,
    }
  }
  
}

export const getStaticPaths: GetStaticPaths = async (context) => {
  try {
    const GET_STUDENTS = gql`
    query Students {
      students {
        id
  }}`
    const client = initializeApollo(process.env.SSG_SECRET)
    const { data } = await client.query<{ students: StudentModel[] }>({
      query: GET_STUDENTS,
    })
    return {
      paths: data.students.map((student) => ({
        params: { id: student.id }
      })),
      fallback: 'blocking',
    }
  } catch {
    return {
      paths: [],
      fallback: 'blocking'
    }
  }

}

interface StudentModel {
  id: string
  email: string
  name: string
  surname: string
}

const GET_STUDENT = gql`
  query Student($studentID: ID!) {
    student(studentID: $studentID) {
      id
      email
      name
      surname
}}`

const GET_DASHBOARD = gql`
  query IndividualSummary($studentID: ID!) {
    individualSummary(studentID: $studentID) {
      ploGroups {
        name
        plos {
          title
          description
          percentage
        }
      }
      courses {
        name
        semester
        year
        los {
          id
          title
          percentage
          levels {
            level
            description
          }
        }
        quizzes {
          id
          name
          maxScore
          studentScore
          los
        }
      }
}}`

interface IndividualDashboard {
  ploGroups: {
    name: string
    plos: {
      title: string
      description: string
      percentage: number//0-1
    }[]
  }[]
  courses: {
    name: string
    semester: number
    year: number
    los: {
      id: string
      title: string
      percentage: number//0-1
      levels: {
        level: number
        description: string
      }[]
    }[]
    quizzes: {
      id: string
      name: string
      maxScore: number
      studentScore: number
      los: string[]//array of "id,level"
    }[]
  }[]
}

interface studentResult {
  studentID: string
  studentName: string
  scores: number[]
}

const BackButton = styled.button`
  float: left;
  margin-top: 10px;
  padding: 5px;
  margin-right: 15px;
  font: 18px;
`

const TableScrollDiv = styled.div`
  overflow-x: auto;
  overflow-y: hidden;
  transform: rotateX(180deg);
`
const TableScrollable = styled(Table)`
  transform: rotateX(180deg);
`
