import { ChangeBodyColor, RemoveIndexOfArray } from "@/utilities/functions";
import NavBar from "@/components/NavBar";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./data_in_table.module.css";
import { useEffect, useState } from "react";
import { DeleteRow, GetDataInTable, GetTables, auth } from "@/utilities/DBclient";
import { selfDAlert } from "@/components/custom_alert";
import { DB } from "@/utilities/PageLocations";
import { selfLoadingCurtain } from "@/components/loading_curtain";
import { ColumnValue, Dictionary, IColumn } from "@/utilities/types";
import EnumarateColumns from "./tb_head";
import EnumarateRows from "./tb_body";

const DAlert = selfDAlert();
const loadingScreen = selfLoadingCurtain();
export default function DataInTable() {
  ChangeBodyColor("var(--nyanza)");
  const navigate = useNavigate();
  const params = useParams();
  const dbUID = params.idDB as string;
  const tableName = params.tbName as string;
  const [columns, setColumns] = useState<[string, IColumn][]>([]);
  const [rows, setRows] = useState<[string, Dictionary<ColumnValue>][]>([]);

  useEffect(() => {
    loadingScreen.open();
    GetTableInfo();
  }, []);

  async function RemoveRow(rowUID: string) {
    loadingScreen.open();
    const response = await DeleteRow(
      params.idDB as string,
      params.tbName as string,
      rowUID
    );

    loadingScreen.close();

    if (!response.ok) {
      DAlert.openWith({
        title: "Error",
        message: response.error?.message,
        buttons: [{
          text: "Ok",
          onClick: (self) => {
            self.close();
          }
        }]
      });
      return;
    }

    setRows((current) => {
      for (let i = 0; i < current.length; ++i) {
        const row = current[i];

        if (row[0] !== rowUID) continue;

        current = RemoveIndexOfArray(current, i);
        break;
      }
      return [...current];
    });

  }

  async function GetTableInfo() {
    await auth.authStateReady();
    if (auth.currentUser === null) return;

    const tableColumns = await GetTables(
      auth.currentUser.uid,
      dbUID,
      tableName
    );
    const tableRows = await GetDataInTable(
      auth.currentUser.uid,
      dbUID,
      tableName
    );

    loadingScreen.close();

    if ("error" in tableColumns || "error" in tableRows) {
      DAlert.openWith({
        title: "Error",
        message: "We were not able to get the data of this table",
        buttons: [{
          text: "Go Back",
          onClick: () => {
            navigate(DB(dbUID));
          }
        }]
      });
      return;
    }

    setColumns(Object.entries(tableColumns.val()));
    const rows = tableRows.val();
    if (rows !== null) {
      setRows(Object.entries(rows));
    }
  }

  return (
    <>
      <NavBar />
      <div className={styles["title-container"]}>
        <h1 className={styles.title}>{tableName}</h1>
        <button className={styles["change-tablename-btn"]}>
          <i className="fa fa-pencil" aria-hidden="true"></i>
        </button>
      </div>
      <div className={styles["table-container"]}>
        <table className={`mask ${styles.table}`} cellSpacing={0}>
          <thead>
            <tr>
              <EnumarateColumns columns={columns} />
            </tr>
          </thead>
          <tbody>
            <EnumarateRows
              rows={rows}
              columns={columns}
              RemoveRow={RemoveRow}
            />
          </tbody>
        </table>
      </div>
      <DAlert.Element showCloseButton={false} />
      <loadingScreen.Element />
    </>
  );
}