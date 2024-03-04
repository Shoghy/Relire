import { AsyncFunc, DefaultReturnedError } from "./types";

export function TitleCase(val: string): string {
  val = val.toLowerCase();
  const words = val.split(" ");

  let text: string = "";
  words.forEach((value, index) => {
    text += value.charAt(0).toUpperCase() + value.slice(1);
    if (index + 1 < words.length) text += " ";
  });
  return text;
}

export function GetEnumValues(val: string): string[] {
  if (!val) return [];

  const vals = val.split(",");
  const uniqueVals: string[] = [];
  vals.forEach((value) => {
    value = value.trim();
    if(value === "") return;
    if (uniqueVals.indexOf(value) === -1) uniqueVals.push(value);
  });
  return uniqueVals;
}

export function RandomString(length: number) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length - 1;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(RandomInt(0, charactersLength));
    counter += 1;
  }
  return result;
}

export function RandomInt(minInclusive:number, maxInclusive:number){
  return Math.floor(
    Math.random() * (maxInclusive - minInclusive + 1)
  )  + minInclusive;
}

export function IsValidDate(dateString : string) {
  return !isNaN(Date.parse(dateString));
}

export async function AsyncAttempter<E = DefaultReturnedError, T = unknown>(func: AsyncFunc<unknown[], T>): Promise<[T, null] | [null, E]>{
  try{
    const result = await func();
    return [result, null];
  }catch(e: any){
    return [null, e];
  }
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function RemoveIndexOfArray<T>(arr: Array<T>, index: number){
  const copyOfArray = [... arr];
  copyOfArray.splice(index, 1);
  return copyOfArray;
}

export function ChangeBodyColor(color: string){
  if(import.meta.env.SSR) return;
  document.body.style.backgroundColor = color;
}