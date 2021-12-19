import Link from 'next/link'
import { gql, useQuery } from '@apollo/client'

interface CourseModel {
  id: string
  name: string
  description: string
  semester: number
  year: number
  ploGroupID: string
}

export default function CourseNameLink({courseID, href}: {courseID: string, href: string}) {
  const {data, loading, error} = useQuery<{course: CourseModel}, {courseID: string}>(gql`
    query CourseName($courseID: ID!) {
      course(courseID: $courseID) {
        name
  }}`, {variables: {courseID}})
  if (loading || error) return (<span>{courseID}</span>);
  return (<Link href={href}>
    {data?.course.name}
  </Link>)
}