import { useState, useEffect } from 'react'
import { ApolloClient, ApolloError, gql, NormalizedCacheObject, useQuery } from '@apollo/client'

// ================================================================================================
const GET_STUDENTS_IN_COURSE = gql`
  query StudentsInCourse($courseID: ID!) {
    studentsInCourse(courseID: $courseID) {
      id
      email
      name
      surname
}}`
interface Student {
  id: string
  email: string
  name: string
  surname: string
}
export interface CustomStudent {
  id: string
  email: string
  fullname: string
}

export function useStudent(courseID: string): [CustomStudent[], boolean] {
  const [students, setStudents] = useState<CustomStudent[]>([])
  const [loaded, setLoaded] = useState<boolean>(false)
  if (courseID === '') return
  const {data, loading} = useQuery<{studentsInCourse: Student[]}, {courseID: string}>(GET_STUDENTS_IN_COURSE, {variables: {courseID}})
  useEffect(() => {
    if (loading && !data) return
    let arr: CustomStudent[] = []
    data?.studentsInCourse.forEach((val) => {
      arr.push({
        id: val.id,
        email: val.email,
        fullname: `${val.name} ${val.surname}`
      })
    })
    setStudents(arr)
    setLoaded(true)
  }, [loading])
  return [students, loaded]
}

export async function getStudentProp(client: ApolloClient<NormalizedCacheObject>, courseID: string) {
  const {data, error} = await client.query<{studentsInCourse: Student[]}, {courseID: string}>({
    query: GET_STUDENTS_IN_COURSE,
    variables: {courseID}
  })
  let arr: CustomStudent[] = []
  if (!!error) return {result: arr, error}
  data?.studentsInCourse.forEach((val) => {
    arr.push({
      id: val.id,
      email: val.email,
      fullname: `${val.name} ${val.surname}`
    })
  })
  return {result: arr, error: null}
}
// ================================================================================================

const GET_DASHBOARD_FLAT = gql`
  query FlatSummary($courseID: ID!) {
    flatSummary(courseID: $courseID) {
      students {
        id
        name
        surname
      }
      plos {
        id
        title
        description
      }
      los {
        id
        title
        levels {
          level
          description
        }
      }
      questions {
        title
        maxScore
        linkedPLOs
        linkedLOs
        results {
          studentID
          studentScore
        }
      }
}}`
export interface GQLFlatResponse {
  students: {
    id: string
    name: string
    surname: string
  }[]
  plos: {
    id: string
    title: string
    description: string
  }[]
  los: {
    id: string
    title: string
    levels: {
      level: number
      description: string
    }[]
  }[]
  questions: DashboardFlatQuestion[]
}
interface DashboardFlatQuestion {
  title: string
  maxScore: number
  linkedPLOs: string[]
  linkedLOs: string[]
  results: {
    studentID: string
    studentScore: number
  }[]
}
export interface DashboardFlat {
  students: Map<string, string> // key: studentID, val: studentName
  plos: Map<string, string> // key: ploID, val: name
  los: Map<string, string> // key: loID | "loID,loLevel", val: title | levelDescription
  questions: DashboardFlatQuestion[] // all questions in a course
}
const emptyDashboardFlat: DashboardFlat = {
  students: new Map<string, string>(),
  plos: new Map<string, string>(),
  los: new Map<string, string>(),
  questions: []
}

export function useDashboardFlat(courseID: string): [DashboardFlat, boolean] {
  const [dashboard, setDashboard] = useState<DashboardFlat>(emptyDashboardFlat)
  const [loaded, setLoaded] = useState<boolean>(false)
  if (courseID === '') return
  const {data, loading } = useQuery<{flatSummary: GQLFlatResponse}, {courseID: string}>(GET_DASHBOARD_FLAT, {variables: {courseID}})
  useEffect(() => {
    if (loading && !data) return
    let newDashboard: DashboardFlat = {
      students: new Map<string, string>(),
      plos: new Map<string, string>(),
      los: new Map<string, string>(),
      questions: []
    }
    data?.flatSummary.students.forEach(student => newDashboard.students.set(student.id, `${student.name} ${student.surname}`))
    data?.flatSummary.plos.forEach(plo => newDashboard.plos.set(plo.id, plo.title))
    data?.flatSummary.los.forEach(lo => {
      newDashboard.los.set(lo.id, lo.title)
      lo.levels.forEach(loLevel => newDashboard.los.set(`${lo.id},${loLevel.level}`, loLevel.description))
    })
    newDashboard.questions = data?.flatSummary.questions
    setDashboard(newDashboard)
    setLoaded(true)
  }, [loading])
  return [dashboard, loaded]
}
export async function getDashboardFlatRawProp(client: ApolloClient<NormalizedCacheObject>, courseID: string): Promise<{result: GQLFlatResponse, error: ApolloError}> {
  const {data, error} = await client.query<{flatSummary: GQLFlatResponse}, {courseID: string}>({
    query: GET_DASHBOARD_FLAT,
    variables: {courseID}
  })
  return {result: data?.flatSummary, error}
}
export function parseDashboardFlat(data: GQLFlatResponse) {
  let newDashboard: DashboardFlat = {
    students: new Map<string, string>(),
    plos: new Map<string, string>(),
    los: new Map<string, string>(),
    questions: []
  }
  data?.students.forEach(student => newDashboard.students.set(student.id, `${student.name} ${student.surname}`))
  data?.plos.forEach(plo => newDashboard.plos.set(plo.id, plo.title))
  data?.los.forEach(lo => {
    newDashboard.los.set(lo.id, lo.title)
    lo.levels.forEach(loLevel => newDashboard.los.set(`${lo.id},${loLevel.level}`, loLevel.description))
  })
  newDashboard.questions = data?.questions
  return newDashboard
}
// ================================================================================================

