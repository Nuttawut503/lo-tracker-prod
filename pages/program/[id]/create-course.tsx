import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { gql, useMutation } from '@apollo/client'
import { ParsedUrlQuery } from 'querystring'

import { ProgramStaticPaths } from 'libs/staticpaths'
import { initializeApollo, addApolloState } from 'libs/apollo-client'
import { ProgramMainMenu } from 'components/Menu'
import { AuthContext } from 'components/auth-wrapper'

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

interface CreateCourseResponse {
  id: string
  name: string
  description: string
  semester: number
  year: number
  ploGroupID: string
}

const CREATE_COURSE = gql`
  mutation CreateCourse($programID: ID!, $input: CreateCourseInput!) {
    createCourse(programID: $programID, input: $input) {
      id
      name
      description
      semester
      year
      ploGroupID
}}`

export default function Page({ programID, ploGroups }: { programID: string, ploGroups: PLOGroupModel[] }) {
  const { isSignedIn, roleLevel } = useContext(AuthContext)
  const [createCourse, { loading: submitting }] = useMutation<{ createCourse: CreateCourseResponse }, { programID: string, input: CreateCourseModel }>(CREATE_COURSE)
  const { register, handleSubmit, reset, formState: { errors, touchedFields } } = useForm<CreateCourseModel>()
  const router = useRouter()
  const submitForm = (form: CreateCourseModel) => {
    if (form.name !== '' && form.ploGroupID !== '') {
      createCourse({
        variables: {
          programID,
          input: form
        }
      }).then((res) => res.data.createCourse).then((course) => {
        reset({ name: '' })
        router.push(`/course/${course.id}`)
      })
    }
  }
  useEffect(() => {
    if (!isSignedIn) return
    if (roleLevel !== 1 && roleLevel !== 3) router.replace(`/program/${programID}/courses`)
  }, [isSignedIn, programID, roleLevel, router])
  return <div>
    <Head>
      <title>Create a course</title>
    </Head>
    <ProgramMainMenu programID={programID} />
    <div className="flex flex-col items-center gap-y-3">
      <p className="text-lg">Create a new course</p>
      <form className="bg-white shadow-md rounded-md p-3" onSubmit={handleSubmit((form) => submitting || status === 'loading' ? null : submitForm(form))}>
        <span>Course name:</span>
        <br />
        <input {...register('name', { required: true })} className="border-4 rounded-md p-1 mx-2 text-sm" />
        <br />
        <span className="text-red-500 text-sm italic pl-3">{touchedFields.name && errors.name && 'Course name is required.'}</span><br />

        <span>Course description:</span>
        <br />
        <textarea {...register('description')} placeholder="program's description" cols={30} className="border-4 rounded-md p-1 mx-2" rows={4}></textarea>
        <br />

        <span>Semester:</span>
        <br />
        <select {...register('semester')} className="border-4 rounded-md p-1 mx-2 text-sm">
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>S</option>
        </select>
        <br />

        <span>Year:</span>
        <br />
        <select {...register('year')} className="border-4 rounded-md p-1 mx-2 text-sm">
          {Array.from({ length: 10 }, (_, i) => 2021 - i).map((year) => (
            <option value={year} key={`year-${year}`}>
              {year}
            </option>
          ))}
        </select>
        <br />

        <span>PLO Group:</span>
        <br />
        <select {...register('ploGroupID')} className="border-4 rounded-md p-1 mx-2 text-sm" defaultValue="">
          <option disabled value="">--Select PLO Group--</option>
          {[...ploGroups].sort((p1, p2) => p1.name.localeCompare(p2.name)).map((plo) => (
            <option value={plo.id} key={plo.id}>
              {plo.name}
            </option>
          ))}
        </select>
        <br />
        <div className="text-right mt-3">
          <input type="submit" value="create" className="py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg" />
        </div>
      </form>
    </div>
  </div>
}

interface Params extends ParsedUrlQuery {
  id: string
}

export const getStaticProps: GetStaticProps<{ programID: string, ploGroups: PLOGroupModel[] }> = async (context) => {
  try {
    const GET_PLOGROUPS = gql`
    query PLOGroups($programID: ID!) {
      ploGroups(programID: $programID) {
        id
        name
  }}`
    const { id: programID } = context.params as Params
    const client = initializeApollo(process.env.SSG_SECRET)
    const { data } = await client.query<{ ploGroups: PLOGroupModel[] }, { programID: string }>({
      query: GET_PLOGROUPS,
      variables: { programID }
    })
    return {
      props: {
        programID,
        ploGroups: data.ploGroups
      },
      revalidate: 10,
    }
  } catch {
    return {
      props: {
        programID: undefined,
        ploGroups: []
      },
      revalidate: 5,
    }
  }

}

export const getStaticPaths: GetStaticPaths = ProgramStaticPaths
