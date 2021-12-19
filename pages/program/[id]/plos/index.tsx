import { GetServerSideProps } from 'next'
import Head from 'next/head'
import router, { useRouter } from 'next/router'
import React, { useState, createContext, useContext, useRef } from 'react'
import { getSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { Modal } from 'react-bootstrap'
import { gql, useMutation, useQuery } from '@apollo/client'
import { ParsedUrlQuery } from 'querystring'
import { toast } from 'react-toastify'
import xlsx from 'xlsx'

import { initializeApollo, addApolloState } from 'libs/apollo-client'
import { ProgramMainMenu, ProgramSubMenu } from 'components/Menu'
import { AuthContext } from 'components/auth-wrapper'

interface CreatePLOGroupResponse {
  id: string
  name: string
}

interface PLOGroupModel {
  id: string
  name: string
}

interface CreatePLOModel {
  title: string
  description: string
}

interface CreatePLOModel {
  title: string
  description: string
}

interface PLOModel {
  id: string
  title: string
  description: string
  ploGroupID: string
}

const PLOContext = createContext<{
  ploGroups: PLOGroupModel[],
  savePLOGroup: (name: string, plos: CreatePLOModel[]) => Promise<any>,
  savePLO: (ploGroupID: string, plo: CreatePLOModel) => Promise<any>,
  modifyPLOGroup: (id: string, name: string) => Promise<any>,
  modifyPLO: (id: string, title: string, description: string) => Promise<any>,
  removePLOGroup: (id: string) => Promise<any>,
  removePLO: (id: string) => Promise<any>,
  appendPLOs: (id: string, plos: CreatePLOModel[]) => Promise<any>,
  submitting: boolean,
  isOwner: boolean,
  }>({
  ploGroups: [],
  savePLOGroup: () => null,
  savePLO: () => null,
  modifyPLOGroup: () => null,
  modifyPLO: () => null,
  removePLOGroup: () => null,
  removePLO: () => null,
  appendPLOs: () => null,
  submitting: false,
  isOwner: false,
})

export default function Page({programID, ploGroups}: {programID: string, ploGroups: PLOGroupModel[]}) {
  const router = useRouter()
  const { isSignedIn, isSameUserID } = useContext(AuthContext)
  const [teacherID, setTeacherID] = useState<string>('')
  const [createPLOGroup, { loading: submitPLOGroup }] = useMutation<{createPLOGroup: CreatePLOGroupResponse}, {programID: string, name: string, input: CreatePLOModel[]}>(CREATE_PLOGROUP)
  const [deletePLOGroup, { loading: withdrawPLOGroup}] = useMutation<{deletePLOGroup: {id: string}}, {id: string}>(DELETE_PLOGROUP)
  const [createPLO, { loading: submitPLO }] = useMutation<{createPLO: PLOModel}, {ploGroupID: string, input: CreatePLOModel}>(CREATE_PLO)
  const [deletePLO, { loading: withdrawPLO}] = useMutation<{deletePLO: {id: string}}, {id: string}>(DELETE_PLO)
  const [editPLOGroup, { loading: writePLOGroup }] = useMutation<{editPLOGroup: {id: string}}, {id: string, name: string}>(EDIT_PLOGROUP)
  const [editPLO, { loading: writePLO }] = useMutation<{editPLO: {id: string}}, {id: string, title: string, description: string}>(EDIT_PLO)
  const [addPLOs, { loading: insertPLOs }] = useMutation<{addPLOs: {id: string}}, {ploGroupID: string, input: CreatePLOModel[]}>(ADD_PLOS)
  const savePLOGroup = (name: string, plos: CreatePLOModel[]) => createPLOGroup({variables: {programID, name, input: plos}}).finally(() => router.replace(router.asPath))
  const savePLO = (ploGroupID: string, plo: CreatePLOModel) => createPLO({variables: {ploGroupID, input: plo}})
  const modifyPLOGroup = (id: string, name: string) => editPLOGroup({variables: {id, name}}).finally(() => router.replace(router.asPath))
  const modifyPLO = (id: string, title: string, description: string) => editPLO({variables: {id, title, description}})
  const removePLOGroup = (id: string) => deletePLOGroup({variables: {id}}).finally(() => router.replace(router.asPath))
  const removePLO = (id: string) => deletePLO({variables: {id}})
  const appendPLOs = (id: string, plos: CreatePLOModel[]) => addPLOs({variables: {ploGroupID: id, input: plos}})
  const isOwner = isSignedIn && isSameUserID(teacherID)
  const submitting = submitPLOGroup || submitPLO || writePLOGroup || writePLO || withdrawPLOGroup || withdrawPLO || insertPLOs
  return <PLOContext.Provider value={{ploGroups, savePLOGroup, savePLO, modifyPLOGroup, modifyPLO, removePLOGroup, removePLO, appendPLOs, submitting, isOwner}}>
    <Head>
      <title>Manage PLOs</title>
    </Head>
    <ProgramMainMenu programID={programID} callback={(program) => setTeacherID(program.teacherID)}/>
    <ProgramSubMenu programID={programID} selected={'plos'} showSetting={isOwner}/>
    <PLOs programID={programID}/>
  </PLOContext.Provider>
}

export function PLOs({programID}: {programID: string}) {
  const { ploGroups, removePLOGroup, isOwner, submitting } = useContext(PLOContext)
  const [selectedPLOGroupID, setSelectedPLOGroupID] = useState<string>('')
  const deletePLOGroup = () => {
    if (submitting || !confirm('Delete this PLO group?')) return
    removePLOGroup(selectedPLOGroupID).then(() => setSelectedPLOGroupID(''))
  }
  return <div>
    {isOwner && <CreatePLOGroupForm />}
    <div className="grid grid-cols-2 gap-x gap-x-6 mt-2">
      <div className="flex flex-column space-y-2">
        {[...ploGroups].sort((p1, p2) => p1.name.localeCompare(p2.name)).map((ploGroup) => (
          <div key={ploGroup.id} className="bg-white rounded-md shadow-lg p-3">
            <div className="flex justify-between items-center">
              <span className="font-bold">{ploGroup.name}</span>
            </div>
            <span className={`hover:underline cursor-pointer py-1 px-1 rounded 
              ${ploGroup.id === selectedPLOGroupID?'bg-red-200':'bg-blue-200'} 
              ${ploGroup.id === selectedPLOGroupID?'text-red-700':'text-blue-500'}`} 
              onClick={() => setSelectedPLOGroupID(ploGroup.id)}>Inspect
            </span>
            <span className="ml-2 hover:underline py-1 px-1 rounded bg-blue-200 cursor-pointer text-blue-500 " 
              onClick={() => router.push({pathname: '/program/[id]/plos/[ploGroupID]', query: {id: programID, ploGroupID: ploGroup.id}})}>
              Go to Dashboard
            </span>
          </div>
        ))}
      </div>
      <div>
        {selectedPLOGroupID !== '' && <p className="mb-3">
          <span>{ploGroups.find(g => g.id === selectedPLOGroupID)?.name}</span>
          {isOwner && <>
          <EditPLOGroupForm ploGroupID={selectedPLOGroupID} initName={ploGroups.find(g => g.id === selectedPLOGroupID)?.name}/>
          <span className="cursor-pointer text-red-500" onClick={deletePLOGroup}><span className="underline">delete</span> &#9747;</span></>}
        </p>}
        {selectedPLOGroupID !== '' && <PLOSub ploGroupID={selectedPLOGroupID}/>}
      </div>
    </div>
  </div>
}

function CreatePLOGroupForm() {
  const { savePLOGroup, submitting } = useContext(PLOContext)
  const [excelFile, setExcelFile] = useState<CreatePLOModel[]>([])
  const excelJSON = (file) => {
    let reader = new FileReader()
    reader.onload = function(e) {
      let data = e.target.result
      let workbook = xlsx.read(data, {type: 'binary'})
      setExcelFile(xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]))
    }
    reader.onerror = console.log
    reader.readAsBinaryString(file)
  }
  const [show, setShow] = useState<boolean>(false)
  const { register, handleSubmit, setValue } = useForm<{name: string}>()
  const resetForm = () => {
    setShow(false)
    setValue('name', '')
    setExcelFile([])
  }
  const submitForm = (name: string) => {
    if (name === '' || excelFile.length === 0) return
    savePLOGroup(name, excelFile).then(() => {
      resetForm()
    })
  }
  return <div>
    <button className="hover:underline" onClick={() => setShow(true)}>Create a new PLO Group.</button>
    <Modal show={show} onHide={() => setShow(false)}>
      <form onSubmit={handleSubmit((form) => submitting? null: submitForm(form.name))}>
        <Modal.Header>
          <Modal.Title>Create a new PLO group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <span>PLO group name:</span><br/>
          <input type="text" {...register('name')} placeholder="PLO group name" className="border-4 rounded-md p-1 mx-2 text-sm"/><br/>
          <span>Upload PLOs:</span><br/>
          <input type="file" onChange={e => excelJSON(e.target.files[0])} className="p-1 mx-2 text-sm"/><br/>
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="create" className="py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg"/>
        </Modal.Footer>
      </form>
    </Modal>
  </div>
}

