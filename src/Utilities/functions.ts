export function TitleCase(val: string):string{
  val = val.toLowerCase();
  let words = val.split(" ");

  let text: string = "";
  words.forEach((value, index) => {
    text += value.charAt(0).toUpperCase() + value.slice(1);
    if(index+1 < words.length) text += " ";
  })
  return text;
}

export function GetEnumValues(val:string):string[]{
  if(!val) return [];

  let vals = val.split(",");
  let uniqueVals:string[] = [];
  vals.forEach((value) => {
    while(value.startsWith(" ")){
      value = value.substring(1);
    }
    if(uniqueVals.indexOf(value) === -1) uniqueVals.push(value)
  })
  return uniqueVals;
}