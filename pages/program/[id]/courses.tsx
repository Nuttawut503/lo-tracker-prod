import { GetStaticProps, GetStaticPaths } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useState, createContext, useContext } from 'react'
import { gql } from '@apollo/client'
import { ParsedUrlQuery } from 'querystring'

import { ProgramStaticPaths } from 'libs/staticpaths'
import { initializeApollo, addApolloState } from 'libs/apollo-client'
import { ProgramMainMenu, ProgramSubMenu } from 'components/Menu'
import { AuthContext } from 'components/auth-wrapper'

interface CourseModel {
  id: string
  name: string
  description: string
  semester: number
  year: number
  ploGroupID: string
  teacherID: string
}

const FilterContext = createContext<{filter: string, changeFilter: (string) => any, mine: boolean, setMine: (boolean) => any}>({filter: '', changeFilter: (s) => {}, mine: false, setMine: (v) => {}})

export default function Page({programID, courses}: {programID: string, courses: CourseModel[]}) {
  const { isSignedIn, roleLevel } = useContext(AuthContext)
  const [filter, setFilter] = useState<string>('')
  const [mine, setMine] = useState<boolean>(false)
  return <FilterContext.Provider value={{filter, changeFilter: payload => setFilter(payload), mine, setMine}}>
    <Head>
      <title>Courses</title>
    </Head>
    <ProgramMainMenu programID={programID} />
    <ProgramSubMenu programID={programID} selected={'courses'}/>
    <div className="flex justify-between items-end mt-4 mb-3">
      <FilterTextField/>
      {isSignedIn && (roleLevel === 1 || roleLevel === 3)?<Link href={`/program/${programID}/create-course`} passHref><button className="bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded text-sm">
        Create a new course <span className="text-xl text-green-800">+</span>
      </button></Link>:<p></p>}
    </div>
    <FilterOwner/>
    <Courses courses={courses}/>
  </FilterContext.Provider>
}

function FilterTextField() {
  const { changeFilter } = useContext(FilterContext)
  return <input type="text" onChange={e => changeFilter(e.target.value || '')} placeholder="search for a course" className="border-4 rounded-md p-1 mx-2 text-sm"/>
}

function FilterOwner() {
  const {mine, setMine} = useContext(FilterContext)
  return <div onClick={() => setMine(!mine)} className="cursor-pointer">
    <input type="checkbox" checked={mine} className="border-4 rounded-md mr-2"/>
    <span>Show only my courses</span>
  </div>
}

function Courses({courses}: {courses: CourseModel[]}) {
  const { filter, mine } = useContext(FilterContext)
  const { isSameUserID } = useContext(AuthContext)
  let courseGroups = new Map<string, CourseModel[]>()
  for (let i = 0; i < courses.length; ++i) {
    if (mine && !isSameUserID(courses[i].teacherID)) continue
    if (courses[i].name.toLowerCase().indexOf(filter.toLowerCase()) === -1) continue
    let groupName: string = `${courses[i].semester},${courses[i].year}`
    courseGroups.set(groupName, [...(courseGroups.get(groupName) || []), {...courses[i]}])
  }
  if (courseGroups.size === 0) return <p className="mt-4">No course available</p>
  return <>{
    Array.from(courseGroups).sort((group1, group2) => {
      let [sem1, year1] = group1[0].split(',').map(val => parseInt(val, 10))
      let [sem2, year2] = group2[0].split(',').map(val => parseInt(val, 10))
      if (year1 === year2) return sem2 - sem1
      return year2 - year1
    }).map((group) => {
      let [semester, year] = group[0].split(',').map(val => parseInt(val, 10))
      let filteredCourses: CourseModel[] = group[1]
      return <CourseSection key={`group-${group[0]}`} courses={filteredCourses} semester={semester} year={year}/>
    })
  }</>
}

function CourseSection({courses, semester, year}: {courses: CourseModel[], semester: number, year: number}) {
  return <div className="my-4">
    <h3 className="text-left mb-2">Semester {semester === 3? 'S': semester}/{year}</h3>
    <ul className="courselist">
      {courses.sort((c1, c2) => {
        if (c1.year !== c2.year) return c2.year - c1.year
        if (c1.semester !== c2.semester) return c2.semester - c1.semester
        return c1.name.localeCompare(c2.name)
      }).map(course => <Course key={course.id} course={course}/>)}
    </ul>
  </div>
}

function Course({course}: {course: CourseModel}) {
  return <li className="bg-white rounded-md shadow-lg p-3">
    <Link href={`/course/${course.id}`}>
      {course.name}
    </Link>
  </li>
}

interface PageParams extends ParsedUrlQuery {
  id: string
}

export const getStaticProps: GetStaticProps<{programID: string, courses: CourseModel[]}> = async (context) => {
  const { id: programID } = context.params as PageParams
  const client = initializeApollo(process.env.SSG_SECRET)
  const { data } = await client.query<{courses: CourseModel[]}, {programID: string}>({
    query: GET_COURSES, variables: { programID }
  })
  return addApolloState(client, {
    props: {
      programID,
      courses: data.courses,
    },
    revalidate: 30,
  })
}

export const getStaticPaths: GetStaticPaths = ProgramStaticPaths

const GET_COURSES = gql`
  query Courses($programID: ID!) {
    courses(programID: $programID) {
      id
      name
      description
      semester
      year
      ploGroupID
      teacherID
}}`
