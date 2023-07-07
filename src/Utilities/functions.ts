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

export function RandomString(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}