import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useRef, useContext } from 'react'
import { getSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { Modal } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { gql, useMutation, useQuery } from '@apollo/client'
import { ParsedUrlQuery } from 'querystring'
import xlsx from 'xlsx'

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

interface PLOModel {
  id: string
  title: string
  description: string
  ploGroupID: string
}

interface LOModel {
  id: string
  title: string
  levels: {
    level: number
    description: string
  }[]
  ploLinks: {
    id: string
    title: string
    description: string
    ploGroupID: string
  }[]
}

interface CreateLOModel {
  title: string
  level: number
  description: string
}

interface CreateLOLinkResponse {
  loID: string
  ploID: string
}

interface CreateLOLevelModel {
  level: number
  description: string
}

interface CreateLOLevelResponse {
  id: string
}

interface CreateLOResponse {
  id: string
}

interface DeleteLOLinkResponse {
  loID: string
  ploID: string
}

export default function Page({course, los}: {course: CourseModel, los: LOModel[]}) {
  return <div>
    <Head>
      <title>Manage LOs</title>
    </Head>
    <KnownCourseMainMenu programID={course.programID} courseID={course.id} courseName={course.name}/>
    <CourseSubMenu courseID={course.id} selected={'los'}/>
    <LO courseID={course.id} ploGroupID={course.ploGroupID} los={[...los]} teacherID={course.teacherID}/>
  </div>
}

function LO({courseID, ploGroupID, los, teacherID}: {courseID: string, ploGroupID: string, los: LOModel[], teacherID: string}) {
  const { isSignedIn, isSameUserID } = useContext(AuthContext)
  const router = useRouter()
  const [deleteLO, {loading: LOdeleting}] = useMutation<{deleteLO: {id: string}}, {id: string}>(DELETE_LO)
  const [deleteLOLevel, {loading: LOLeveldeleting}] = useMutation<{deleteLOLevel: {id: string}}, {id: string, level: number}>(DELETE_LOLEVEL)
  const [deleteLOLink, {loading: LOLinkdeleting}] = useMutation<{deleteLOLink: DeleteLOLinkResponse}, {loID: string, ploID: string}>(DELETE_LOLINK)
  const [selectedLOID, setSelectedLOID] = useState<string>('')
  const deleteLinkedPLO = (ploID: string) => {
    if (LOLinkdeleting || !confirm('Delete this mapping?')) return
    deleteLOLink({
      variables: {
        loID: selectedLOID,
        ploID
      }
    }).finally(() => router.replace(router.asPath))
  }
  const removeLO = (id: string) => {
    if (LOdeleting || !confirm('Delete this LO (include sub LO levels)?')) return
    deleteLO({
      variables: { id }
    }).then(() => {
      if (id === selectedLOID) {
        setSelectedLOID('')
      }
      router.replace(router.asPath)
    })
  }
  const removeLOLevel = (id: string, level: number) => {
    if (LOLeveldeleting || !confirm('Delete LO Level?')) return
    deleteLOLevel({
      variables: {
        id,
        level
      }
    }).then(() => router.replace(router.asPath))
  }
  const isOwner = isSignedIn && isSameUserID(teacherID)
  return <>
    {isOwner && <div className="flex gap-x-2 items-center">
      <CreateLOForm courseID={courseID} callback={() => router.replace(router.asPath)}/>
      <CreateManyLOForm courseID={courseID} callback={() => router.replace(router.asPath)}/>
    </div>}
    <div className="grid grid-cols-2 gap-x gap-x-6 mt-2">
      <div className="flex flex-column space-y-2 overflow-y-auto" style={{maxHeight: '700px'}}>
        {los.sort((l1, l2) => l1.title.localeCompare(l2.title)).map((lo) => (
        <div key={lo.id} className="shadow-lg p-3 bg-white rounded-md">
          <span className="text-lg">{lo.title}</span> &nbsp;
          {isOwner && <>
            <EditLOForm loID={lo.id} title={lo.title} callback={() => router.replace(router.asPath)}/>
            <span className="cursor-pointer text-red-600 bg-red-200 hover:bg-red-300 py-1 px-1 rounded" onClick={() => removeLO(lo.id)}>
              delete&#9747;
            </span>
          </>}
          <p className="my-3"></p>
          <ul className="px-2">
          {[...lo.levels].sort((l1, l2) => l1.level - l2.level).map((level) => (
            <li key={`${lo.id}-${level.level}`}>
              <p>
                Level {level.level}
                {isOwner && <EditLOLevelForm loID={lo.id} level={level.level} description={level.description} callback={() => router.replace(router.asPath)} />}
                {isOwner && lo.levels.length > 1 && <span className="cursor-pointer text-red-600" onClick={() => removeLOLevel(lo.id, level.level)}>&#9747;</span>}
              </p>
              <p>{level.description}</p>
            </li>
          ))}
          </ul>
          <br/>
          <div className="flex justify-end space-x-3">
            {isOwner && <CreateLOLevelForm loID={lo.id} initLevel={lo.levels.length + 1} callback={() => router.replace(router.asPath)}/>}
            <button
              onClick={() => setSelectedLOID(lo.id)}
              className={`py-1 px-2 rounded text-sm ${selectedLOID===lo.id?'bg-blue-400 hover:bg-blue-300':'bg-gray-200 hover:bg-gray-400'}`}>
              Inspect linked PLOs <span className="text-xl text-green-800">&#9874;</span>
            </button>
          </div>
        </div>
      ))}
      </div>
      <div>
        {selectedLOID !== '' && 
        <div className="flex flex-column divide-y-4 space-y-2 bg-white rounded-md p-3 shadow-md">
          {isOwner && <CreateLOLink loID={selectedLOID} ploGroupID={ploGroupID} callback={() => router.replace(router.asPath)}/>}
          <div className="pt-3">
            <span>Linked PLOs: </span><br/>
            <ul>
            {[...los.find((lo) => lo.id == selectedLOID).ploLinks]
              .sort((p1, p2) => p1.title.localeCompare(p2.title))
              .map((plo) => <li key={plo.id}>
                <span>{plo.title}</span>&nbsp;
                {isOwner && <span className="underline cursor-pointer text-red-600" onClick={() => deleteLinkedPLO(plo.id)}>delete</span>}
                <br/>
                <span>{plo.description}</span>&nbsp;
              </li>)
            }
            {los[los.findIndex((lo) => lo.id == selectedLOID)].ploLinks.length === 0 && <span>No linked PLOs</span>}
            </ul>
          </div>  
        </div>}
      </div>
    </div>
  </>
}

interface LOExcel {
  title: string
  levels: LOLevelExcel[]
}

interface LOLevelExcel {
  level: number
  description: string
}

function CreateManyLOForm({courseID, callback}: {courseID: string, callback: () => any}) {
  const ref = useRef<HTMLInputElement>()
  const [createLOs, {loading}] = useMutation<{createLOs: {id: string}[]}, {courseID: string, input: LOExcel[]}>(CREATE_LOS)
  const excelJSON = (file) => {
    let reader = new FileReader()
    reader.onload = function(e) {
      let data = e.target.result
      let workbook = xlsx.read(data, {type: 'binary'})
      const excelsheet = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
      let los: LOExcel[] = []
      for (let i = 0; i < excelsheet.length; ++i) {
        let lolevel: LOLevelExcel[] = []
        for (let j = 1; j < 100 && excelsheet[i][`level${j}`] !== undefined; j++) {
          lolevel.push({
            level: j,
            description: excelsheet[i][`level${j}`]
          })
        }
        if (lolevel.length > 0) {
          los.push({
            title: excelsheet[i]['title'],
            levels: lolevel
          })
        }
      }
      if (los.length === 0) {
        toast('Excel is empty', {type:'info'})
        return
      }
      createLOs({variables: {courseID, input: los}}).then(() => toast('Uploaded successfully')).finally(() => callback())
    }
    reader.onerror = console.log
    reader.readAsBinaryString(file)
  }
  return <> 
    <span className="bg-blue-200 hover:bg-blue-300 py-1 px-2 rounded text-sm" onClick={() => loading?null:ref.current.click()}>
      Upload LOs <span className="text-xl text-green-900">&#8595;</span>
    </span>
    <input type="file" className="hidden" ref={ref} onChange={e => excelJSON(e.target.files[0])}/>
  </>

}

function CreateLOLink({ loID, ploGroupID, callback }: { loID: string, ploGroupID: string, callback: () => any }) {
  const { data, loading }  = useQuery<{plos: PLOModel[]}, {ploGroupID: string}>(GET_PLOS, {variables: {ploGroupID}})
  const [createLOLink, {loading: submitting}] = useMutation<{createLOLink: CreateLOLinkResponse}, {loID: string, ploID: string}>(CREATE_LOLINK)
  const { register, handleSubmit, setValue } = useForm<{ploID: string}>({defaultValues: {ploID: ''}})
  if (loading) return <p>Loading...</p>
  return <div>
    <form onSubmit={handleSubmit((form) => {
      if (form.ploID === '' || submitting) return
      createLOLink({
        variables: {
          loID,
          ploID: form.ploID
        }
      }).then(() => {
        setValue('ploID', '')
        callback()
      }).catch(_ => toast("Can not be added!", {type: 'error'}))
    })}>
      <select {...register('ploID')} className="border-4 rounded-md p-1 mx-2 text-sm" defaultValue="">
        <option disabled value="">--Select PLO--</option>
        {[...data.plos].sort((p1, p2) => p1.title.localeCompare(p2.title)).map((plo) => (
          <option value={plo.id} key={plo.id}>
            {plo.title}
          </option>
        ))}
      </select>
      <input type="submit" value="add" className="py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg"/>
    </form>
  </div>
}

function CreateLOForm({courseID, callback}: {courseID: string, callback: () => any}) {
  const [createLO, { loading }] = useMutation<{createLO: CreateLOResponse}, {courseID: string, input: CreateLOModel}>(CREATE_LO)
  const [show, setShow] = useState<boolean>(false)
  const { register, handleSubmit, reset } = useForm<CreateLOModel>({
    defaultValues: {
      title: '',
      level: 1,
      description: '',
    }
  })
  const resetForm = () => {
    reset({title: '', level: 1, description: ''})
    setShow(false)
  }
  const submitForm = (form: CreateLOModel) => {
    if (form.title === '' || form.description === '') return
    createLO({
      variables: {
        courseID,
        input: form
      }
    }).then(() => {
      resetForm()
      callback()
    })
  }
  return <div>
    <button onClick={() => setShow(true)} className="bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded text-sm">
      Create a new LO <span className="text-xl text-green-900">+</span>
    </button>
    <Modal show={show} onHide={() => resetForm()}>
      <form onSubmit={handleSubmit((form) => loading? null: submitForm(form))}>
        <Modal.Header>
          <Modal.Title>Create a new LO</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <span>LO Title:</span><br/>
          <input type="text" {...register('title', {required: true})} className="border-4 rounded-md p-1 mx-2 text-sm"/><br/>
          <span>Initial LO Level:</span><br/>
          <span className="border-4 rounded-md p-1 mx-2 text-sm bg-gray-200 inline-block w-1/3">{1}</span><br/>
          <span>Level Description:</span><br/>
          <textarea {...register('description', {required: true})} className="border-4 rounded-md p-1 mx-2 text-sm" cols={40} rows={4}/><br/>
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="create" className="py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg"/>
        </Modal.Footer>
      </form>
    </Modal>
  </div>
}

function CreateLOLevelForm({loID, initLevel, callback}: {loID: string, initLevel: number, callback: () => any}){
  const [show, setShow] = useState<boolean>(false)
  const [createLOLevel, {loading: submitting}] = useMutation<{createLOLevel: CreateLOLevelResponse}, {loID: string, input: CreateLOLevelModel}>(CREATE_LOLEVEL)
  const { register, handleSubmit, setValue } = useForm<CreateLOLevelModel>({
    defaultValues: {
      level: 1,
      description: '',
    }
  })
  return <>
    <button onClick={() => setShow(true)} className="bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded text-sm">
      Create a new LO level <span className="text-xl text-green-800">+</span>
    </button>
    <Modal show={show} onHide={() => setShow(false)}>
      <form
        onSubmit={handleSubmit((form) => {
          if (form.description === '' || form.level <= 0 || submitting) return
          createLOLevel({
            variables: {
              loID,
              input: form
            }
          }).then(() => {
            callback()
            setValue('description', '')
          }).catch(_ => alert('Duplicated LO Level')).finally(() => {
            setShow(false)
          })
        })}>
        <Modal.Header>
          <Modal.Title>Create a new LO level</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <span>LO Level:</span><br/>
          <input {...register('level', {required: true})} className="border-4 rounded-md p-1 mx-2 text-sm"/><br/>
          <span>Description:</span><br/>
          <textarea {...register('description', {required: true})} className="border-4 rounded-md p-1 mx-2 text-sm" cols={40} rows={4}></textarea><br/>
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="create" className="py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg"/>
        </Modal.Footer>
      </form>
    </Modal>
  </>
}

function EditLOForm({loID, title, callback}: {loID: string, title: string, callback: () => any}) {
  const [show, setShow] = useState<boolean>(false)
  const { register, handleSubmit, setValue } = useForm<{title: string}>({defaultValues: {title}})
  const resetForm = () => {
    setShow(false)
    setValue('title', title)
  }
  const [editLO, {loading}] = useMutation<{editLO: {id: string}}, {id: string, title: string}>(EDIT_LO)
  const updateLO = (newTitle: string) => {
    if (loading || newTitle === title) return
    editLO({
      variables: {
        id: loID,
        title: newTitle
      }
    }).finally(() => {
      setShow(false)
      callback()
    })
  }
  return <>
    <span className="cursor-pointer text-blue-600 bg-blue-200 hover:bg-blue-300 py-1 px-1 rounded mr-2" onClick={() => setShow(true)}>edit &#128393;</span>
    <Modal show={show} onHide={resetForm}>
      <form onSubmit={handleSubmit((form) => loading?null:updateLO(form.title))}>
        <Modal.Header>
          <Modal.Title>Update LO title</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <span>LO title</span><br/>
          <input type="text" {...register('title', {required: true})} placeholder="type LO title" className="border-4 rounded-md p-1 mx-2 text-sm"/><br/>
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="save" className="py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg"/>
        </Modal.Footer>
      </form>
    </Modal>
  </>
}

function EditLOLevelForm({loID, level, description, callback}: {loID: string, level: number, description: string, callback: () => any}) {
  const [show, setShow] = useState<boolean>(false)
  const { register, handleSubmit, setValue } = useForm<{description: string}>({defaultValues: {description}})
  const resetForm = () => {
    setShow(false)
    setValue('description', description)
  }
  const [editLOLevel, {loading}] = useMutation<{editLO: {id: string, level: number}}, {id: string, level: number, description: string}>(EDIT_LOLEVEL)
  const updateLOLevel = (newDescription: string) => {
    if (loading || newDescription === description) return
    editLOLevel({
      variables: {
        id: loID,
        level,
        description: newDescription
      }
    }).finally(() => {
      setShow(false)
      callback()
    })
  }
  return <>
    <span className="text-sm cursor-pointer text-blue-600 px-3" onClick={() => setShow(true)}><span className="underline">edit</span> &#128393;</span>
    <Modal show={show} onHide={resetForm}>
      <form onSubmit={handleSubmit((form) => loading?null:updateLOLevel(form.description))}>
        <Modal.Header>
          <Modal.Title>Update LO Level</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <span>LO Level</span><br/>
          <span className="border-4 rounded-md p-1 mx-2 text-sm bg-gray-200 inline-block w-1/3">{level}</span><br/>
          <span>LO Level Description</span><br/>
          <input type="text" {...register('description', {required: true})} placeholder="type LO title" className="border-4 rounded-md p-1 mx-2 text-sm"/><br/>
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="save" className="py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg"/>
        </Modal.Footer>
      </form>
    </Modal>
  </>
}

interface Params extends ParsedUrlQuery {
  id: string
}

export const getServerSideProps: GetServerSideProps<{course: CourseModel, los: LOModel[]}> = async (context) => {
  const { id: courseID } = context.params as Params
  const session = await getSession(context)
  if (!session) {
    return {
      notFound: true
    }
  }
  const client = initializeApollo(session.user.accessToken)
  const data = await Promise.all([
    client.query<{course: CourseModel}, {courseID: string}>({
      query: GET_COURSE,
      variables: { courseID }
    }),
    client.query<{los: LOModel[]}, {courseID: string}>({
      query: GET_LOS,
      variables: { courseID }
    })
  ])
  return addApolloState(client, {
    props: {
      course: data[0].data.course,
      los: data[1].data.los
    }
  })
}

const GET_COURSE = gql`
  query CourseDescription($courseID: ID!) {
    course(courseID: $courseID) {
      id
      name
      programID
      ploGroupID
      teacherID
}}`
const GET_LOS = gql`
  query LOs($courseID: ID!) {
    los(courseID: $courseID) {
      id
      title
      levels {
        level
        description
      }
      ploLinks {
        id
        title
        description
        ploGroupID
      }
}}`
const CREATE_LOS = gql`
  mutation CreateLOs($courseID: ID!, $input: [CreateLOsInput!]!) {
    createLOs(courseID: $courseID, input: $input) {
      id
}}`
const CREATE_LO = gql`
  mutation CreateLO($courseID: ID!, $input: CreateLOInput!) {
    createLO(courseID: $courseID, input: $input) {
      id
}}`
const DELETE_LO = gql`
  mutation DeleteLO($id: ID!) {
    deleteLO(id: $id) {
      id
}}`
const CREATE_LOLEVEL = gql`
  mutation CreateLOLevel($loID: ID!, $input: CreateLOLevelInput!) {
    createLOLevel(loID: $loID, input: $input) {
      id
}}`
const DELETE_LOLEVEL = gql`
  mutation DeleteLOLevel($id: ID!, $level: Int!) {
    deleteLOLevel(id: $id, level: $level) {
      id
}}`
const GET_PLOS = gql`
  query PLOs($ploGroupID: ID!) {
    plos(ploGroupID: $ploGroupID) {
      id
      title
      description
      ploGroupID
}}`
const CREATE_LOLINK = gql`
  mutation CreateLOLink($loID: ID!, $ploID: ID!) {
    createLOLink(loID: $loID, ploID: $ploID) {
      loID
      ploID
}}`
const DELETE_LOLINK = gql`
  mutation DeleteLOLink($loID: ID!, $ploID: ID!) {
    deleteLOLink(loID: $loID, ploID: $ploID) {
      loID
      ploID
}}`
const EDIT_LO = gql`
  mutation EditLO($id: ID!, $title: String!) {
    editLO(id: $id, title: $title) {
      id
}}`
const EDIT_LOLEVEL = gql`
mutation EditLOLevel($id: ID!, $level: Int!, $description: String!) {
  editLOLevel(id: $id, level: $level, description: $description) {
    id
}}`
