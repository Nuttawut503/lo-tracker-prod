import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, Key, createContext, useContext } from 'react'
import { getSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { Modal } from 'react-bootstrap'
import { toast } from 'react-toastify'
import Collapse, { Panel } from 'rc-collapse'
import { gql, useMutation } from '@apollo/client'
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

interface QuestionUpload { 
  /**
   * Excel Header Format
   */
  questionTitle: string
  maxScore: number
  studentID: string
  studentScore: number
}

interface QuizModel {
  id: string
  name: string
  createdAt: number
  questions: QuestionModel[]
}

interface QuestionModel {
  id: string
  title: string
  maxScore: number
  results: {
    studentID: string
    score: number
  }[]
  loLinks: QuestionLinkModel[]
}

interface QuestionLinkModel {
  loID: string
  level: number
  description: string
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

interface CreateQuestionLinkModel {
  questionID: string
  loID: string
  level: number
}

interface CreateQuestionLinkResponse {
  questionID: string
  loID: string
}

interface CreateQuizModel {
  name: string
  createdAt: Date
  questions: CreateQuestionModel[]
}

interface CreateQuizResponse {
  id: string
}

interface CreateQuestionModel {
  title: string
  maxScore: number
  results: CreateQuestionResultModel[]
}

interface CreateQuestionResultModel {
  studentID: string
  score: number
}

interface DeleteQuestionLinkModel {
  questionID: string
  loID: string
  level: number
}

interface DeleteQuestionLinkResponse {
  questionID: string
  loID: string
}

const QuizContext = createContext<{
  selectedQuestionID: string
  setSelectedQuestionID: (s: string) => any,
  removeQuiz: (id: string) => Promise<any>,
  removeQuestionLink: (input: DeleteQuestionLinkModel) => Promise<any>,
  changeQuizName: (id: string, name: string) => Promise<any>,
  submitting: boolean,
  isOwner: boolean,
}>({
  selectedQuestionID: '',
  setSelectedQuestionID: () => null,
  removeQuiz: () => null,
  removeQuestionLink: () => null,
  changeQuizName: () => null,
  submitting: false,
  isOwner: false,
})

export default function Page({course, quizzes, los}: {course: CourseModel, quizzes: QuizModel[], los: LOModel[]}) {
  const router = useRouter()
  const { isSignedIn, isSameUserID } = useContext(AuthContext)
  const [selectedQuestionID, setSelectedQuestionID] = useState<string>('')
  const [deleteQuiz, { loading: Qdeleting}] = useMutation<{deleteQuiz: {id: string}}, {id: string}>(DELETE_QUIZ)
  const [deleteQuestionLink, {loading: QLdeleting}] = useMutation<{deleteQuestionLink: DeleteQuestionLinkResponse}, {input: DeleteQuestionLinkModel}>(DELETE_QUESTIONLINK)
  const [editQuiz, {loading: Quizediting}] = useMutation<{editQuiz: {id: string}}, {id: string, name: string}>(EDIT_QUIZ)
  const submitting = Qdeleting || QLdeleting || Quizediting
  const removeQuiz = (id: string) => {
    return deleteQuiz({variables: {id}}).finally(() => {
      let isSelected = quizzes.find(quiz => quiz.id === id).questions.findIndex(question => question.id === selectedQuestionID) !== -1
      if (isSelected) {
        setSelectedQuestionID('')
      }
      router.replace(router.asPath)
    })
  }
  const removeQuestionLink = (input: DeleteQuestionLinkModel) => {
    return deleteQuestionLink({variables: {input}}).finally(() => router.replace(router.asPath))
  }
  const changeQuizName = (id: string, name: string) => editQuiz({variables: {id, name}}).finally(() => router.replace(router.asPath))
  const isOwner = isSignedIn && isSameUserID(course.teacherID)
  return <div>
    <Head>
      <title>Manage quizzes</title>
    </Head>
    <KnownCourseMainMenu programID={course.programID} courseID={course.id} courseName={course.name}/>
    <CourseSubMenu courseID={course.id} selected={'quizzes'}/>
    <QuizContext.Provider value={{selectedQuestionID, setSelectedQuestionID, removeQuiz, removeQuestionLink, submitting, isOwner, changeQuizName}}>
      {isOwner && <CreateQuizForm courseID={course.id} callback={() => router.replace(router.asPath)}/>}
      <div className="grid grid-cols-2 gap-x gap-x-6 mt-2">
        <div className="flex flex-column space-y-2">
          <Quizzes quizzes={quizzes}/>
        </div>
        <div>
          {selectedQuestionID !== '' && 
          <div className="flex flex-column divide-y-4 gap-y-3 p-3 bg-white rounded-md shadow-md">
            {isOwner && <CreateQuestionLinkForm los={[...los]} questionID={selectedQuestionID} callback={() => router.replace(router.asPath)}/>}
            <LinkedLOContainer quizzes={quizzes}/>  
          </div>}
        </div>
      </div>
    </QuizContext.Provider>
  </div>
}

function Quizzes({quizzes}: {quizzes: QuizModel[]}) {
  const { selectedQuestionID, setSelectedQuestionID, removeQuiz, submitting, isOwner } = useContext(QuizContext)
  const deleteQuiz = (id: string) => {
    if (submitting || !confirm('Delete this quiz?')) return
    removeQuiz(id).then(() => {
      let isSelected = quizzes.find(quiz => quiz.id === id).questions.findIndex(question => question.id === selectedQuestionID) !== -1
      if (isSelected) {
        setSelectedQuestionID('')
      }
    })
  }
  const [activeKey, setActiveKey] = useState<Key | Key[]>([])
  return <Collapse activeKey={activeKey} onChange={setActiveKey}>
    {quizzes.sort((q1, q2) => q1.name.localeCompare(q2.name)).map((quiz) => (
      <Panel key={quiz.id} header={<p>{quiz.name} <span onClick={e => e.stopPropagation()}>{isOwner && <EditQuizForm quizID={quiz.id} quizName={quiz.name}/>}</span></p>}>
        <ul>
        {[...quiz.questions].sort((q1, q2) => q1.title.localeCompare(q2.title)).map((question, index) => (
          <li key={question.id} className="p-3">
            <div className="grid justify-between items-center" style={{gridTemplateColumns: '1fr auto'}}>
              <div>
                <p>Q{index + 1}) {question.title}</p>
                <p>(max score: {question.maxScore})</p>
              </div>
              <div className="flex flex-row-reverse space-x-2">
                <button
                  onClick={() => setSelectedQuestionID(question.id)}
                  className={`bg-gray-200 hover:bg-gray-400 py-1 px-2 rounded text-sm ${selectedQuestionID===question.id?'bg-blue-400 hover:bg-blue-300':''}`}>
                  Manage LOs <span className="text-xl text-green-800">&#9874;</span>
                </button>
              </div>
            </div>
          </li>
        ))}
        </ul>
        {isOwner && <p className="cursor-pointer text-red-400 text-sm pt-3" onClick={() => deleteQuiz(quiz.id)}>Delete this quiz record</p>}
      </Panel>
    ))}
  </Collapse>
}

function EditQuizForm({quizID, quizName}: {quizID: string, quizName: string}) {
  const {submitting, changeQuizName} = useContext(QuizContext)
  const [show, setShow] = useState<boolean>(false)
  const { register, handleSubmit } = useForm<{ name: string }>({defaultValues: {name: quizName}})
  return <>
    <span className="text-red-500 hover:underline" onClick={() => setShow(true)}>edit</span>
    <Modal show={show} onHide={() => setShow(false)}>
      <form
        onSubmit={handleSubmit(({name}) => submitting?null:changeQuizName(quizID, name).finally(() => setShow(false)))}>
        <Modal.Header>
          <Modal.Title>Update the quiz name</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <span>Quiz name:</span><br/>
          <input type="text" {...register('name')} placeholder="quiz name" className="border-4 rounded-md p-1 mx-2 text-sm"/><br/>
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="save" className="py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg"/>
        </Modal.Footer>
      </form>
    </Modal>
  </>
}

function LinkedLOContainer({quizzes}: {quizzes: QuizModel[]}) {
  const { selectedQuestionID, removeQuestionLink, submitting, isOwner } = useContext(QuizContext)
  let questionLinks: QuestionLinkModel[] = []
  if (selectedQuestionID !== '') {
    questionLinks = [...quizzes].filter((quiz) => quiz.questions.findIndex((question) => question.id === selectedQuestionID) !== -1)[0]
      .questions.filter((question) => question.id === selectedQuestionID)[0].loLinks
  }
  const deleteQuestionLink = (loID: string, level: number) => {
    if (submitting || !confirm('Delete this mapping?')) return
    removeQuestionLink({questionID: selectedQuestionID, loID, level})
  }
  return <div className="pt-3">
    <span>Linked LOs: </span><br/>
    <ul>
    {[...questionLinks].sort((l1, l2) => l1.description.localeCompare(l2.description)).map((lo) => (
      <li key={`${lo.loID}-${lo.level}`}>
        {lo.description}&nbsp;
        {isOwner && <span className="cursor-pointer text-red-600" onClick={() => deleteQuestionLink(lo.loID, lo.level)}>&#9747;</span>}
      </li>
    ))}
    {questionLinks.length === 0 && <span>No linked LOs</span>}
    </ul>
  </div>
}

function CreateQuizForm({courseID, callback}: {courseID: string, callback: () => any}) {
  const [createQuiz, {loading: submitting}] = useMutation<{createQuiz: CreateQuizResponse}, {courseID: string, input: CreateQuizModel}>(CREATE_QUIZ)
  const [show, setShow] = useState<boolean>(false)
  const { register, handleSubmit, setValue } = useForm<{ name: string }>()
  const [excelFile, setExcelFile] = useState<QuestionUpload[]>([])
  const [submitDisable, setDisable] = useState<boolean>(false)
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
  const submitQuizExcel = (name: string) => {
    setDisable(true)
    if (name === '' || excelFile.length === 0 || submitting) {
      setDisable(false)
      return
    }
    let questions = new Map<string, CreateQuestionModel>()
    for (let i = 0; i < excelFile.length; ++i) {
      let question: CreateQuestionModel = {
        title: '',
        maxScore: 0,
        results: []
      }
      if (questions.has(excelFile[i].questionTitle)) {
        question = questions.get(excelFile[i].questionTitle)
      }
      question.title = excelFile[i].questionTitle
      question.maxScore = excelFile[i].maxScore
      question.results = [...question.results, {
        studentID: `${excelFile[i].studentID}`,
        score: excelFile[i].studentScore
      }]
      questions.set(excelFile[i].questionTitle, question)
    }
    createQuiz({
      variables: {
        courseID,
        input: {
          name: name,
          createdAt: new Date(),
          questions: [...questions.values()]
        }
      }
    }).then(() => {
      setValue('name', '')
      setExcelFile([])
      setDisable(false)
      setShow(false)
      callback()
    })
  }
  return <div>
    <button className="hover:underline" onClick={() => setShow(true)}>Create a new quiz.</button>
    <Modal show={show} onHide={() => {setShow(false); setDisable(false);}}>
      <form
        onSubmit={handleSubmit(({name}) => submitQuizExcel(name))}>
        <Modal.Header>
          <Modal.Title >Create a new quiz</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <span>Quiz name:</span><br/>
          <input type="text" {...register('name')} placeholder="quiz name" className="border-4 rounded-md p-1 mx-2 text-sm"/><br/>
          <span>Upload quiz result:</span><br/>
          <input type="file" onChange={e => excelJSON(e.target.files[0])} className="p-1 mx-2 text-sm"/><br/>
          {submitting && <div>
            <p>Uploading...</p>
            <p>If it take too long, please make sure you have imported all students of this quiz.</p>
          </div>}
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="create" disabled={submitDisable}
            className={`py-2 px-4 
              ${submitDisable? 'bg-gray-200 hover:bg-gray-200 ': 'bg-green-300 hover:bg-green-500'} 
             rounded-lg`} />
        </Modal.Footer>
      </form>
    </Modal>
  </div>
}

const CreateQuestionLinkForm: React.FC<{los: LOModel[], questionID: string, callback: () => any}> = ({los, questionID, callback}) => {
  const [createQuestionLink, { loading: submitting }] = useMutation<{createQuestionLink: CreateQuestionLinkResponse}, {input: CreateQuestionLinkModel}>(CREATE_QUESTIONLINK)
  const [selectedLOID, setSelectedLOID] = useState<string>('')
  const { register, handleSubmit, setValue } = useForm<CreateQuestionLinkModel>({defaultValues: {loID: '', level: 0}})
  const resetForm = () => {
    setValue('loID', '')
    setValue('level', 0)
  }
  const submitForm = (form: CreateQuestionLinkModel) => {
    if (form.loID === '' || form.level === 0 || submitting) return
    createQuestionLink({
      variables: {
        input: {
          ...form,
          questionID
        },
      }
    }).then(() => {
      resetForm()
      setSelectedLOID('')
      callback()
    }).catch(_ => toast("Can not be added!", {type: 'error'}))
  }
  return <form onSubmit={handleSubmit((form) => submitForm(form))}>
    <span>Select LO:</span><br/>
    <select {...register('loID')} style={{width: '250px'}} className="border-4 rounded-md p-1 mx-2 text-sm w-2/4" defaultValue="" onChange={e => {setSelectedLOID(e.target.value);setValue('level', 0)}}>
      <option disabled value="">--Select LO--</option>
      {los.sort((l1, l2) => l1.title.localeCompare(l2.title)).map((lo) => (
        <option value={lo.id} key={lo.id}>
          {lo.title}
        </option>
      ))}
    </select><br/>
    {selectedLOID !== '' && <div>
      <span>Select Level:</span><br/>
      <select {...register('level')} style={{width: '250px'}} className="border-4 rounded-md p-1 mx-2 text-sm w-2/4" defaultValue={0}>
        <option disabled value={0}>--Select Level--</option>
        {los[los.findIndex((lo) => lo.id == selectedLOID)] && los[los.findIndex((lo) => lo.id == selectedLOID)].levels.map((level) => (
          <option value={level.level} key={level.description}>
            {level.description}
          </option>
        ))}
      </select>
    </div>}<br/>
    <input type="submit" value="add" className="py-2 px-4 bg-green-300 hover:bg-green-500 rounded-lg"/>
  </form>
}

interface Params extends ParsedUrlQuery {
  id: string
}

export const getServerSideProps: GetServerSideProps<{course: CourseModel, quizzes: QuizModel[], los: LOModel[]}> = async (context) => {
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
      variables: {
        courseID
      }
    }),
    client.query<{quizzes: QuizModel[]}, {courseID: string}>({
      query: GET_QUIZZES,
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
      quizzes: data[1].data.quizzes,
      los: data[2].data.los
    }
  })
}

