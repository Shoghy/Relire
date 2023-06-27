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