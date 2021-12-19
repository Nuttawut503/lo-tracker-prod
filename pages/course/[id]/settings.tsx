import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useContext } from 'react'
import { getSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { gql, useMutation } from '@apollo/client'
import { ParsedUrlQuery } from 'querystring'

import { initializeApollo, addApolloState } from 'libs/apollo-client'
import { CourseSubMenu, KnownCourseMainMenu } from 'components/Menu'
import { AuthContext } from 'components/auth-wrapper'

interface CourseModel {
  id: string
  name: string
  description: string
  semester: number
  year: number
  ploGroupID: string
  programID: string
  teacherID: string
}

interface PLOGroupModel {
  id: string
  name: string
}

interface CreateCourseModel {
  name: string
  description: string
  semester: number
  year: number
  ploGroupID: string
}

export default function Page({course, ploGroups}: {course: CourseModel, ploGroups: PLOGroupModel[]}) {
  const router = useRouter()
  const {isSignedIn, isSameUserID} = useContext(AuthContext)
  const { register, handleSubmit } = useForm<CreateCourseModel>({
    defaultValues: {
      name: course.name,
      description: course.description,
      semester: course.semester,
      year: course.year,
      ploGroupID: course.ploGroupID,
    }
  })
  const [editCourse, { loading: editing }] = useMutation<{editCourse: {id: string}}, {id: string, input: CreateCourseModel}>(EDIT_COURSE)
  const [deleteCourse, { loading: deleting }] = useMutation<{deleteCourse: {id: string}}, {id: string}>(DELETE_COURSE)
  const saveCourse = (form: CreateCourseModel) => {
    if (editing) return
    editCourse({
      variables: {
        id: course.id,
        input: form,
      }
    }).then(() => {
      alert('updated')
      router.replace(router.asPath)
    })
  }
  const removeCourse = () => {
    if (!confirm('Are you sure?') || deleting) return
    deleteCourse({
      variables: { id: course.id }
    }).then(() => {
      alert('deleted')
      router.push(`/program/${course.programID}/courses`)
    })
  }
  useEffect(() => {
    if (isSignedIn && !isSameUserID(course.teacherID)) router.replace(`/course/${course.id}`)
  }, [isSignedIn, course.id, course.teacherID, isSameUserID, router])
  return <div>
    <Head>
      <title>Course Settings</title>
    </Head>
    <KnownCourseMainMenu programID={course.programID} courseID={course.id} courseName={course.name}/>
    <CourseSubMenu courseID={course.id} selected={'settings'}/>
    <div className="mt-2 bg-white rounded-md p-3">
    <p className="text-lg mt-4 mb-2 underline">Course Settings</p>
    <form onSubmit={handleSubmit(saveCourse)}>
    <div className="grid grid-cols-2 gap-4">
      <div>Name</div>
      <input {...register('name')} placeholder="program's name" className="border-4 rounded-md p-1 text-sm"/>
      <div>Description</div>
      <textarea {...register('description')} placeholder="program's description" cols={30} className="border-4 rounded-md p-2" rows={4}></textarea>
      <div>Semester</div>
      <select {...register('semester')} className="border-4 rounded-md p-1 mx-2 text-sm">
        <option value={1}>1</option>
        <option value={2}>2</option>
        <option value={3}>S</option>
      </select>
      <div>Year</div>
      <select {...register('year')} className="border-4 rounded-md p-1 mx-2 text-sm">
        {Array.from({ length: 10 }, (_, i) => 2021 - i).map((year) => (
          <option value={year} key={`year-${year}`}>
            {year}
          </option>
        ))}
      </select>
      <div>PLO Group</div>
      <select {...register('ploGroupID')} className="border-4 rounded-md p-1 mx-2 text-sm">
        <option disabled value="">--Select PLO Group--</option>
        {[...ploGroups].sort((p1, p2) => p1.name.localeCompare(p2.name)).map((plo) => (
          <option value={plo.id} key={plo.id}>
            {plo.name}
          </option>
        ))}
      </select>
    </div>
    <div className="flex justify-end">
      <input type="submit" value="save" className="mt-3 py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg"/>
    </div>
    </form>
    <p className="cursor-pointer text-red-400" onClick={removeCourse}>Delete this course</p>
    </div>
  </div>
}

interface Params extends ParsedUrlQuery {
  id: string
}

export const getServerSideProps: GetServerSideProps<{course: CourseModel, ploGroups: PLOGroupModel[]}> = async (context) => {
  const { id: courseID } = context.params as Params
  const session = await getSession(context)
  if (!session) {
    return {
      notFound: true
    }
  }
  const client = initializeApollo(session.user.accessToken)
  const {data: fetchCourse} = await client.query<{course: CourseModel}, {courseID: string}>({
    query: GET_COURSE,
    variables: {
      courseID
    }
  })
  const {data: fetchPLOGroups} = await client.query<{ploGroups: PLOGroupModel[]}, {programID: string}>({
    query: GET_PLOGROUPS,
    variables: {
      programID: fetchCourse.course.programID
    }
  })
  return addApolloState(client, {
    props: {
      course: fetchCourse.course,
      ploGroups: fetchPLOGroups.ploGroups
    }
  })
}

const GET_COURSE = gql`
  query CourseDetail($courseID: ID!) {
    course(courseID: $courseID) {
      id
      name
      description
      semester
      year
      ploGroupID
      programID
      teacherID
}}`
const GET_PLOGROUPS = gql`
  query PLOGroups($programID: ID!) {
    ploGroups(programID: $programID) {
      id
      name
}}`
const EDIT_COURSE = gql`
  mutation EditCourse($id: ID!, $input: CreateCourseInput!) {
    editCourse(id: $id, input: $input) {
      id
}}`
const DELETE_COURSE = gql`
  mutation DeleteCourse($id: ID!) {
    deleteCourse(id: $id) {
      id
}}`

