import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { gql, useQuery } from '@apollo/client'
import styled from 'styled-components'
import { ParsedUrlQuery } from 'querystring'

import { getStudentProp, getDashboardResultProp, CustomStudent, DashboardResult, GQLPLOSummaryResponse, GQLFlatResponse, getDashboardFlatRawProp, getDashboardPLOSummaryRawProp, parseDashboardFlat, parseDashboardPLOSummary } from 'libs/dashboard-helper'
import { CourseStaticPaths } from 'libs/staticpaths'
import { initializeApollo, addApolloState } from 'libs/apollo-client'
import { ScoreTable, ScoreTablePLO } from 'components/dashboards/table'
import { CourseSubMenu, KnownCourseMainMenu } from 'components/Menu'
import ProgramNameLink from 'components/ProgramAnchor'

// path => /course/[id]/dashboards
export default function Page({course, students, rawDashboardFlat, dashboardResults, rawDashboardPLOSummary}: PageProps) {
  const router = useRouter()
  const courseID = router.query.id as string
  const [state, setState] = useState<'Quiz' | 'Outcome'>('Quiz')
  return <div>
    <Head>
      <title>Dashboard</title>
    </Head>
    <div>
      <KnownCourseMainMenu programID={course.programID} courseID={course.id} courseName={course.name}/>
      {/* <NavHistory courseID = {courseID}/> */}
      <CourseSubMenu courseID={course.id} selected={'dashboards'}/>
      <div className="bg-white rounded-md p-3 w-100 shadow-md overflow-x-auto">
      <ButtonTab>
        <button onClick={() => setState("Quiz")} style={{marginRight: 5}}
        className="border border-blue-500 rounded-md border-2">
          {state === "Quiz" && <b>Quiz Score</b> || <span>Quiz Score</span>}
        </button>
        <button onClick={() => setState("Outcome")}
        className="border border-blue-500 rounded-md border-2">
          {state === "Outcome" && <b>Outcome Score</b> || <span>Outcome Score</span>}
        </button>
      </ButtonTab>
      {state === "Quiz" && <ScoreTable courseID={course.id} students={students} dashboardResults={dashboardResults}/>}
      {state === "Outcome" && <ScoreTablePLO courseID={course.id} dashboardFlat={parseDashboardFlat(rawDashboardFlat)} dashboardPLOSummary={parseDashboardPLOSummary(rawDashboardPLOSummary)}/>}
      </div>
    </div>
  </div>
}

// supply
interface CourseModel {
  id: string
  name: string
  programID: string
}

function NavHistory({courseID}: {courseID: string}) {
  const {data, loading} = useQuery<{course: CourseModel}, {courseID: string}>(gql`
    query Course($courseID: ID!) {
      course(courseID: $courseID) {
        id
        name
        programID
    }}
  `, {variables: {courseID}})
  if (loading) return <p></p>
  return (<p>
    <Link href="/">Home</Link>
    {' '}&#12297;{' '}
    <Link href="/programs">Programs</Link>
    {' '}&#12297;{' '}
    <ProgramNameLink programID={data.course.programID} href={`/program/${data.course.programID}/courses`}/>
    {' '}&#12297;{' '}
    <Link href={`/course/${data.course.id}`}>{data.course.name}</Link>
    
  </p>)
}

const ButtonTab = styled.div`
  display: inline-block;
`

interface Params extends ParsedUrlQuery {
  id: string
}

interface PageProps {
  course: CourseModel
  students: CustomStudent[]
  rawDashboardFlat: GQLFlatResponse
  dashboardResults: DashboardResult[]
  rawDashboardPLOSummary: GQLPLOSummaryResponse[]
}

export const getStaticProps: GetStaticProps<PageProps> = async (context) => {
  const { id: courseID } = context.params as Params
  const client = initializeApollo(process.env.SSG_SECRET);
  const GET_COURSE = gql`
    query CourseDescription($courseID: ID!) {
      course(courseID: $courseID) {
        id
        name
        programID
  }}`
  const data = await Promise.all([
    client.query<{course: CourseModel}, {courseID: string}>({
      query: GET_COURSE,
      variables: {
        courseID
      }
    }),
    getStudentProp(client, courseID),
    getDashboardFlatRawProp(client, courseID),
    getDashboardResultProp(client, courseID),
    getDashboardPLOSummaryRawProp(client, courseID),
  ])
  return addApolloState(client, {
    props: {
      course: data[0].data.course,
      students: data[1].result,
      rawDashboardFlat: data[2].result,
      dashboardResults: data[3].result,
      rawDashboardPLOSummary: data[4].result,
    },
    revalidate: 60,
  })
}

export const getStaticPaths: GetStaticPaths = CourseStaticPaths