const GET_DASHBOARD_RESULT = gql`
  query QuizResults($courseID: ID!) {
    quizResults(courseID: $courseID) {
      quizName
      maxScore
      results {
        studentID
        studentName
        studentScore
      }
}}`
export interface DashboardResult {
  quizName: string
  maxScore: number // sum of every question's maxscore in that quiz
  results: {
    studentID: string
    studentName: string
    studentScore: number // score of a student in that quiz (sum of score in every questions)
  }[]
}

export function useDashboardResult(courseID: string): [DashboardResult[], boolean] {
  const [dashboard, setDashboard] = useState<DashboardResult[]>([])
  const [loaded, setLoaded] = useState<boolean>(false)
  if (courseID === '') return
  const {data, loading} = useQuery<{quizResults: DashboardResult[]}, {courseID: string}>(GET_DASHBOARD_RESULT, {variables: {courseID}})
  useEffect(() => {
    if (loading && !data) return
    setDashboard(data?.quizResults)
    setLoaded(true)
  }, [loading])
  return [dashboard, loaded]
}
export async function getDashboardResultProp(client: ApolloClient<NormalizedCacheObject>, courseID: string) {
  const {data, error} = await client.query<{quizResults: DashboardResult[]}, {courseID: string}>({
    query: GET_DASHBOARD_RESULT,
    variables: {courseID}
  })
  let newDashboard: DashboardResult[] = []
  if (!!error) return {result: newDashboard, error}
  newDashboard = data.quizResults
  return {result: newDashboard, error: null}
}
// ================================================================================================

const GET_DASHBOARD_PLOSUMMARY = gql`
  query PLOSummary($courseID: ID!) {
    ploSummary(courseID: $courseID) {
      ploID
      loID
}}`
export type DashboardPLOSummary = Map<string, string[]> // key: ploID, val: a set of linked LOs to that PLO
export interface GQLPLOSummaryResponse {
  ploID: string
  loID: string[]
}

export function useDashboardPLOSummary(courseID: string): [DashboardPLOSummary, boolean] {
  const [dashboard, setDashboard] = useState<DashboardPLOSummary>(new Map<string, string[]>())
  const [loaded, setLoaded] = useState<boolean>(false)
  if (courseID === '') return
  const {data, loading} = useQuery<{ploSummary: GQLPLOSummaryResponse[]}, {courseID: string}>(GET_DASHBOARD_PLOSUMMARY, {variables: {courseID}})
  useEffect(() => {
    if (loading && !data) return
    let plos = new Map<string, string[]>()
    data?.ploSummary.forEach((v) => {
      plos.set(v.ploID, v.loID)
    })
    setDashboard(new Map(plos.entries()))
    setLoaded(true)
  }, [loading])
  return [dashboard, loaded]
}
export async function getDashboardPLOSummaryRawProp(client: ApolloClient<NormalizedCacheObject>, courseID: string): Promise<{result: GQLPLOSummaryResponse[], error: ApolloError}> {
  const {data, error} = await client.query<{ploSummary: GQLPLOSummaryResponse[]}, {courseID: string}>({
    query: GET_DASHBOARD_PLOSUMMARY,
    variables: {courseID}
  })
  return {result: data?.ploSummary, error}
}
export function parseDashboardPLOSummary(data: GQLPLOSummaryResponse[]) {
  let newDashboard: DashboardPLOSummary = new Map<string, string[]>()
  let plos = new Map<string, string[]>()
  data?.forEach((v) => {
    plos.set(v.ploID, v.loID)
  })
  newDashboard = new Map(plos.entries())
  return newDashboard
}
