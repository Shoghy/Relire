import express from "express";

type CRequest = express.Request;

type CResponse = express.Response;

type AdminHandler = (req: CRequest, res: CResponse) => void

type ReqInfo<T = object> = T & {
  auth: string
  type: "user" | "key"
}

interface GenericError{
  code: string
  message: string
}

interface DBInfo{
  dbUID: string
  dbName: string
}

interface ForeingKey{
  tableName: string
  column: string
}

interface Column{
  type: string
  name: string
  notNull: boolean
  unique: boolean
  foreingKey?: ForeingKey 
}

interface ApiKey{
  user: string
  dbUID: string
  random: string
}

interface Credentials{
  dbUID: string
  userUID: string
}

type VerifyAuth = (req: CRequest, res: CResponse) => Promise<Credentials | null>

interface Answer{
  ok: boolean
  error?: GenericError
}

interface Dictionary<T>{
  [key: string]: T
}
