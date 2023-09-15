let a = fetch("http://localhost:5173/api/create-db", {
  body: JSON.stringify({"hola": "mundo"}),
  method: "POST",
  headers: {
     "Content-Type": "application/json; charset=utf-8",
     'Accept': 'application/json'
  }
});
(async () => {
  let b = await a;
  console.log(await b.json());
})()