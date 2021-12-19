import Link from 'next/link'
import { useEffect } from 'react'
import { gql, useQuery } from '@apollo/client'

interface ProgramModel {
  id: string
  name: string
  description: string
  teacherID: string
}

export function ProgramNameLink({programID, href, callback}: {programID: string, href: string, callback?: (p: ProgramModel) => any}) {
  const {data, loading} = useQuery<{program: ProgramModel}, {programID: string}>(
  gql`
    query ProgramName($programID: ID!) {
      program(programID: $programID) {
        name
        teacherID
  }}`, {variables: {programID}})
  useEffect(() => {
    if (!programID) return
    if (!loading && !!data) callback && callback(data.program)
  }, [programID, loading, callback, data])
  return <Link href={href}>
    {loading || !data?'':data.program.name}
  </Link>
}

interface CourseModel {
  id: string
  name: string
  description: string
  semester: number
  year: number
  ploGroupID: string
}

export function CourseNameLink({courseID, href}: {courseID: string, href: string}) {
  const {data, loading} = useQuery<{course: CourseModel}, {courseID: string}>(
    gql`
      query CourseName($courseID: ID!) {
        course(courseID: $courseID) {
          name
  }}`, {variables: {courseID}})
  return <Link href={href}>
    {loading || data?.course.name}
  </Link>
};
