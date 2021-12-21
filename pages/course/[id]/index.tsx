import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { gql } from '@apollo/client'
import { ParsedUrlQuery } from 'querystring'

import { initializeApollo, addApolloState } from 'libs/apollo-client'
import { CourseStaticPaths } from 'libs/staticpaths'
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

export default function Page({ course }: { course: CourseModel }) {
  return <div>
    <Head>
      <title>Course Home</title>
    </Head>
    <KnownCourseMainMenu programID={course.programID} courseID={course.id} courseName={course.name} />
    <CourseSubMenu courseID={course.id} selected={'main'} />
    <p className="bg-white rounded-md p-3 mt-5">
      <span className="text-2xl">Course Description</span><br />
      <span>{course.description}</span>
    </p>
  </div>
}

interface Params extends ParsedUrlQuery {
  id: string
}

export const getStaticProps: GetStaticProps<{ course: CourseModel }> = async (context) => {
  try {
    const { id: courseID } = context.params as Params
    const GET_COURSE = gql`
    query CourseDescription($courseID: ID!) {
      course(courseID: $courseID) {
        id
        name
        description
        programID
  }}`
    const client = initializeApollo(process.env.SSG_SECRET)
    const { data } = await client.query<{ course: CourseModel }, { courseID: string }>({
      query: GET_COURSE,
      variables: {
        courseID
      }
    })
    return {
      props: {
        course: data.course
      },
      revalidate: false,
    }
  } catch {
    return {
      props: {
        course: null
      },
      revalidate: false,
    }
  }

}

export const getStaticPaths: GetStaticPaths = CourseStaticPaths