const PLOSub: React.FC<{ ploGroupID: string }> = ({ ploGroupID }) => {
  const { removePLO, submitting, isOwner } = useContext(PLOContext)
  const { data, loading, refetch } = useQuery<{plos: PLOModel[]}, {ploGroupID: string}>(GET_PLOS, { variables: { ploGroupID } })
  const deletePLO = (ploID: string) => {
    if (!confirm('Are you sure?') || submitting) return
    removePLO(ploID).then(() => toast('Deleted successfully', {type: 'success', delay: 800, hideProgressBar: true})).finally(() => refetch())
  }
  if (loading) return <p>Loading...</p>
  return <div>
    {isOwner && <div className="flex gap-x-2 items-center">
      <CreatePLOForm ploGroupID={ploGroupID} callback={refetch}/>
      <AppendPLOsForm ploGroupID={ploGroupID} callback={refetch}/>
    </div>}
    {[...data.plos].sort((p1, p2) => p1.title.localeCompare(p2.title)).map((plo) => (
      <div key={plo.id} className="flex flex-column bg-white rounded-md shadow-lg p-3 mb-3 -space-y-4">
        <p className="text-xl text-bold">
          <span>{plo.title}</span>
          {isOwner && <>
          <EditPLOForm ploID={plo.id} initTitle={plo.title} initDesc={plo.description} callback={refetch}/>
          <span className="text-sm cursor-pointer text-red-500" onClick={() => deletePLO(plo.id)}><span className="underline">delete</span> &#9747;</span></>}
        </p>
        <span className="m-0">{plo.description}</span>
      </div>
    ))}
  </div>
}

function CreatePLOForm({ ploGroupID, callback }: { ploGroupID: string, callback: () => any }) {
  const { savePLO, submitting } = useContext(PLOContext)
  const [show, setShow] = useState<boolean>(false)
  const { register, handleSubmit, reset, formState: {errors, touchedFields} } = useForm<CreatePLOModel>()
  const resetForm = () => {
    reset({title: '', description: ''})
    setShow(false)
  }
  const submitForm = (form: CreatePLOModel) => {
    savePLO(ploGroupID, form).then(() => {
      resetForm()
      callback()
    })
  }
  return <div>
    <button onClick={() => setShow(true)} className="bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded text-sm my-2">
      Create a new PLO <span className="text-xl text-green-800">+</span>
    </button>
    <Modal show={show} onHide={() => resetForm()}>
      <form onSubmit={handleSubmit((form) => submitting? null: submitForm(form))}>
        <Modal.Header>
          <Modal.Title>Create a new PLO</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input type="text" {...register('title', {required: true})} placeholder="type PLO's name" className="border-4 rounded-md p-1 mx-2 text-sm"/>
          <br/><span className="text-red-500 text-sm italic pl-3">{touchedFields.title && errors.title && 'PLO name is required.'}</span>
          <p className="my-3"></p>
          <textarea {...register('description')} placeholder="PLO's description" cols={40} rows={4} className="border-4 rounded-md p-1 mx-2 text-sm"></textarea>
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="create" className="py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg"/>
        </Modal.Footer>
      </form>
    </Modal>
  </div>
}

function EditPLOGroupForm({ploGroupID, initName}: {ploGroupID: string, initName: string}) {
  const { modifyPLOGroup, submitting } = useContext(PLOContext)
  const [show, setShow] = useState<boolean>(false)
  const {register, handleSubmit, reset} = useForm<{name: string}>({defaultValues: {name: initName}})
  const resetForm = () => {
    setShow(false)
  }
  const submitForm = (name: string) => {
    if (submitting) return
    modifyPLOGroup(ploGroupID, name).then(() => resetForm())
  }
  return <>
    <span className="cursor-pointer text-blue-600 px-4" onClick={() => setShow(true)}><span className="underline">edit</span> &#128393;</span>
    <Modal show={show} onHide={resetForm}>
      <form onSubmit={handleSubmit((form) => submitForm(form.name))}>
        <Modal.Header>
          <Modal.Title>Update the PLO Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <span>PLO group name:</span><br/>
          <input type="text" {...register('name')} placeholder="PLO group name" className="border-4 rounded-md p-1 mx-2 text-sm"/><br/>
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="save" className="py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg"/>
        </Modal.Footer>
      </form>
    </Modal>
  </>
}

function EditPLOForm({ploID, initTitle, initDesc, callback}: {ploID: string, initTitle: string, initDesc: string, callback: () => any}) {
  const { modifyPLO, submitting } = useContext(PLOContext)
  const [show, setShow] = useState<boolean>(false)
  const {register, handleSubmit, formState: {errors, touchedFields}} = useForm<CreatePLOModel>({defaultValues: {title: initTitle, description: initDesc}})
  const resetForm = () => {
    setShow(false)
  }
  const submitForm = ({title, description}: CreatePLOModel) => {
    if (submitting) return
    modifyPLO(ploID, title, description).then(() => {
      resetForm()
      callback()
    })
  }
  return <>
    <span className="text-sm cursor-pointer text-blue-600 px-3" onClick={() => setShow(true)}><span className="underline">edit</span> &#128393;</span>
    <Modal show={show} onHide={resetForm}>
      <form onSubmit={handleSubmit(submitForm)}>
        <Modal.Header>
          <Modal.Title>Update a PLO</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input type="text" {...register('title', {required: true})} placeholder="type PLO's name" className="border-4 rounded-md p-1 mx-2 text-sm"/>
          <br/><span className="text-red-500 text-sm italic pl-3">{touchedFields.title && errors.title && 'PLO name is required.'}</span>
          <p className="my-3"></p>
          <textarea {...register('description')} placeholder="PLO's description" cols={40} rows={4} className="border-4 rounded-md p-1 mx-2 text-sm"></textarea>
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="save" className="py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg"/>
        </Modal.Footer>
      </form>
    </Modal>
  </>
}

function AppendPLOsForm({ploGroupID, callback}: {ploGroupID: string, callback: () => any}) {
  const { submitting, appendPLOs } = useContext(PLOContext)
  const ref = useRef<HTMLInputElement>()
  const excelJSON = (file) => {
    let reader = new FileReader()
    reader.onload = function(e) {
      let data = e.target.result
      let workbook = xlsx.read(data, {type: 'binary'})
      appendPLOs(ploGroupID, xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])).then(() => toast('Uploaded successfully', {type: 'success'})).finally(() => callback())
    }
    reader.onerror = console.log
    reader.readAsBinaryString(file)
  }
  return <>
    <span className="text-sm cursor-pointer bg-blue-200 hover:bg-blue-300 py-1 px-2 rounded" onClick={() => submitting?null:ref.current.click()}>
      Upload PLOs <span className="text-xl text-green-900">&#8595;</span>
    </span>
    <input type="file" className="hidden" ref={ref} onChange={e => excelJSON(e.target.files[0])}/>
  </>
}

