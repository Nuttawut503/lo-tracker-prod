import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useStudent } from 'libs/dashboard-helper'
import { initializeApollo, addApolloState } from 'libs/apollo-client'
import { IndividualPLO, IndividualQuiz } from 'components/dashboards/stdtable'

// path => /course/[id]/dashboards/[studentID]
export default function Page() {
  return (<div className="bg-white shadow-md rounded-md p-2">
    <Head>
      <title>Dashboard</title>
    </Head>
    <IndexPage/>
  </div>)
}
interface student {
  id: string
  email: string
  fullname: string
}
function IndexPage() {
  const router = useRouter()
  const courseID = router.query.id as string
  const studentID = router.query.studentID as string 
  const [state, setState] = useState("Quiz")
  const [students, loaded] = useStudent(courseID)
  const [student, setStudent] = useState<student>({id: "00000", fullname: "Loading", email:"Loading"})
  useEffect(() => {
    if(students.length > 0){
      setStudent(students.find(e => e.id === studentID))
      if (students.find(e => e.id === studentID) === undefined) {
        setStudent({ id: "-----", fullname: "Student not found!", email: "Student not found!" })
      }
    }
  }, [students, studentID])
  
  return <div>
    {/* <NavHistory courseID={courseID} studentID={studentID}/> */}
    <h4 style={{fontSize: 20}}>Individual Student Dashboard</h4>
    <MainDiv>
      <BackButton onClick={() => router.push(`/course/${courseID}/dashboards`)} className="text-xl">
        &#12296;Back
      </BackButton>
      <h6>Student ID: {student.id}</h6>
      <h6>Email: {student.email}</h6>
      <h6>Name: {student.fullname}</h6>
      <DashboardDiv>
        {student.id !== "-----" && <div>
          <ButtonTab>
            <button onClick={() => setState("Quiz")} style={{ marginRight: 5 }}
            className="border border-blue-500 rounded-md border-2">
              {state === "Quiz" && <b>Quiz Score</b> || <span>Quiz Score</span>}
            </button>
            <button onClick={() => setState("Outcome")} style={{ marginRight: 5 }}
            className="border border-blue-500 rounded-md border-2">
              {state === "Outcome" && <b>Outcome Score</b> || <span>Outcome Score</span>}
            </button>          
          </ButtonTab>
        </div>}
        {student.id !== "-----" && <div>
          {state === "Quiz" && <IndividualQuiz studentID={studentID}/>}
          {state === "Outcome" && <IndividualPLO studentID={studentID}/>}
        </div>}
      </DashboardDiv>
    </MainDiv>
    
  </div>
}

const MainDiv = styled.div`
  margin: 1.5%;
  text-align: start;
`

const BackButton = styled.button`
  float: left;
  margin-top: 20px;
  padding: 5px;
  margin-right: 15px;
`

const DashboardDiv = styled.div`
    text-align: left;
    margin-left : 1%;
    margin-right: 1%;
`
  
const ButtonTab = styled.div`
    display: inline-block;
`