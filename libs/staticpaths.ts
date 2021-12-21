import { GetStaticPaths } from 'next'
import { gql } from '@apollo/client'

import { initializeApollo } from './apollo-client'

interface CourseModel {
  id: string
  name: string
  description: string
  semester: number
  year: number
  ploGroupID: string
}

export const CourseStaticPaths: GetStaticPaths = async (context) => {
  try {
    const GET_COURSES = gql`
    query Courses($programID: ID!) {
      courses(programID: $programID) {
        id
        name
        description
        semester
        year
        ploGroupID
  }}`
    const client = initializeApollo(process.env.SSG_SECRET)
    const { data } = await client.query<{ courses: CourseModel[] }, { programID: string }>({
      query: GET_COURSES,
      variables: { programID: '' }
    })
    return {
      paths: data.courses.map((course) => ({
        params: { id: course.id }
      })),
      fallback: 'blocking',
    }
  } catch (error) {
    return {
      paths: [],
      fallback: 'blocking'
    }
  }

}

interface ProgramModel {
  id: string
  name: string
  description: string
}

export const ProgramStaticPaths: GetStaticPaths = async (context) => {
  try {
    const GET_PROGRAMS = gql`
    query Programs {
      programs {
        id
        name
        description
  }}`
    const client = initializeApollo(process.env.SSG_SECRET)
    const { data } = await client.query<{ programs: ProgramModel[] }>({
      query: GET_PROGRAMS
    })
    return {
      paths: data.programs.map((program) => ({
        params: { id: program.id }
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