interface Params extends ParsedUrlQuery {
  id: string
}

export const getServerSideProps: GetServerSideProps<{programID: string, ploGroups: PLOGroupModel[]}> = async (context) => {
  const { id: programID } = context.params as Params
  const session = await getSession(context)
  if (!session) {
    return {
      notFound: true
    }
  }
  const client = initializeApollo(session.user.accessToken)
  const { data } = await client.query<{ploGroups: PLOGroupModel[]}, {programID: string}>({
    query: GET_PLOGROUPS,
    variables: {
      programID,
    },
  })
  return addApolloState(client, {
    props: {
      programID,
      ploGroups: data.ploGroups,
    },
  })
}

const GET_PLOGROUPS = gql`
  query PLOGroups($programID: ID!) {
    ploGroups(programID: $programID) {
      id
      name
}}`
const GET_PLOS = gql`
  query PLOs($ploGroupID: ID!) {
    plos(ploGroupID: $ploGroupID) {
      id
      title
      description
      ploGroupID
}}`
const CREATE_PLOGROUP = gql`
  mutation CreatePLOGroup($programID: ID!, $name: String!, $input: [CreatePLOsInput!]!) {
    createPLOGroup(programID: $programID, name: $name, input: $input) {
      id
      name
}}`
const ADD_PLOS = gql`
  mutation AddPLOs($ploGroupID: ID!, $input: [CreatePLOInput!]!) {
    addPLOs(ploGroupID: $ploGroupID, input: $input) {
      id
}}`
const CREATE_PLO = gql`
  mutation CreatePLO($ploGroupID: ID!, $input: CreatePLOInput!) {
    createPLO(ploGroupID: $ploGroupID, input: $input) {
      id
      title
      description
      ploGroupID
}}`
const DELETE_PLOGROUP = gql`
  mutation DeletePLOGroup($id: ID!) {
    deletePLOGroup(id: $id) {
      id
}}`
const DELETE_PLO = gql`
mutation DeletePLO($id: ID!) {
  deletePLO(id: $id) {
    id
}}`
const EDIT_PLOGROUP = gql`
  mutation EditPLOGroup($id: ID!, $name: String!) {
    editPLOGroup(id: $id, name: $name) {
      id  
}}`
const EDIT_PLO = gql`
  mutation EditPLO($id: ID!, $title: String!, $description: String!) {
    editPLO(id: $id, title: $title, description: $description) {
      id
}}`
