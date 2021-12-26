import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { gql } from '@apollo/client'
import { ParsedUrlQuery } from 'querystring'

import { CourseStaticPaths } from 'libs/staticpaths'
import { initializeApollo, addApolloState } from 'libs/apollo-client'
import { CourseSubMenu, KnownCourseMainMenu } from 'components/Menu'

interface CourseModel {
  id: string
  name: string
  description: string
  semester: number
  year: number
  ploGroupID: string
  programID: string
}

interface StudentModel {
  id: string
  email: string
  name: string
  surname: string
}

export default function Page({course, students}: {course: CourseModel, students: StudentModel[]}) {
  return (<div>
    <Head>
      <title>Students in the course</title>
    </Head>
    <KnownCourseMainMenu programID={course.programID} courseID={course.id} courseName={course.name}/>
    <CourseSubMenu courseID={course.id} selected={'students'}/>
    <div className="mt-5 p-3 bg-white rounded-md inline-block">
    <p className="text-lg mb-3">List of students in this course</p>
    <table className="table-auto mt-4">
      <thead>
        <tr className="bg-gray-100">
          <td className="text-center">Student ID</td>
          <td>Student Email</td>
          <td>Student Name</td>
          <td>Student Surname</td>
        </tr>
      </thead>
      <tbody>
        {students.length === 0 && <tr><td className="text-center">---</td><td>No Data</td><td>---</td><td>---</td></tr>}
        {
          [...students].sort((s1, s2) => s1.id.localeCompare(s2.id)).map((student) => (
            <tr key={student.id}>
              <td className="text-center pr-3">{student.id}</td>
              <td>{student.email}</td>
              <td>{student.name}</td>
              <td>{student.surname}</td>
            </tr>
          ))
        }
      </tbody>
    </table>
    </div>
  </div>)
}

interface Params extends ParsedUrlQuery {
  id: string
}

export const getStaticProps: GetStaticProps<{course: CourseModel, students: StudentModel[]}> = async (context) => {
  try {
    const { id: courseID } = context.params as Params
  const GET_COURSE = gql`
    query CourseDescription($courseID: ID!) {
      course(courseID: $courseID) {
        id
        name
        programID
  }}`
  const client = initializeApollo(process.env.SSG_SECRET)
  const {data: {course}} = await client.query<{course: CourseModel}, {courseID: string}>({
    query: GET_COURSE,
    variables: {
      courseID
    }
  })
  const GET_STUDENTS_IN_COURSE = gql`
    query StudentsInCourse($courseID: ID!) {
      studentsInCourse(courseID: $courseID) {
        id
        email
        name
        surname
  }}`
  const {data: {studentsInCourse}} = await client.query<{studentsInCourse: StudentModel[]}, {courseID: string}>({
    query: GET_STUDENTS_IN_COURSE,
    variables: {courseID}
  })
  return  {
    props: {
      course,
      students: studentsInCourse
    },
    revalidate: 5,
  }
  }catch{
    return {
      props: {
        course: null,
        students: []
      },
      revalidate: 5,
    }
  }
  
}

export const getStaticPaths: GetStaticPaths = CourseStaticPaths