const GET_COURSE = gql`
  query CourseDescription($courseID: ID!) {
    course(courseID: $courseID) {
      id
      name
      programID
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
const GET_QUIZZES = gql`
  query Quizzes($courseID: ID!) {
    quizzes(courseID: $courseID) {
      id
      name
      createdAt
      questions {
        id
        title
        maxScore
        loLinks {
          loID
          level
          description
        }
      }
}}`
const CREATE_QUIZ = gql`
  mutation CreateQuiz($courseID: ID!, $input: CreateQuizInput!) {
    createQuiz(courseID: $courseID, input: $input) {
      id
}}`
const EDIT_QUIZ = gql`
  mutation EditQuiz($id: ID!, $name: String!) {
    editQuiz(id: $id, name: $name) {
      id
}}`
const DELETE_QUIZ = gql`
  mutation DeleteQuiz($id: ID!) {
    deleteQuiz(id: $id) {
      id
}}`
const CREATE_QUESTIONLINK = gql`
  mutation CreateQuestionLink($input: CreateQuestionLinkInput!) {
    createQuestionLink(input: $input) {
      questionID
      loID
}}`
const DELETE_QUESTIONLINK = gql`
  mutation DeleteQuestionLink($input: DeleteQuestionLinkInput!) {
    deleteQuestionLink(input: $input) {
      questionID
      loID
}}`
