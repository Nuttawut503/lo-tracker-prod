import { GetServerSideProps } from 'next'
import Head from 'next/head'
import router from 'next/router'
import { gql } from '@apollo/client'
import { getSession } from 'next-auth/react'
import { OverlayTrigger, Table, Tooltip } from 'react-bootstrap'
import { ParsedUrlQuery } from 'querystring'

import { initializeApollo, addApolloState } from 'libs/apollo-client'
import { ProgramMainMenu, ProgramSubMenu } from 'components/Menu'
import { ChartBarPLOAll } from 'components/dashboards/plochart'

export default function Page({programID, ploGroupDashboard}: {programID: string, ploGroupDashboard: DashboardPLOGroup}) {
  const plos = ploGroupDashboard
  function toPercentage(n: number){
    return parseInt((n * 100).toFixed(0))
  }
  return <div className="bg-white p-3 rounded-md shadow-md">
  <Head>
    <title>PLO Group Dashboard</title>
  </Head>
  <ProgramMainMenu programID={programID} />
  <ProgramSubMenu programID={programID} selected={'plos'} />
  
  <div className="flex">
    <div style={{ minWidth: "50%", marginRight: "2%" }}>
      <button onClick={() => { router.back() }} className="text-lg mr-4">&#12296;Back</button>
      <span>PLO Group : {plos.name}</span>
      <br/>
      <p className="ml-2 text-sm">(Click on student to go to their program dashboard)</p>
      {plos.students.length == 0 && <p>No Student Data</p> ||
      <Table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Student Email</th>
            <th>Student Name</th>
          </tr>
        </thead>
        <tbody>
          {plos.students.sort((a, b) => a.id.localeCompare(b.id)).map((d, i) => (
            <tr className="cursor-pointer hover:text-blue-600" key={d.id} onClick={() => router.push(`/students/${d.id}`)}>
              <td>{d.id}</td>
              <td>{d.email}</td>
              <td>{d.name} {d.surname}</td>
            </tr>
          ))}
        </tbody>
      </Table>}
    </div>
    {plos.plos.length == 0 && <p>No PLO Data</p> ||
    <div>
      <br/><br/>
      <ChartBarPLOAll data={plos.plos} scoreType="Program Learning Outcome" />
      <Table striped bordered>
        <thead>
          <tr>
            <th>PLO Title</th>
            <th>Min(%)</th>
            <th>Max(%)</th>
            <th>Mean(%)</th>
            <th>Median(%)</th>
          </tr>
        </thead>
        <tbody>
          {plos.plos.sort((a, b) => a.title.localeCompare(b.title)).map((d, i) => (
            <tr key={`${d.title}${i}`}>
              <OverlayTrigger
                placement="right" overlay={
                  <Tooltip id={`tooltip${i}`}>
                    <p>{d.description}</p>
                  </Tooltip>
                }><td>{d.title}</td></OverlayTrigger>
              <td>{toPercentage(d.stats.min)}</td>
              <td>{toPercentage(d.stats.max)}</td>
              <td>{toPercentage(d.stats.mean)}</td>
              <td>{toPercentage(d.stats.median)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>}
  </div>
</div>
}

interface PageParams extends ParsedUrlQuery {
  id: string
  ploGroupID: string
}

export const getServerSideProps: GetServerSideProps<{programID: string, ploGroupDashboard: DashboardPLOGroup}> = async (context) => {
  const { id: programID, ploGroupID } = context.params as PageParams
  const session = await getSession(context)
  if (!session) {
    return {
      notFound: true
    }
  }
  const client = initializeApollo(session.user.accessToken)
  const { data } = await client.query<{individualPLOGroupSummary: DashboardPLOGroup}, {ploGroupID: string}>({
    query: gql`
      query individualPLOGroupSummary($ploGroupID: ID!) {
        individualPLOGroupSummary(ploGroupID: $ploGroupID) {
          name
          plos {
            title
            description
            stats {
              min
              max
              mean
              median
            }
          }
          students {
            id
            email
            name
            surname
          }
    }}`, 
    variables: { ploGroupID }
  })
  return addApolloState(client, {
    props: {
      programID,
      ploGroupDashboard: data.individualPLOGroupSummary,
    },
    //revalidate: 30,
  })
}

interface DashboardPLOGroup {
  name: string
  plos: {
    title: string
    description: string
    stats: {
      min: number
      max: number
      mean: number
      median: number
    }
  }[]
  students: {
    id: string
    email: string
    name: string
    surname: string
  }[]
}
