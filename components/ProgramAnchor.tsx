import Link from 'next/link'
import { gql, useQuery } from '@apollo/client'

interface ProgramModel {
  id: string
  name: string
  description: string
}

export default function ProgramNameLink({programID, href}: {programID: string, href: string}) {
  const {data, loading, error} = useQuery<{program: ProgramModel}, {programID: string}>(gql`
    query ProgramName($programID: ID!) {
      program(programID: $programID) {
        name
  }}`, {variables: {programID}});
  if (loading || error) return (<span>{programID}</span>);
  return (<Link href={href}>
    {data?.program.name}
  </Link>);
};