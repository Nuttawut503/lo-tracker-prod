import Head from 'next/head';
import router, { useRouter } from 'next/router';
import ClientOnly from '../ClientOnly';
import { Modal } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import xlsx from 'xlsx';
import styled from 'styled-components';

// path => /course/[id]/dashboards/export
export default function Index() {
  return (<div>
    <Head>
      <title>Dashboard</title>
    </Head>
    <ClientOnly>
      <ExportPage/>
    </ClientOnly>
  </div>);
};

function ExportPage() {
  const router = useRouter();
  const {id: courseID} = router.query; // extract id from router.query and rename to courseID
  return <div>
    Hello {courseID}
  </div>;
};

export interface StudentUpload {
  studentID: string;
  studentEmail: string;
  studentName: string;
  studentSurname: string;
}

interface studentResult {
  studentID: string,
  studentName: string,
  scores: Array<Number>
}

export const ExportOutcome2: React.FC<{datas: studentResult[], head: string[]}> = ({datas, head}) => {
  const [show, setShow] = useState(false);
  const { register, handleSubmit, setValue } = useForm<{fileName: string, fileType: string}>();
  
  useEffect(() => {
    if (!show) {
      setValue('fileName', '');
      setValue('fileType', 'xlsx');
    }
  }, [show]);

  return(
    <div style={{display: "inline", float:"right"}}>
      <button onClick={() => setShow(true)} className="underline ">Export Outcome</button>
      <Modal show={show} onHide={() => setShow(false)} dialogClassName="modal-90w"> 
        <form onSubmit={handleSubmit((data) => {
          setShow(false);
          exportExcel2(datas, head, data.fileName, data.fileType);
        })}>
          <Modal.Header>
            <Modal.Title>Export Outcome</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p style={{ marginBottom: 0 }}>Choose file name and file type.</p>
            <span>You will export outcomes currently showing on the table</span>
            <br/>
            <div>
              <label>File Name : </label>
              <input type="text" {...register('fileName')} style={{transform: "scale(0.9)"}} 
              placeholder="Outcome Result" className="border rounded-md border-2 "/><br/>

              <label style={{paddingRight: 10}}>File Type : </label>
              <select {...register('fileType')} className="border rounded-md border-2 ">
                <option value={"xlsx"}>Excel</option>
                <option value={"csv"}>CSV</option>
                {/* <option value="pdf" onClick={() => setFileType("csv")}>PDF</option> */}
              </select>

            </div>
          </Modal.Body>
          <Modal.Footer>
            <input type="submit" value="Export" className="border rounded-md border-2 "/>
          </Modal.Footer>
        </form>
      </Modal>
    </div>)
}

function exportExcel2(datas: studentResult[], head: string[], fileName: string, fileType: string) {
  const wb = xlsx.utils.book_new();
  let data:string[][] = [[...head],]
  if(fileName === ''){fileName = 'Outcome Result'}
  for (let i = 1; i < datas.length; i++) {
    data.push([datas[i].studentID, datas[i].studentName]);
    for (let j = 0; j < datas[i].scores.length; j++) {
      data[i].push(datas[i].scores[j].toString());
      
    }
  }
  const sheet = xlsx.utils.json_to_sheet([{}], {});
  xlsx.utils.sheet_add_json(sheet, data, {origin: 'A3'});
  //quick fix to the blank row problem
  delete_row(sheet,0);delete_row(sheet,0);delete_row(sheet,0);
  xlsx.utils.book_append_sheet(wb, sheet);
  xlsx.writeFile(wb, fileName + '.' + fileType, {bookType: fileType as xlsx.BookType });
}

function ec(r: any, c: any) {
  return xlsx.utils.encode_cell({r: r, c: c});
}
function delete_row(ws: any, row_index: any) {
  var variable = xlsx.utils.decode_range(ws["!ref"])
  for (var R = row_index; R < variable.e.r; ++R) {
    for (var C = variable.s.c; C <= variable.e.c; ++C) {
      ws[ec(R, C)] = ws[ec(R + 1, C)];
    }
  }
  variable.e.r--
  ws['!ref'] = xlsx.utils.encode_range(variable.s, variable.e);
}

const OptionDiv = styled.div`
border-bottom: lightgrey 0.5px solid;
padding-bottom:5px;
margin-bottom:10px;
input{
  transform: scale(1.25);
  margin-right: 10px;
}
`;
