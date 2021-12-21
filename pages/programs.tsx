import { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useState, Dispatch, SetStateAction, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from 'react-bootstrap'
import { gql, useMutation } from '@apollo/client'
import xlsx from 'xlsx'

import { initializeApollo } from 'libs/apollo-client'
import { AuthContext } from 'components/auth-wrapper'

interface ProgramModel {
  id: string
  name: string
  description: string
}

export interface CreateProgramModel {
  name: string
  description: string
}

export interface CreateProgramRepsonse {
  id: string
  name: string
  description: string
}

interface StudentExcel {
  id: string
  email: string
  name: string
  surname: string
}


export default function Page({ programs }: { programs: ProgramModel[] }) {
  const { roleLevel } = useContext(AuthContext)
  return <div>
    <Head>
      <title>Program</title>
    </Head>
    <p>
      <Link href="/">Home</Link>
      {' '}&#12297;{' '}
      <span>Programs</span>
    </p>
    <div className="flex flex-row-reverse pt-2 pb-1">
      {roleLevel > 1 && <CreateProgramButton />}
      {roleLevel === 3 && <UploadStudents />}
    </div>
    <Programs programs={[...programs]} />
  </div>
}

function Programs({ programs }: { programs: ProgramModel[] }) {
  return <div>{programs.sort((p1, p2) => p1.name.localeCompare(p2.name)).map(
    (program) => <Program key={program.id} program={program} />
  )}</div>
}

function Program({ program }: { program: ProgramModel }) {
  return <div className="bg-white rounded-md shadow-lg p-3 divide-y-2 mt-3 flex flex-column space-y-2">
    <span className="font-semibold text-2xl">
      <Link href={`/program/${program.id}/courses`}>
        {program.name}
      </Link>
      <span style={{ fontSize: '0.6rem' }}>&#128279;</span>
    </span>
    <div className="text-gray-600">{program.description}</div>
  </div>
}

function CreateProgramButton() {
  const [show, setShow] = useState<boolean>(false)
  return <>
    <button onClick={() => setShow(true)} className="bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded text-sm">
      Create a new program <span className="text-xl text-green-800">+</span>
    </button>
    <CreateProgramModal show={show} setShow={setShow} />
  </>
}

function CreateProgramModal({ show, setShow }: { show: boolean, setShow: Dispatch<SetStateAction<boolean>> }) {
  const router = useRouter()
  const { register, handleSubmit, reset, formState: { errors, touchedFields } } = useForm<CreateProgramModel>()
  const resetForm = () => {
    reset({ name: '', description: '' }); setShow(false)
  }
  const CREATE_PROGRAM = gql`
    mutation CreateProgram($input: CreateProgramInput!) {
      createProgram(input: $input) {
        id
        name
        description
  }}`
  const [createProgram, { loading: submitting }] = useMutation<{ createProgram: CreateProgramRepsonse }, { input: CreateProgramModel }>(CREATE_PROGRAM)
  const submitForm = (form: CreateProgramModel) => createProgram({
    variables: { input: form }
  }).then((res) => {
    resetForm(); router.push(`/program/${res.data.createProgram.id}/courses`)
  })
  return <Modal show={show} onHide={() => resetForm()}>
    <form onSubmit={handleSubmit((form) => submitting ? null : submitForm(form))}>
      <Modal.Header>
        <Modal.Title className="font-bold">Create a new program</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <input type="text" {...register('name', { required: true })} placeholder="type a program name" className="border-4 rounded-md p-2" />
        <br /><span className="text-red-500 text-sm italic">{touchedFields.name && errors.name && 'Program name is required.'}</span>
        <p className="my-3 text-xs"></p>
        <textarea {...register('description')} placeholder="program's description" cols={30} className="border-4 rounded-md p-2" rows={4}></textarea>
      </Modal.Body>
      <Modal.Footer>
        <input type="submit" value="create" className="py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg" />
      </Modal.Footer>
    </form>
  </Modal>
}

const UploadStudents: React.FC = () => {
  const CREATE_STUDENTS = gql`
    mutation CreateStudents($input: [CreateStudentInput!]!) {
      createStudents(input: $input) {
        id
      }
    }
  `
  const [createStudents, { loading: submitting }] = useMutation<{ createStudent: { id: string } }, { input: StudentExcel[] }>(CREATE_STUDENTS)
  const uploadToDB = (students: StudentExcel[]) => {
    createStudents({
      variables: {
        input: students
      }
    }).then(() => {
      setShow(false)
      alert('Students import success')
    }).catch((err) => {
      alert(JSON.stringify(err))
    })
  }
  const excelJSON = (file) => {
    let reader = new FileReader()
    reader.onload = function (e) {
      let data = e.target.result
      let workbook = xlsx.read(data, { type: 'binary' })
      uploadToDB(xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]))
    }
    reader.onerror = console.log
    reader.readAsBinaryString(file)
  }
  const [show, setShow] = useState(false)
  return (<div>

    <button onClick={() => setShow(true)} className="bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded text-sm" style={{ marginRight: 10 }}>
      Upload new students (only available in dev mode) <span className="text-xl text-blue-800">+</span>
    </button>
    <Modal show={show} onHide={() => setShow(false)} dialogClassName="modal-90w">
      <Modal.Header>
        <Modal.Title>Upload new students</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Please upload an excel file that contain &#39;id&#39;, &#39;email&#39;, &#39;name&#39; and &#39;surname&#39; column.</p> <br />
        <input type="file" onChange={e => excelJSON(e.target.files[0])} className="p-1 mx-2 text-sm" /> <br />
        {submitting && <p>Uploading...</p>}
      </Modal.Body>
    </Modal>
  </div>)
}

export const getStaticProps: GetStaticProps<{ programs: ProgramModel[] }> = async (_) => {
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
      props: {
        programs: data.programs,
      },
      revalidate: 60,
    }
  } catch {
    return {
      props: {
        programs: []
      },
      revalidate: 5,
    }
  }

}
